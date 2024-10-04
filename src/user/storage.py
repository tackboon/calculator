import json
import src.common.response.custom_error as custom_error

from dataclasses import asdict
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from redis import Redis
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from typing import Any, Callable, Optional, Tuple

from src.common.auth.auth import JWTStorage, SessionData, UserInfo
from src.common.config.config import Config
from src.common.redis.redis import hset_with_expiry, hset_if_exist
from src.extensions import app_logger
from src.user.models import UserModel, SessionModel


class UserStorage(JWTStorage):
  def __init__(self, config: Config, db: SQLAlchemy, rdb: Redis):
    self.db = db
    self.rdb = rdb
    self.config = config

  def get_user_by_username(self, username: str) -> Optional[UserModel]:
    """
    Search user by username.
    Return user data.
    """

    return UserModel.query.filter(UserModel.username == username).first()

  def get_user_by_id(self, user_id: int) -> Optional[UserModel]:
    """
    Get user data by id.
    Return user data.
    """

    key, duration = self._get_user_cache_info(user_id)

    # Retrieve user data from cache
    user_cache_byte: Optional[bytes] = self.rdb.get(key)
    if user_cache_byte is not None:
      # If user not found
      if user_cache_byte == b"":
        return None
      
      # Return cache data
      user_dict = json.loads(user_cache_byte)
      return UserModel.from_dict(user_dict)

    # Get user data from db
    user: UserModel = UserModel.query.filter(UserModel.id == user_id).first()

    # Write db data to cache
    user_str = ""
    if user is not None:
      user_str = json.dumps(user.to_dict())

    if not self.rdb.set(key, user_str, duration):
      app_logger.error(f"Failed to write user data to cache, key: {key}.")

    return user    
  
  def get_user_for_jwt(self, user_id: int) -> Optional[UserInfo]:
    """
    Get user info for authentication use.
    Return user info.
    """

    user = self.get_user_by_id(user_id)
    if user is None:
      return None
    
    return UserInfo(user.id, user.username, user.deleted_at, user.role)

  def create_new_user(self, username: str, password: str) -> UserModel:
    """
    Create and return new user. Username must be unique.
    """
    
    user = UserModel(username=username, password=password)

    try:
      self.db.session.add(user)
      self.db.session.commit()
    except IntegrityError:
      raise custom_error.ResourceConflictError("Username already exists.")
    
    return user

  def save_session_token(self, user_id: int, session_id: str, access_token: str, refresh_token: str):
    """
    Save session token to cache.
    """

    # Get cache info
    key, duration = self._get_session_cache_info(user_id)
    now = int(datetime.now().timestamp())
    session_data = SessionData(
      access_token=access_token, 
      refresh_token=refresh_token, 
      issued_at=now,
      last_online=now
    )
    session_json = json.dumps(asdict(session_data))

    # Save session
    hset_with_expiry(self.rdb, key, session_id, session_json, duration)

  def get_session_token(self, user_id: int, session_id: str) -> Tuple[Optional[SessionData], int]:
    """
    Retrieve session token from cache.
    """

    key, duration = self._get_session_cache_info(user_id)

    # Fetch the token data from cache
    session_bytes = self.rdb.hget(key, session_id)
    if session_bytes is None:
      return None, duration
    
    # Decode the bytes to a string and deserialize it into a dictionary
    session_token_dict = json.loads(session_bytes)

    return SessionData(
      access_token=session_token_dict["access_token"],
      refresh_token=session_token_dict["refresh_token"], 
      issued_at=session_token_dict["issued_at"],
      last_online=session_token_dict["last_online"]
    ), duration
  
  def get_user_sessions_token(self, user_id: int) -> dict[str, Any]:
    """
    Retrieve all of the user's session tokens.
    """

    key, _ = self._get_session_cache_info(user_id)

    # Fetch the tokens data from cache
    bytes_dict: dict[bytes, bytes] = self.rdb.hgetall(key)
    
    # Decode the bytes to a string and deserialize it into a dictionary
    sessions_token_dict = {
      k.decode('utf-8'): json.loads(v.decode('utf-8')) for k, v in bytes_dict.items()
    }

    return sessions_token_dict

  def delete_sessions_token(self, user_id: int, *session_ids: str):
    """
    Delete sessions in cache.
    """

    key, _ = self._get_session_cache_info(user_id)
    if session_ids:
      self.rdb.hdel(key, *session_ids)

  def update_session_last_online(self, user_id: int, session_id: str, last_online: int) -> bool:
    """
    Update session's last online in cache.
    Return true if success.
    """

    # get session from cache
    session, lifetime = self.get_session_token(user_id, session_id)
    if session is None:
      raise custom_error.UnauthorizedError(
        f"Session not found when updating last online, user_id: {user_id}, session_id: {session_id}"
      )
    
    # update session's last online
    key, _ = self._get_session_cache_info(user_id)
    session.last_online = last_online
    session_json = json.dumps(asdict(session))

    # Save session
    return hset_if_exist(self.rdb, key, session_id, session_json) == 1

  def create_session_info(self, user_id: int, session_id: str, ip: str, location: str, device_id: str, 
                          device_name: str) -> Optional[SessionModel]:
    """
    Insert session info into db.
    """

    info = SessionModel(
      user_id=user_id,
      session_id=session_id,
      last_ip=ip,
      last_location=location,
      device_id=device_id,
      device_name=device_name,
    )

    try:
      self.db.session.add(info)
      self.db.session.commit()
    except IntegrityError:
      return None
    
    return info

  def update_session_info(self, user_id: int, session_id: str, last_ip: str, last_location: str,
                          last_online: int):
    """
    Update session info in db.
    """

    stmt = (
      update(SessionModel)
      .where(
        SessionModel.user_id == user_id,
        SessionModel.session_id == session_id
      )
      .values(last_ip=last_ip, last_location=last_location, last_online=last_online)
    )

    self.db.session.execute(stmt)
    self.db.session.commit()

  def session_lock_wrapper(self, user_id: int, func: Callable[..., Any], 
                           *args: Any, **kwargs: Any) -> Any:
    """
    Acquire session lock in cache for the given user_id and execute the passed function.
    Return the result of func.
    """
    key, duration = self._get_session_lock_cache_info(user_id)

    # Acquire lock with a specific timeout
    lock = self.rdb.lock(key, blocking_timeout=duration)

    # Attempt to acquire the lock
    with lock:
      # Execute the passed function inside the lock
      result = func(*args, **kwargs)
      
    return result

  def _get_user_cache_info(self, user_id: int) -> tuple[str, int]:
    """
    Retrieve user data cache key and cache duration.
    """

    return f"user:data:{user_id}", 3600

  def _get_session_cache_info(self, user_id: int) -> tuple[str, int]:
    """
    Retrieve session cache key and cache duration.
    """

    return f"user:session:{user_id}", self.config.session_lifetime

  def _get_session_lock_cache_info(self, user_id: int) -> tuple[str, int]:
    """
    Retrieve session lock cache key and cache duration.
    """

    return f"user:session_lock:{user_id}", 3
  