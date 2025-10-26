from flask import Flask, g, jsonify

from src.common.error import CustomAPIException


class ErrorMiddleware:
  def __init__(self, app: Flask):
    """
    Initializes and registers error handlers with the given Flask app.

    Parameters:
    - app: Flask application instance to attach the error handlers.
    """

    # Handle all uncaught exceptions
    @app.errorhandler(Exception)
    def handle_unknown_exception(e: Exception):
      """
      Catch and handle any unknown or uncaught exceptions.
      Logs the exception in Flask's global context (`g.error`) and returns a generic 500 response.

      Parameters:
      - e: The raised exception.

      Returns:
      - JSON response with code 500 and a status message "Internal Server Error".
      """

      g.error = e # Store the error in the Flask global object for logging purposes
      return jsonify(code=500, status="Internal Server Error"), 500
    
    # Handle custom API exceptions defined by the application
    @app.errorhandler(CustomAPIException)
    def handle_custom_api_exception(e: CustomAPIException):
      """
      Catch and handle custom API exceptions.
      Logs the exception message in Flask's global context (`g.error`) and returns a custom response.

      Parameters:
      - e: The raised CustomAPIException instance.

      Returns:
      - JSON response with the custom exception's code, status, and additional data.
      """

      g.error = e.message # Store the error in the Flask global object for logging purposes
      return jsonify(code=e.code, status=e.status, data=e.data), e.status_code
    