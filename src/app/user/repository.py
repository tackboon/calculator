import json
import src.common.error as common_error

from dataclasses import asdict
from datetime import datetime
from functools import wraps
from redis import Redis
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from typing import Any, Callable, cast, Optional, Tuple, Union

from src.app.user.models import UserModel, ResetPasswordCacheModel, SessionModel
from src.common.inspect import get_caller_name
from src.config import Config
from src.extensions import app_logger
from src.service.auth import JWTRepo, SessionData, UserInfo
from src.service.redis import RedisServicer
from src.service.sql_alchemy import SQLAlchemyServicer


class UserRepo(JWTRepo):
  rdb: Union[Redis, RedisServicer]

  def __init__(self, config: Config, db: SQLAlchemyServicer, rdb: RedisServicer):
    self.db = db
    self.rdb = rdb
    self.config = config

  def get_user_by_email(self, email: str) -> Optional[UserModel]:
    """
    Search user by email.
    Return user data if found, else None.
    """

    return UserModel.query.filter(UserModel.email == email).first()

  def get_user_by_id(self, user_id: int) -> Optional[UserModel]:
    """
    Get user data by id.
    Return user data if found, else None.
    """

    key, duration = self._get_user_cache_info(user_id)

    # Retrieve user data from cache
    user_cache_byte: Optional[bytes] = self.rdb.get(key)
    if user_cache_byte is not None:
      # If user not found in cache
      if user_cache_byte == b"":
        return None
      
      # Return user data from cache
      user_dict = json.loads(user_cache_byte)
      return UserModel.from_dict(user_dict)

    # Get user data from db
    user: Optional[UserModel] = UserModel.query.filter(UserModel.id == user_id).first()

    # Cache db result
    user_str = json.dumps(user.to_dict()) if user is not None else ""
    if not self.rdb.set(key, user_str, duration):
      app_logger.error(f"Failed to write user data to cache, key: {key}.")

    return user    
  
  def get_user_for_jwt(self, user_id: int) -> Optional[UserInfo]:
    """
    Get user info for JWT authentication.
    Return user info if found, else None.
    """

    user = self.get_user_by_id(user_id)
    if user is None:
      return None
    
    # Verify if the user is valid
    if user.deleted_at != 0 or user.blocked_at != 0:
      return None
    
    return UserInfo(user.id, user.email, user.deleted_at, user.role)

  def create_new_user(self, email: str, password: str) -> UserModel:
    """
    Create and return new user. Email must be unique.
    Return user data if create success.
    """
    
    user = UserModel(email=email, password=password)

    try:
      self.db.client.session.add(user)
      self.db.client.session.commit()
    except IntegrityError:
      raise common_error.ResourceConflictError("Email already exists.")
    
    return user

  def block_user(self, user_id: int):
    """
    Block user by user id.
    """

    # Update block time in db
    stmt = (
      update(UserModel)
      .where(UserModel.id == user_id)
      .values(blocked_at=int(datetime.now().timestamp()))
    )

    self.db.client.session.execute(stmt)
    self.db.client.session.commit()

    # Delete user's info and session in cache
    userCacheKey, _ = self._get_user_cache_info(user_id)
    sessionCacheKey, _ = self._get_session_cache_info(user_id)
    self.rdb.delete(userCacheKey, sessionCacheKey)

  def remove_all_sessions(self, user_id: int):
    """
    Remove user's all sessions.
    """

    key, _ = self._get_session_cache_info(user_id)
    self.rdb.delete(key)

  def save_session_token(self, user_id: int, session_id: str, access_token: str, refresh_token: str):
    """
    Save session token in redis with expiration.
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

    # Save session data to redis
    casted_rdb = cast(RedisServicer, self.rdb)
    casted_rdb.hset_with_expiry(key, session_id, session_json, duration)

  def get_session_token(self, user_id: int, session_id: str) -> Tuple[Optional[SessionData], int]:
    """
    Retrieve session token from redis cache.
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
    Retrieve all of the user's session tokens from Redis.
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
    Delete specific session token from redis cache.
    """

    key, _ = self._get_session_cache_info(user_id)
    if session_ids:
      self.rdb.hdel(key, *session_ids)

  def update_session_last_online(self, user_id: int, session_id: str, last_online: int) -> bool:
    """
    Update session's last online in redis cache.
    Return true if success.
    """

    # get session from cache
    session, lifetime = self.get_session_token(user_id, session_id)
    if session is None:
      raise common_error.UnauthorizedError(
        f"Session not found when updating last online, user_id: {user_id}, session_id: {session_id}"
      )
    
    # update session's last online
    key, _ = self._get_session_cache_info(user_id)
    session.last_online = last_online
    session_json = json.dumps(asdict(session))

    # Save session
    casted_rdb = cast(RedisServicer, self.rdb)
    return casted_rdb.hset_if_exist(key, session_id, session_json) == 1

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
      self.db.client.session.add(info)
      self.db.client.session.commit()
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

    self.db.client.session.execute(stmt)
    self.db.client.session.commit()

  def session_lock_wrapper(self, user_id: int, func: Callable[..., Any]) -> Callable[..., Any]:
    """
    A decorator to acquire a Redis-based session lock for the given user_id, execute the 
    provided function, and release the lock once the function completes.

    The function retrieves a session lock for the specified user_id from Redis, 
    ensuring that the function passed as `func` is executed exclusively while the lock is held.
    After execution, the lock is released.

    Parameters:
    - user_id: The user identifier for which the session lock is acquired.
    - func: The function to be executed while holding the lock.
    
    Returns:
    - A wrapped function that acquires the session lock, executes `func`, and releases the lock.
    """

    caller = get_caller_name()

    @wraps(func)
    def wrapper(*args: Any, **kwargs: Any):
      key, duration = self._get_session_lock_cache_info(user_id)

      # Acquire lock with a specific timeout
      casted_rdb = cast(RedisServicer, self.rdb)
      lock = casted_rdb.custom_lock(key, blocking_timeout=duration, caller=caller)

      # Attempt to acquire the lock
      with lock:
        # Execute the passed function inside the lock
        return func(*args, **kwargs)

    return wrapper
  
  def save_reset_password_secret(self, email: str, secret: str) -> int:
    """
    Save reset password secret to cache
    Return link's expiry.
    """

    # Get cache key and duration
    key, duration = self._get_reset_password_cache_info(email)

    # Save secret to 
    now = int(datetime.now().timestamp())
    json_data = json.dumps(asdict(ResetPasswordCacheModel(secret=secret, issued_at=now)))
    self.rdb.set(key, json_data, duration)

    return now + duration
  
  def get_reset_password_secret(self, email: str) -> Optional[ResetPasswordCacheModel]:
    """
    Retrieve user's reset password secret from cache.
    Return the cache data.
    """

    # Get cache key and duration
    key, _ = self._get_reset_password_cache_info(email)

    # Retrieve secret from cache
    cache_bytes:Optional[bytes] = self.rdb.get(key)
    if cache_bytes is None:
      return None
    
    # Return reset password secret cache data
    reset_dict = json.loads(cache_bytes)
    return ResetPasswordCacheModel(**reset_dict)

  def _get_user_cache_info(self, user_id: int) -> tuple[str, int]:
    """
    Construct user data cache key and cache duration.
    """

    return f"user:data:{user_id}", 3600

  def _get_session_cache_info(self, user_id: int) -> tuple[str, int]:
    """
    Construct session cache key and cache duration.
    """

    return f"user:session:{user_id}", self.config.session_lifetime

  def _get_session_lock_cache_info(self, user_id: int) -> tuple[str, int]:
    """
    Construct session lock cache key and cache duration.
    """

    return f"user:session_lock:{user_id}", 3
  
  def _get_reset_password_cache_info(self, email: str) -> tuple[str, int]:
    """
    Construct reset password cache key and cache duration.
    """

    return f"user:reset:{email}", 600
  