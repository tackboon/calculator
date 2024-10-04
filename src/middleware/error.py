from flask import Flask, g, jsonify
from marshmallow import ValidationError

from src.common.response.custom_error import CustomAPIException


class ErrorMiddleware:
  def __init__(self, app: Flask = None):
    """
    If an app is provided, initialize the error middleware with it. 
    Otherwise, the app can be initialized later via `init_app`.
    """
    if app is not None:
      self.init_app(app)

  def init_app(self, app: Flask):
    """
    Register error middleware with the given Flask app.
    """

    # Handle unknown exception
    @app.errorhandler(Exception)
    def handle_unknown_exception(e: Exception):
      g.error = e
      return jsonify(code=500, status="Internal Server Error"), 500
    
    # Handle custom api exception
    @app.errorhandler(CustomAPIException)
    def handle_custom_api_exception(e: CustomAPIException):
      g.error = e.message
      return jsonify(code=e.code, status=e.status, data=e.data), e.status_code
    