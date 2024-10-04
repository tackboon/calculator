from flask_jwt_extended import JWTManager
from flask import Flask, g, jsonify

from src.common.response.custom_error import UnauthorizedError


class JWTMiddleware:
  def __init__(self, app: Flask = None):
    """
    If an app is provided, initialize the access log middleware with it. 
    Otherwise, the app can be initialized later via `init_app`.
    """

    if app is not None:
      self.init_app(app)

  def init_app(self, app: Flask):
    """
    Register jwt middleware with the given Flask app.
    """

    jwt = JWTManager(app)

    @jwt.invalid_token_loader
    @jwt.unauthorized_loader
    def invalid_token_callback(e: Exception):
      err = UnauthorizedError(str(e))
      g.error = err.message
      return jsonify(code=err.code, status=err.status, data=err.data), err.status_code
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header: dict, jwt_payload: dict):
      err = UnauthorizedError(
        message=f"The access token has expired. Payload: {jwt_payload}", 
        data={
          "is_expired": True
        }
      )
      g.error = err.message
      return jsonify(code=err.code, status=err.status, data=err.data), err.status_code
    