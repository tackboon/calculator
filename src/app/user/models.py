import time

from sqlalchemy import Column, Integer, String, SmallInteger
from sqlalchemy.dialects.postgresql import INET
from sqlalchemy.ext.declarative import DeclarativeMeta
from typing import Any, Type

from src.extensions import db_service

Model: Type[DeclarativeMeta] = db_service.client.Model

class UserModel(Model):
  __tablename__ = "users"

  id = Column(Integer, primary_key=True)
  username = Column(String(100), nullable=False, unique=True)
  password = Column(String(255), nullable=False)
  created_at = Column(Integer, nullable=False, default=lambda: int(time.time()))
  deleted_at = Column(Integer, nullable=False, default=0)
  role = Column(SmallInteger, nullable=False, default=0)

  def to_dict(self) -> dict[str, Any]:
    """
    Convert model instance to dictionary.
    """

    return {
      "id": self.id,
      "username": self.username,
      "password": self.password,
      "created_at": self.created_at,
      "deleted_at": self.deleted_at,
      "role": self.role
    }

  @staticmethod
  def from_dict(data: dict[str, Any]) -> "UserModel":
    """
    Create a new instance from a dictionary.

    Parameters:
    - data: A dictionary with user data.

    Returns:
    - UserModel: A new UserModel instance populated with the dictionary's data.
    """

    return UserModel(
      id = data.get("id"),
      username = data.get("username"),
      password = data.get("password"),
      created_at = data.get("created_at"),
      deleted_at = data.get("deleted_at"),
      role = data.get("role")
    )
  

class SessionModel(Model):
  __tablename__ = "sessions"

  user_id = Column(Integer, primary_key=True)
  session_id = Column(String(255), primary_key=True)
  created_at = Column(Integer, nullable=False, default=lambda: int(time.time()))
  last_online = Column(Integer, nullable=False, default=lambda: int(time.time()))
  last_ip = Column(INET, nullable=False)
  last_location = Column(String(100), nullable=False)
  device_name = Column(String(255), nullable=False)
  device_id = Column(String(255), nullable=False)
  