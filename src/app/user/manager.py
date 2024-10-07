import base64
import uuid

import src.common.error as error

from datetime import datetime, timedelta
from typing import Any, Optional

from src.app.user.models import UserModel
from src.app.user.repository import UserRepo
from src.config import Config
from src.common.crypto.hash import hash_password, verify_password
from src.service.auth import check_session_expired
from src.service.auth.token import generate_token, SessionToken
from src.service.ip import IP2LocationServicer


class UserService:
  def __init__(self, config: Config, repo: UserRepo, ip_location: IP2LocationServicer):
    self.config = config
    self.repo = repo
    self.ip_location = ip_location

  def register(self, username: str, password: str, ip: str, device_id: str, device_name: str
               ) -> tuple[UserModel, str, str]:
    """
    Register a new user. Username must be unique. 
    Return new user data, access token, and refresh_token.
    """

    # Hash the password and encode it to base64
    hashed_password = base64.b64encode(hash_password(password, 16)).decode("utf-8")

    # Create new user
    user = self.repo.create_new_user(username, hashed_password)

    # Create session info
    session_id = self._create_session_info(user.id, ip, device_id, device_name)

    if session_id is None:
      raise Exception(f"Session id already exists, user_id: {user.id}.")

    # Generate session token
    session_token = self._generate_and_save_session_token_with_lock(user.id, session_id, True)
    return user, session_token.access_token, session_token.refresh_token

  def login(self, username: str, password: str, ip: str, device_id: str, device_name: str
            ) -> tuple[UserModel, str, str]:
    """
    User login with username and password.
    Return user data, access token and refresh token.
    """
    
    # Retrieve user data from db
    user = self.repo.get_user_by_username(username)
    if user is None:
      raise error.UnauthorizedError("User record not found.")

    # Verify user's password
    stored_password = base64.b64decode(user.password)
    if not verify_password(stored_password, password, 16):
      raise error.UnauthorizedError("Password mismatch.")

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
      raise error.UnauthorizedError(
        f"Session id not exists, user_id: {user_id}, session_id: {session_id}."
      ) 

    # Get location info from ip address
    city, country = self.ip_location.get_city_and_country(ip)
    location = f"{city},{country}"

    # Update session info in the db
    self.repo.update_session_info(user_id, session_id, ip, location, last_online)
       
  def check_username_availability(self, username: str):
    """
    Check if a username is already taken
    """

    # Get user data from db
    user = self.repo.get_user_by_username(username)
    if user is not None:
      raise error.ResourceConflictError("Username already exists.")

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
  