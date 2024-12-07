from dataclasses import dataclass
import time

from sqlalchemy import Column, Integer, String, SmallInteger
from sqlalchemy.dialects.postgresql import INET
from typing import Any, TYPE_CHECKING

from src.extensions import db_service

if TYPE_CHECKING:
  from flask_sqlalchemy.model import Model
else:
  Model = db_service.client.Model

class UserModel(Model):
  __tablename__ = "users"

  id = Column(Integer, primary_key=True)
  email = Column(String(320), nullable=False, unique=True)
  password = Column(String(255), nullable=False)
  reset_password_at = Column(Integer, nullable=False, default=0)
  created_at = Column(Integer, nullable=False, default=lambda: int(time.time()))
  deleted_at = Column(Integer, nullable=False, default=0)
  blocked_at = Column(Integer, nullable=False, default=0)
  role = Column(SmallInteger, nullable=False, default=0)

  def to_dict(self) -> dict[str, Any]:
    """
    Convert model instance to dictionary.
    """

    return {
      "id": self.id,
      "email": self.email,
      "password": self.password,
      "reset_password_at": self.reset_password_at,
      "created_at": self.created_at,
      "deleted_at": self.deleted_at,
      "blocked_at": self.blocked_at,
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
      email = data.get("email"),
      password = data.get("password"),
      reset_password_at = data.get("reset_password_at"),
      created_at = data.get("created_at"),
      deleted_at = data.get("deleted_at"),
      blocked_at = data.get("blocked_at"),
      role = data.get("role")
    )
  

class SessionModel(Model):
  __tablename__ = "sessions"

  user_id = Column(Integer, primary_key=True)
  session_id = Column(String(255), primary_key=True)
  access_id = Column(String(255), nullable=False)
  refresh_id = Column(String(255), nullable=False)
  created_at = Column(Integer, nullable=False, default=lambda: int(time.time()))
  deleted_at = Column(Integer, nullable=False, default=0)
  refreshed_at = Column(Integer, nullable=False, default=lambda: int(time.time()))
  last_ip = Column(INET, nullable=False)
  last_location = Column(String(100), nullable=False)
  device_name = Column(String(255), nullable=False)
  
  def to_dict(self) -> dict[str, Any]:
    """
    Convert model instance to dictionary.
    """

    return {
      "user_id": self.user_id,
      "session_id": self.session_id,
      "access_id": self.access_id,
      "refresh_id": self.refresh_id,
      "created_at": self.created_at,
      "deleted_at": self.deleted_at,
      "refreshed_at": self.refreshed_at,
      "last_ip": self.last_ip,
      "last_location": self.last_location,
      "device_name": self.device_name
    }

  @staticmethod
  def from_dict(data: dict[str, Any]) -> "SessionModel":
    """
    Create a new instance from a dictionary.

    Parameters:
    - data: A dictionary with session data.

    Returns:
    - SessionModel: A new SessionModel instance populated with the dictionary's data.
    """

    return SessionModel(
      user_id = data.get("user_id"),
      session_id = data.get("session_id"),
      access_id = data.get("access_id"),
      refresh_id = data.get("refresh_id"),
      created_at = data.get("created_at"),
      deleted_at = data.get("deleted_at"),
      refreshed_at = data.get("refreshed_at"),
      last_ip = data.get("last_ip"),
      last_location = data.get("last_location"),
      device_name = data.get("device_name")
    )
  

@dataclass
class ResetPasswordSessionCache:
  """
  Data class representing a reset password information.
  """

  session_id: str
  issued_at: int
