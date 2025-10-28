import json

import src.common.error as common_error

from datetime import datetime
from redis import Redis
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from typing import Optional, Union

from src.app.user.model import UserModel
from src.extensions import app_logger
from src.service.auth import UserInfo
from src.service.redis import RedisServicer
from src.service.sql_alchemy import SQLAlchemyServicer


class UserRepo:
  rdb: Union[Redis, RedisServicer]

  def __init__(self, db: SQLAlchemyServicer, rdb: RedisServicer):
    self.db = db
    self.rdb = rdb
    
  def block_user_by_id(self, user_id: int):
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

    # Delete user's info in cache
    userCacheKey, _ = self._get_user_cache_info(user_id)
    self.rdb.delete(userCacheKey)
  
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

  def update_user_password(self, user_id: int, new_password: str):
    """
    Update user's password
    """

    # Update user's password
    stmt = (
      update(UserModel)
      .where(
        UserModel.id == user_id,
        UserModel.deleted_at == 0,
        UserModel.blocked_at == 0
      )
      .values(password=new_password, reset_password_at=int(datetime.now().timestamp()))
    )

    self.db.client.session.execute(stmt)
    self.db.client.session.commit()

    # Remove user cache
    key, _ = self._get_user_cache_info(user_id)
    self.rdb.delete(key)

  def _get_user_cache_info(self, user_id: int) -> tuple[str, int]:
    """
    Construct user data cache key and cache duration.
    """

    return f"user:data:{user_id}", 3600
  