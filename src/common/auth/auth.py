from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime, timedelta
from flask import current_app, g, request
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt, verify_jwt_in_request
from flask_jwt_extended.view_decorators import LocationType
from functools import wraps
from typing import Any, NamedTuple, Optional, Tuple

from src.common.response.custom_error import UnauthorizedError


@dataclass
class SessionData:
  access_token: str
  refresh_token: str
  issued_at: int
  last_online: int

@dataclass
class UserInfo:
  user_id: int
  username: str
  deleted_at: int
  role: int

class JWTStorage(ABC):
  @abstractmethod
  def get_session_token(self, user_id: int, session_id: str) -> Tuple[Optional[SessionData], int]:
    """
    Retrieve session data from storage.
    Return session data and session lifetime in seconds.
    """
    pass

  @abstractmethod
  def get_user_for_jwt(self, user_id: int) -> Optional[UserInfo]:
    """
    Retrieve user data from storage.
    Return user info.
    """
    pass


class TokenClaim(NamedTuple):
  user_id: int
  session_id: str


class SessionToken(NamedTuple):
  access_token: str
  refresh_token: str
  claim: TokenClaim


def get_info_from_token() -> TokenClaim:
  """
  Extract user id and session id from token
  """
  # Extract the claims from JWT
  claims = get_jwt()
  user_id = claims.get("sub")
  session_id = claims.get("sid")

  return TokenClaim(user_id, session_id)

def generate_token(user_id: int, session_id: str, is_fresh_token: bool, expires_delta: timedelta
                   ) -> SessionToken:
  """
  Generate access token and refresh token. 
  """

  # generate access token and refresh token
  claims = {"sid": session_id}
  access_token = create_access_token(
    identity=user_id, 
    fresh=is_fresh_token, 
    additional_claims=claims, 
    expires_delta=expires_delta
  )
  refresh_token = create_refresh_token(
    identity=user_id, 
    additional_claims=claims, 
  )

  token_claim = TokenClaim(user_id, session_id)
  return SessionToken(access_token, refresh_token, token_claim)

def check_session_expired(last_online: int, lifetime: int) -> bool:
  """
  Check is the session expired.
  Return true if expired.
  """
  return int(datetime.now().timestamp()) - lifetime > last_online

def jwt_required(
  storage: JWTStorage,
  optional: bool = False,
  fresh: bool = False,
  refresh: bool = False,
  locations: Optional[LocationType] = None,
  verify_type: bool = True,
  skip_revocation_check: bool = False,
) -> Any:
  def wrapper(fn):
    @wraps(fn)
    def decorator(*args, **kwargs):
      # Verify JWT token
      jwt_header, jwt_data = verify_jwt_in_request(
          optional, fresh, refresh, locations, verify_type, skip_revocation_check
      )

      user_id = jwt_data["sub"]
      session_id = jwt_data["sid"]

      # Store user id to context
      g.user_id = user_id

      # Get session from storage
      session_data, lifetime = storage.get_session_token(user_id, session_id)

      # # Verify is token valid
      if session_data is None:
        raise UnauthorizedError("The session was not found in storage.")
      
      # Extract refresh token from header
      auth_header = request.headers.get("Authorization")
      token = auth_header.split(" ")[1]

      if refresh:
        if session_data.refresh_token != token:
          raise UnauthorizedError("Refresh token does not match.")
      else:
        if session_data.access_token != token:
          raise UnauthorizedError("Access token does not match.")

      # Check is then session expired
      if check_session_expired(session_data.last_online, lifetime):
        raise UnauthorizedError("Session expired.")
      
      # Check is user get deleted
      user_info = storage.get_user_for_jwt(user_id)
      if user_info is None:
        raise UnauthorizedError("User not found in storage.")

      if user_info.deleted_at != 0:
        raise UnauthorizedError("User is deleted.")
      
      # Store user info to context
      g.user_info = user_info      

      return current_app.ensure_sync(fn)(*args, **kwargs)
    return decorator
  return wrapper
