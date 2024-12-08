import json
import src.app.user.constant as constant

from dataclasses import asdict
from datetime import datetime, timedelta
from redis import Redis
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from typing import cast, Optional, Tuple, Union

from src.app.user.model import OTPSessionCache, ResetPasswordSessionCache, SessionModel
from src.extensions import app_logger
from src.service.auth import SessionData
from src.service.redis import Action, Condition, RedisServicer
from src.service.sql_alchemy import SQLAlchemyServicer


class SessionRepo:
  rdb: Union[Redis, RedisServicer]

  def __init__(self, db: SQLAlchemyServicer, rdb: RedisServicer):
    self.db = db
    self.rdb = rdb

  def create_auth_session(self, user_id: int, session_id: str, access_id: str, refresh_id: str, 
    ip: str, location: str, device_name: str) -> Optional[SessionModel]:
    """
    Insert auth session info into db.
    """

    info = SessionModel(
      user_id=user_id,
      session_id=session_id,
      access_id=access_id,
      refresh_id=refresh_id,
      last_ip=ip,
      last_location=location,
      device_name=device_name,
    )

    try:
      self.db.client.session.add(info)
      self.db.client.session.commit()
    except IntegrityError:
      return None
    
    return info

  def get_auth_session_by_id(self, user_id: int, session_id: str) -> Optional[SessionModel]:
    """
    Retrieve session data.

    Return session data if found, else None.
    """

    key, duration = self._get_session_cache_info(user_id, session_id)

    # Fetch the session data from cache
    session_bytes = self.rdb.get(key)
    if session_bytes is not None:    
      if session_bytes == b"":
        return None
      
      session_token_dict = json.loads(session_bytes)
      return SessionModel.from_dict(session_token_dict)
    
    # Get session from db if not found
    session = SessionModel.query.filter(
      SessionModel.user_id == user_id,
      SessionModel.session_id == session_id
    ).first()
    
    # Cache db result
    session_str = json.dumps(session.to_dict()) if session is not None else ""
    if not self.rdb.set(key, session_str, duration):
      app_logger.error(f"Failed to write session data to cache, key: {key}.")

    return session

  def get_session_for_jwt(self, user_id, session_id) -> Optional[SessionData]:
    """
    Get session info for JWT authentication.
    Return session info if found, else None.
    """

    session = self.get_auth_session_by_id(user_id, session_id)
    if session is None:
      return None
    
    # Verify if the session is valid
    expiry_threshold = datetime.now() - constant.REFRESH_TOKEN_LIFETIME
    if session.deleted_at != 0 or int(expiry_threshold.timestamp()) > session.refreshed_at:
      return None
    
    return SessionData(session.session_id, session.access_id, session.refresh_id)

  def remove_auth_session_by_id(self, user_id: int, session_id: str):
    """
    Remove specific session.
    """

    stmt = (
      update(SessionModel)
      .where(SessionModel.user_id == user_id, SessionModel.session_id == session_id)
      .values(deleted_at=int(datetime.now().timestamp()))
    )

    self.db.client.session.execute(stmt)
    self.db.client.session.commit()

    key, _ = self._get_session_cache_info(user_id, session_id)
    self.rdb.delete(key)

  def remove_auth_sessions(self, user_id: int, max_session_count: int, session_lifetime: Optional[timedelta] = None):
    """
    Remove those sessions that exceed the max session count.
    """

    current_time = datetime.now()
    expire_threshold = 0
    if session_lifetime is not None:
      expire_threshold = int((current_time - session_lifetime).timestamp())

    # Subquery to select sessions that exceed max_session_count
    subquery = (
      select(SessionModel.session_id)
      .where(
        SessionModel.user_id == user_id, 
        SessionModel.deleted_at == 0,
        SessionModel.refreshed_at > expire_threshold # filter non-expiry sessions
      )
      .order_by(SessionModel.refreshed_at.desc())
      .offset(max_session_count)
    )

    # Mark selected sessions as deleted
    stmt = (
      update(SessionModel)
      .where(SessionModel.user_id == user_id, SessionModel.session_id.in_(subquery))
      .values(deleted_at=int(current_time.timestamp()))
      .returning(SessionModel.session_id)
    )

    deleted_session_ids = self.db.client.session.execute(stmt).scalars().all()
    self.db.client.session.commit()

    # Delete sessions cache
    if len(deleted_session_ids) > 0:
      keys = [self._get_session_cache_info(user_id, id)[0] for id in deleted_session_ids]
      self.rdb.delete(*keys)
  
  def update_auth_session(self, user_id: int, session_id: str, access_id: str, refresh_id: str):
    """
    Update auth session info in db.
    """

    stmt = (
      update(SessionModel)
      .where(
        SessionModel.user_id == user_id,
        SessionModel.session_id == session_id
      )
      .values(
        access_id=access_id,
        refresh_id=refresh_id, 
        refreshed_at=int(datetime.now().timestamp())
      )
    )

    self.db.client.session.execute(stmt)
    self.db.client.session.commit()

    # Delete session cache
    key, _ = self._get_session_cache_info(user_id, session_id)
    self.rdb.delete(key)

  def incr_login_attempts(self, user_id: int) -> int:
    """
    Increase login attempts count
    """

    key, duration = self._get_login_attempts_cache_info(user_id)

    casted_rdb = cast(RedisServicer, self.rdb)
    return casted_rdb.incr_with_expiry(key, 1, duration)

  def remove_login_attempts(self, user_id: int):
    """
    Remove login attempts
    """

    key, _ = self._get_login_attempts_cache_info(user_id)
    return self.rdb.delete(key)
  
  def get_reset_password_session(self, user_id: int, delete: bool) -> Optional[ResetPasswordSessionCache]:
    """
    Retrieve user's reset password session from cache. 
    If delete is true, it deletes the cache after retrieve.
  
    Return the cache data.
    """

    # Get cache key and duration
    key, _ = self._get_reset_password_cache_info(user_id)

    cache_bytes:Optional[bytes] = None

    if delete:
      # Retrieve and delete the reset session from cache
      casted_rdb = cast(RedisServicer, self.rdb)
      cache_bytes = casted_rdb.pop(key)
    else:
      # Retrieve the reset session from cache
      cache_bytes = self.rdb.get(key)

    if cache_bytes is None:
      return None
    
    # Return reset password session
    reset_dict = json.loads(cache_bytes)
    return ResetPasswordSessionCache(**reset_dict)

  def remove_reset_password_session(self, user_id: int):
    """
    Remove reset password session cache
    """

    key, _ = self._get_reset_password_cache_info(user_id)
    self.rdb.delete(key)

  def save_reset_password_session(self, user_id: int, session_id: str) -> int:
    """
    Save reset password session to cache
    Return session's expiry.
    """

    # Get cache key and duration
    key, duration = self._get_reset_password_cache_info(user_id)

    # Save secret to cache
    now = int(datetime.now().timestamp())
    json_data = json.dumps(asdict(ResetPasswordSessionCache(session_id=session_id, issued_at=now)))
    self.rdb.set(key, json_data, duration)

    return now + duration.seconds
  
  def verify_otp_session(self, typ: int, identifier: str, code: str) -> bool:
    """
    Verifies the OTP session.
    Returns whether the code matches.
    """

    # Get cache key and duration
    key, duration = self._get_otp_cache_info(typ, identifier)

    # Verify otp on Redis
    now = datetime.now()
    success_actions: list[Action] = [
      {"field": "status", "action": "set", "value": "1"}
    ]
    failure_actions: list[Action] = [
      {"field": "retry", "action": "incr", "value": "1"}
    ]
    conditions: list[Condition] = [
      {"field": "issued_at", "operator": ">", "value": str(int((now - duration).timestamp()))},
      {"field": "status", "operator": "==", "value": "0"},
      {"field": "retry", "operator": "<", "value": "5"},
      {"field": "code", "operator": "==", "value": code}
    ]

    casted_rdb = cast(RedisServicer, self.rdb)
    success = casted_rdb.hset_with_condition(key, conditions, success_actions, failure_actions, False) == 1
    return success

  def save_otp_session(self, typ: int, identifier: str, code: str) -> Tuple[bool, int]:
    """
    Save OTP session to cache.
    Return if the cache has been successfully set and its expiry time.
    """

    # Get cache key and duration
    key, duration = self._get_otp_cache_info(typ, identifier)

    # Save otp info to cache
    now = datetime.now()
    actions: list[Action] = [
      {"field": "issued_at", "action": "set", "value": str(int(now.timestamp()))},
      {"field": "code", "action": "set", "value": code},
      {"field": "status", "action": "set", "value": "0"},
      {"field": "retry", "action": "set", "value": "0"},
      {"field": "", "action": "expr", "value": str(duration.seconds)}
    ]
    conditions: list[Condition] = [
      {"field": "issued_at", "operator": "<", "value": str(int((now - timedelta(minutes=1)).timestamp()))}
    ]

    casted_rdb = cast(RedisServicer, self.rdb)
    success = casted_rdb.hset_with_condition(key, conditions, actions, [], True) == 1
    expiry = int((now + duration).timestamp())
    return success, expiry

  def _get_login_attempts_cache_info(self, user_id: int) -> tuple[str, timedelta]:
    """
    Construct login attempts cache key and cache duration.
    """

    return f"user:login_attempts:{user_id}", timedelta(hours=1)
  
  def _get_otp_cache_info(self, typ: int, identifier: str) -> tuple[str, timedelta]:
    """
    Construct otp cache key and cache expiry.
    """

    return f"user:otp:{typ}:{identifier}", timedelta(minutes=10)

  def _get_reset_password_cache_info(self, user_id: int) -> tuple[str, timedelta]:
    """
    Construct reset password cache key and cache duration.
    """

    return f"user:reset:{user_id}", timedelta(minutes=10)

  def _get_session_cache_info(self, user_id: int, session_id: str) -> tuple[str, timedelta]:
    """
    Construct session cache key and cache duration.
    """

    return f"user:session:{user_id}:{session_id}", timedelta(hours=1)  
