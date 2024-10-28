from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from flask import current_app, g, Flask, jsonify
from flask_jwt_extended import JWTManager, verify_jwt_in_request
from flask_jwt_extended.view_decorators import LocationType
from functools import wraps
from typing import Any, Callable, Optional

from src.common.error import UnauthorizedError


@dataclass
class SessionData:
  """
  Data class representing a user's session information.
  """

  session_id: str
  access_id: str
  refresh_id: str


@dataclass
class UserInfo:
  """
  Data class representing a user's basic info.
  """

  user_id: int
  email: str
  deleted_at: int
  role: int


class JWTRepo(ABC):
  """
  Abstract base class defining methods for JWT token storage and retrieval.
  """
      
  @abstractmethod
  def get_session_for_jwt(self, user_id: int, session_id: str) -> Optional[SessionData]:
    """
    Retrieve session data from storage by user_id and session_id.
    
    Returns:
    - SessionData (if available).
    """

    pass

  @abstractmethod
  def get_user_for_jwt(self, user_id: int) -> Optional[UserInfo]:
    """
    Retrieve user data from storage by user_id.
    
    Returns:
    - UserInfo (if available).
    """

    pass


def check_is_session_expired(last_refresh_time: int, lifetime: int) -> bool:
  """
  Check if the session has expired.
  
  Parameters:
  - last_refresh_time: The last refresh timestamp of the session.
  - lifetime: The session lifetime in seconds.
  
  Returns:
  - True if the session is expired, otherwise False.
  """

  return int(datetime.now().timestamp()) - last_refresh_time > lifetime


class AuthServicer:
  """
  A service class to manage JWT handling and error handling in a Flask app.
  This service integrates with Flask-JWT-Extended and provides custom error callbacks 
  for invalid or expired tokens.
  """
      
  def __init__(self, app: Optional[Flask] = None, repo: Optional[JWTRepo] = None):
    """
    Initializes the AuthServicer instance, which sets up JWTManager. The service can be
    initialized with a Flask app during instantiation, or later via the `init_app` method.
    """

    if app is not None and repo is not None:
      self.init_app(app, repo)

  def init_app(self, app: Flask, repo: JWTRepo):
    """
    Registers JWT handlers and error callbacks with the given Flask app.

    Parameters:
    - app: The Flask application instance where JWT is registered.
    """

    self.repo = repo
    jwt = JWTManager(app)

    @jwt.invalid_token_loader
    @jwt.unauthorized_loader
    def invalid_token_callback(e: Exception):
      """
      Callback for handling invalid or unauthorized JWT tokens.
      It captures exceptions related to invalid tokens and returns 
      a custom UnauthorizedError response.

      Parameters:
      - e: The exception raised during token verification.

      Returns:
      - A JSON response with the error message and status code.
      """

      err = UnauthorizedError(str(e))
      g.error = err.message
      return jsonify(code=err.code, status=err.status, data=err.data), err.status_code
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header: dict, jwt_payload: dict):
      """
      Callback for handling expired JWT tokens. It specifically catches cases 
      where the token has expired and returns a custom error response.

      Parameters:
      - jwt_header: The JWT header dictionary.
      - jwt_payload: The JWT payload dictionary containing the token's claims.

      Returns:
      - A JSON response indicating the token expiration, along with the payload details.
      """
      
      err = UnauthorizedError(
        message=f"The access token has expired. Payload: {jwt_payload}", 
        data={
          "is_expired": True
        }
      )
      g.error = err.message
      return jsonify(code=err.code, status=err.status, data=err.data), err.status_code

  def jwt_required(
    self,
    optional: bool = False,
    fresh: bool = False,
    refresh: bool = False,
    locations: Optional[LocationType] = None,
    verify_type: bool = True,
    skip_revocation_check: bool = False,
  ) -> Any:
    """
    A decorator for requiring JWT authentication and validating session and user data from storage.
    
    Parameters:
    - storage: An instance of JWTStorage for retrieving session and user information.
    - optional: If True, the request will not require a JWT token.
    - fresh: If True, the token must be fresh.
    - refresh: If True, verifies the refresh token instead of the access token.
    - locations: A list of locations to check for the JWT (headers, cookies, etc.).
    - verify_type: If True, verifies the type of token (e.g., access vs. refresh).
    - skip_revocation_check: If True, skips the check for token revocation.
    
    Returns:
    - A decorator function that adds the above JWT checks to the endpoint.
    """
    
    def wrapper(fn: Callable[..., Any]):
      @wraps(fn)
      def decorator(*args: Any, **kwargs: Any):
        # Verify JWT token from the request
        jwt_header, jwt_data = verify_jwt_in_request(
            optional, fresh, refresh, locations, verify_type, skip_revocation_check
        )

        user_id = jwt_data["sub"]
        session_id = jwt_data["sid"]

        # Store the user ID in Flask's global objectt
        g.user_id = user_id

        # Retrieve session data from storage
        session_data = self.repo.get_session_for_jwt(user_id, session_id)

        # Verify if session data exists in storage
        if session_data is None:
          raise UnauthorizedError("The session was not found in storage.")

        # Verify based on token type (access or refresh)
        if refresh:
          refresh_id = jwt_data["rid"]
          if session_data.refresh_id != refresh_id:
            raise UnauthorizedError("Refresh id does not match.")
        else:
          access_id = jwt_data["aid"]
          if session_data.access_id != access_id:
            raise UnauthorizedError("Access id does not match.")
        
        # Retrieve user info from storage
        user_info = self.repo.get_user_for_jwt(user_id)
        if user_info is None:
          raise UnauthorizedError("User not found in storage, or the user has beed deleted or blocked.")
        
        # Store user info in Flask's global object
        g.user_info = user_info      

        # Call the original endpoint function
        return current_app.ensure_sync(fn)(*args, **kwargs)

      return decorator
    return wrapper
