import base64
import uuid

import src.common.error as common_error

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from src.app.user.models import UserModel
from src.app.user.repository import UserRepo
from src.app.user.constants import RESET_PASSWORD_SEND_COOLDOWN
from src.config import Config
from src.common.crypto.hash import hash_password, verify_password
from src.common.time import convert_timestamp_to_datetime
from src.service.auth import check_session_expired
from src.service.auth.token import generate_token, SessionToken
from src.service.email import SendEmailService
from src.service.ip import IP2LocationServicer


class UserService:
  def __init__(self, config: Config, repo: UserRepo, ip_location: IP2LocationServicer,
               email_service: SendEmailService):
    self.config = config
    self.repo = repo
    self.ip_location = ip_location
    self.email_service = email_service

  def register(self, email: str, password: str, ip: str, device_id: str, device_name: str
               ) -> tuple[UserModel, str, str]:
    """
    Register a new user. Email must be unique. 
    Return new user data, access token, and refresh_token.
    """

    # Hash the password and encode it to base64
    hashed_password = base64.b64encode(hash_password(password, 16)).decode("utf-8")

    # Create new user
    user = self.repo.create_new_user(email, hashed_password)

    # Create session info
    session_id = self._create_session_info(user.id, ip, device_id, device_name)

    if session_id is None:
      raise Exception(f"Session id already exists, user_id: {user.id}.")

    # Generate session token
    session_token = self._generate_and_save_session_token_with_lock(user.id, session_id, True)
    return user, session_token.access_token, session_token.refresh_token

  def login(self, email: str, password: str, ip: str, device_id: str, device_name: str
            ) -> tuple[UserModel, str, str]:
    """
    User login with email and password.
    Return user data, access token and refresh token.
    """
    
    # Retrieve user data from db
    user = self.repo.get_user_by_email(email)
    if user is None:
      raise common_error.UnauthorizedError("User record not found.")

    # Check is user valid to login
    if user.blocked_at != 0 or user.deleted_at != 0:
      raise common_error.UnauthorizedError("User has been blocked or deleted.")

    # Verify user's password
    stored_password = base64.b64decode(user.password)
    if not verify_password(stored_password, password, 16):
      raise common_error.UnauthorizedError("Password mismatch.")

    # Create session info
    session_id = self._create_session_info(user.id, ip, device_id, device_name)
    if session_id is None:
      raise Exception(f"Session id already exists, user_id: {user.id}.")

    # Generate session token
    session_token = self._generate_and_save_session_token_with_lock(user.id, session_id, True)
    return user, session_token.access_token, session_token.refresh_token

  def logout(self, user_id: int, session_id: str):
    """
    Logout session by deleting session token.
    """

    self.repo.delete_sessions_token(user_id, session_id)

  def refresh_token(self, user_id: int, session_id: str) -> tuple[str, str]:   
    """
    Refresh session's token.
    Return access token, refresh token.
    """
    
    session_token = self._generate_and_save_session_token_with_lock(user_id, session_id, False)
    return session_token.access_token, session_token.refresh_token

  def heartbeat(self, user_id: int, session_id: str, ip: str):
    """
    Update session info and keep the session alive.
    """

    last_online = int(datetime.now().timestamp())

    # Update last online in session's cache
    if not self.repo.update_session_last_online(user_id, session_id, last_online):
      raise common_error.UnauthorizedError(
        f"Session id not exists, user_id: {user_id}, session_id: {session_id}."
      ) 

    # Get location info from ip address
    city, country = self.ip_location.get_city_and_country(ip)
    location = f"{city},{country}"

    # Update session info in the db
    self.repo.update_session_info(user_id, session_id, ip, location, last_online)
       
  def block_user(self, user_id: int):
    """
    Block user by user id.
    """

    self.repo.block_user(user_id)
    
  def remove_all_sessions(self, user_id: int):
    """
    Remove user's all sessions.
    """

    self.repo.remove_all_sessions(user_id)
  
  def check_email_exists(self, email: str) -> bool:
    """
    Check if a email is already taken.
    Return true if email is exists, else return false.
    """

    # Get user data from db
    user = self.repo.get_user_by_email(email)
    if user is not None:
      return True
    
    return False
  
  def send_reset_password_link(self, ip: str, email: str):
    """
    Send reset password link to user via email.
    """

    # Check if email exists
    user = self.repo.get_user_by_email(email)
    if user is None:
      raise common_error.NotFoundError("Email record not found.")
    
    # Check if user available
    if user.deleted_at != 0 or user.blocked_at != 0:
      return None
      
    # Check for cooldown
    cache = self.repo.get_reset_password_secret(email)
    if cache is not None and (cache.issued_at + RESET_PASSWORD_SEND_COOLDOWN) > int(datetime.now().timestamp()):
      raise common_error.TooManyRequestError("Send reset password link on cooldown")

    # Generate reset password secret
    secret = str(uuid.uuid4())
    expiry = self.repo.save_reset_password_secret(email, secret)
    
    # Get user timezone and convert expiry to datetime
    tz = self.ip_location.get_timezone(ip)
    if tz == "-":
      tz = "00:00"
    formated_expiry = convert_timestamp_to_datetime(float(expiry), tz)

    # Create reset password link
    link = f"{self.config.reset_password_link}?secret={secret}&exp={expiry}"

    # Get email template
    subject, content = self.email_service.get_reset_password_template(link, formated_expiry)

    # Send reset password link to email
    self.email_service.send_email([email], subject, content)

  def _create_session_info(self, user_id: int, ip: str, device_id: str, device_name: str
                           ) -> Optional[str]:
    """
    Create session info to db.
    Return session id.
    """

    # Get location info from ip
    city, country = self.ip_location.get_city_and_country(ip)
    location = f"{city},{country}"

    # Create session info
    retry = 0
    session_id: Optional[str] = None
    while retry < 3:
      session_id = str(uuid.uuid4())
      session = self.repo.create_session_info(
        user_id, 
        session_id, 
        ip, 
        location, 
        device_id, 
        device_name
      )

      if session is not None:
        break
      retry += 1

    return session_id

  def _generate_and_save_session_token(self, user_id: int, session_id: str, is_fresh_token: bool
                                       ) -> SessionToken:
    """
    Generates and saves session token.
    Return access_token, refresh_token, session_id, and user_id.
    """

    # Get all of the user's session tokens
    sessions = self.repo.get_user_sessions_token(user_id)

    # Find expired sessions
    valid_sessions: dict[str, Any] = {}
    sessions_to_remove: set[str] = set()
    for key, value in sessions.items():
      if check_session_expired(value["last_online"], self.config.session_lifetime):
        sessions_to_remove.add(key)
      else:
        valid_sessions[key] = value

    # Get the oldest sessions if maximum session limit is exceeded.
    exceed_session_count = len(valid_sessions) - self.config.max_session_per_user + 1
    if exceed_session_count > 0:
      # Sort sessions by last online in ascending order (oldest first)
      sorted_sessions = sorted(valid_sessions.items(), key=lambda session: session[1]["last_online"])
      for i in range(exceed_session_count):
        sessions_to_remove.add(sorted_sessions[i][0])

    # Remove sessions
    if len(sessions_to_remove) > 0:
      self.repo.delete_sessions_token(user_id, *sessions_to_remove)

    # Generate session token
    session_token = generate_token(
      user_id=user_id, 
      session_id=session_id, 
      is_fresh_token=is_fresh_token, 
      expires_delta=timedelta(seconds=self.config.access_token_lifetime)
    )

    # Save session token to cache
    self.repo.save_session_token(
      user_id=user_id, 
      session_id=session_id, 
      access_token=session_token.access_token, 
      refresh_token=session_token.refresh_token
    )

    return session_token

  def _generate_and_save_session_token_with_lock(self, user_id: int, session_id: str, 
                                                 is_fresh_token: bool) -> SessionToken:
    """
    Generates and saves session token with session lock.
    Return access_token, refresh_token, session_id, and user_id.
    """

    return self.repo.session_lock_wrapper(
      user_id, 
      self._generate_and_save_session_token, 
    )(user_id, session_id, is_fresh_token)
  