import base64
import uuid
import random

import src.app.user.constant as constant
import src.common.error as common_error

from datetime import datetime

from src.app.user.model import OTPTyp, UserModel
from src.app.user.repository import Repository
from src.config import Config
from src.common.crypto.hash import hash_password, verify_password
from src.common.time import convert_timestamp_to_datetime
from src.service.auth.token import generate_auth_token, generate_reset_token, SessionToken
from src.service.email import SendEmailService
from src.service.ip import IP2LocationServicer


class UserService:
  def __init__(self, config: Config, repo: Repository, ip_location: IP2LocationServicer,
    email_service: SendEmailService):

    self.config = config
    self.repo = repo
    self.ip_location = ip_location
    self.email_service = email_service

  def register(self, email: str, password: str, ip: str, device_name: str, otp_code: str
    ) -> tuple[UserModel, str, str]:
    """
    Register a new user. Email must be unique. 
    Return new user data, access token, and refresh_token.
    """

    if not self.verify_otp(OTPTyp.REGISTER.value, email, otp_code):
      raise common_error.UnauthorizedError("Failed to verify OTP.")

    # Hash the password and encode it to base64
    hashed_password = base64.b64encode(hash_password(password, 16)).decode("utf-8")

    # Create new user
    user = self.repo.user.create_new_user(email, hashed_password)

    # Create session info
    session = self._create_auth_session(user.id, ip, device_name)
    return user, session.access_token, session.refresh_token

  def login(self, email: str, password: str, ip: str, device_name: str
    ) -> tuple[UserModel, str, str]:
    """
    User login with email and password.
    Return user data, access token and refresh token.
    """
    
    # Retrieve user data from db
    user = self.repo.user.get_user_by_email(email)
    if user is None:
      raise common_error.UnauthorizedError("User record not found.")

    # Check is user valid to login
    if user.blocked_at != 0 or user.deleted_at != 0:
      raise common_error.UnauthorizedError("User has been blocked or deleted.")

    # Check login attempts
    login_count = self.repo.session.incr_login_attempts(user.id)
    if login_count > constant.MAX_LOGIN_ATTEMPTS_COUNT:
      raise common_error.TooManyRequestError("Too many login attempts")

    # Verify user's password
    stored_password = base64.b64decode(user.password)
    if not verify_password(stored_password, password, 16):
      raise common_error.UnauthorizedError("Password mismatch.")

    # Create session info
    session_token = self._create_auth_session(user.id, ip, device_name)
    if session_token is None:
      raise Exception(f"Session id already exists, user_id: {user.id}.")

    # Remove sessions that exceed the maximum session count.
    self.repo.session.remove_auth_sessions(
      user.id, constant.MAX_SESSION_PER_USER, constant.REFRESH_TOKEN_LIFETIME
    )

    # Clear login attempts
    self.repo.session.remove_login_attempts(user.id)

    return user, session_token.access_token, session_token.refresh_token

  def logout(self, user_id: int, session_id: str):
    """
    Logout session by deleting session token.
    """

    self.repo.session.remove_auth_session_by_id(user_id, session_id)

  def refresh_token(self, user_id: int, session_id: str) -> tuple[str, str]:   
    """
    Refresh session's token.
    Return access token, refresh token.
    """

    # Update session in db
    new_access_id = str(uuid.uuid4())
    new_refresh_id = str(uuid.uuid4())
    self.repo.session.update_auth_session(user_id, session_id, new_access_id, new_refresh_id)

    session_token = generate_auth_token(user_id, session_id, new_access_id, new_refresh_id, False, 
      constant.ACCESS_TOKEN_LIFETIME, constant.REFRESH_TOKEN_LIFETIME)
    
    return session_token.access_token, session_token.refresh_token
       
  def block_user(self, user_id: int):
    """
    Block user by user id.
    """

    self.repo.user.block_user_by_id(user_id)

  def remove_all_sessions(self, user_id: int):
    """
    Remove user's all sessions.
    """

    self.repo.session.remove_auth_sessions(user_id, 0)
  
  def check_email_exists(self, email: str) -> bool:
    """
    Check if a email is already taken.
    Return true if email is exists, else return false.
    """

    # Get user data from db
    user = self.repo.user.get_user_by_email(email)
    if user is not None:
      return True
    
    return False
  
  def send_otp(self, ip: str, typ: int, email: str):
    """
    Send OTP to email
    """
    
    # Check OTP requests limit by ip
    if self.repo.session.update_ip_limit(ip) > constant.MAX_OTP_REQUEST_BY_IP:
      raise common_error.TooManyRequestError("Too many requests.")

    # Check is email already registered
    if typ == OTPTyp.REGISTER.value and self.check_email_exists(email):
      raise common_error.ResourceConflictError("Email already exists.")

    code = str(random.randint(1000, 9999))

    # Hash the otp code and encode it to base64
    hashed_otp = base64.b64encode(hash_password(code, 0)).decode("utf-8")

    is_success, expiry = self.repo.session.save_otp_session(typ, email, hashed_otp)
    if not is_success:
      raise common_error.TooManyRequestError("Send OTP on cooldown")

    # Get user timezone and convert expiry to datetime
    tz = self.ip_location.get_timezone(ip)
    if tz == "-":
      tz = "00:00"
    formated_expiry = convert_timestamp_to_datetime(float(expiry), tz)

    # Get email template
    subject, content = self.email_service.get_otp_template(code, formated_expiry)

    # Send otp to email
    self.email_service.send_email([email], subject, content)

  def verify_otp(self, typ: int, email: str, code: str) -> bool:
    """
    Verify OTP
    """

    # Hash the otp code and encode it to base64
    hashed_otp = base64.b64encode(hash_password(code, 0)).decode("utf-8")

    # Verify OTP
    return self.repo.session.verify_otp_session(typ, email, hashed_otp)

  def send_reset_password_link(self, ip: str, email: str):
    """
    Send reset password link to user via email.
    """

    # Check if email exists
    user = self.repo.user.get_user_by_email(email)
    if user is None:
      raise common_error.NotFoundError("Email record not found.")
    
    # Check if user available
    if user.deleted_at != 0 or user.blocked_at != 0:
      return None
      
    # Check for cooldown
    cache = self.repo.session.get_reset_password_session(user.id, False)
    if cache is not None and (cache.issued_at + constant.RESET_PASSWORD_SEND_COOLDOWN.seconds) > int(datetime.now().timestamp()):
      raise common_error.TooManyRequestError("Send reset password link on cooldown")

    # Generate reset password token
    session_id = str(uuid.uuid4())
    token = generate_reset_token(user.id, email, session_id, constant.RESET_PASSWORD_TOKEN_LIFETIME)
    expiry = self.repo.session.save_reset_password_session(user.id, session_id)
    
    # Get user timezone and convert expiry to datetime
    tz = self.ip_location.get_timezone(ip)
    if tz == "-":
      tz = "00:00"
    formated_expiry = convert_timestamp_to_datetime(float(expiry), tz)

    # Create reset password link
    link = f"{self.config.reset_password_link}?token={token}"

    # Get email template
    subject, content = self.email_service.get_reset_password_template(link, formated_expiry)

    # Send reset password link to email
    self.email_service.send_email([email], subject, content)

  def reset_password(self, user_id: int, session_id: str, new_password: str,):
    """
    Reset user's password
    """

    # Check for token validity
    cache = self.repo.session.get_reset_password_session(user_id, True)
    if cache is None or cache.session_id != session_id:
      raise common_error.UnauthorizedError("Invalid reset password session id")
    
    # Hash the password and encode it to base64
    hashed_password = base64.b64encode(hash_password(new_password, 16)).decode("utf-8")

    # Change password
    self.repo.user.update_user_password(user_id, hashed_password)

    # Logout all sessions
    self.remove_all_sessions(user_id)

    # Remove login attempts
    self.repo.session.remove_login_attempts(user_id)

    # Remove reset password session
    self.repo.session.remove_reset_password_session(user_id)

  def _create_auth_session(self, user_id: int, ip: str, device_name: str) -> SessionToken:
    """
    Create session info into the db. Generate auth session tokens.
    """

    # Get location info from ip
    city, country = self.ip_location.get_city_and_country(ip)
    location = f"{city},{country}"

    # Create session info
    retry = 0
    session_id = ""
    access_id = str(uuid.uuid4())
    refresh_id = str(uuid.uuid4())
    while retry < 3:
      session_id = str(uuid.uuid4())
      session = self.repo.session.create_auth_session(user_id, session_id, access_id, refresh_id,
                  ip, location, device_name)

      if session is not None:
        break
      retry += 1

    if retry >= 3:
      raise Exception(f"Session id already exists, user_id: {user_id}.")
    
    return generate_auth_token(user_id, session_id, access_id, refresh_id, True, 
            constant.ACCESS_TOKEN_LIFETIME, constant.REFRESH_TOKEN_LIFETIME)
  