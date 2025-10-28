from datetime import timedelta
from flask_jwt_extended import create_access_token, create_refresh_token, decode_token, get_jwt

from typing import NamedTuple

class TokenClaim(NamedTuple):
  """
  Data representing the essential claims (user_id, session_id, and expiry) stored in the JWT.
  """
  
  user_id: int
  session_id: str


class SessionToken(NamedTuple):
  """
  Data that holds both the access token and refresh token, along with the token claims.
  """

  access_token: str
  refresh_token: str
  claim: TokenClaim


def get_info_from_token() -> TokenClaim | None:
  """
  Extract user id, session id, and expiry from request token
  """

  # Extract the claims from JWT
  claims = get_jwt()
  if not claims:
    return None

  user_id = claims.get("sub")
  session_id = claims.get("sid")

  return TokenClaim(user_id, session_id)

def get_token_expiry(token: str) -> int:
  """
  Extract expiry from token
  """

  claims = decode_token(token)
  exp = claims.get("exp")

  return exp

def generate_auth_token(user_id: int, session_id: str, access_id: str, refresh_id: str, 
  is_fresh_token: bool, access_expires_delta: timedelta, refresh_expires_delta: timedelta) -> SessionToken:
  """
  Generate access token and refresh token. 
  """

  # generate access token and refresh token
  claims = {"sid": session_id, "aid": access_id, "rid": refresh_id}
  access_token = create_access_token(
    identity=user_id, 
    fresh=is_fresh_token, 
    additional_claims=claims, 
    expires_delta=access_expires_delta
  )
  refresh_token = create_refresh_token(
    identity=user_id, 
    additional_claims=claims, 
    expires_delta=refresh_expires_delta
  )

  token_claim = TokenClaim(user_id, session_id)
  return SessionToken(access_token, refresh_token, token_claim)

def generate_reset_token(user_id: int, email: str, session_id: str, expires_delta: timedelta) -> str:
  """
  Generate reset password token
  """

  claims = {"sid": session_id, "email": email}
  reset_password_token = create_access_token(
    identity=user_id, 
    fresh=True, 
    additional_claims=claims, 
    expires_delta=expires_delta
  )

  return reset_password_token
