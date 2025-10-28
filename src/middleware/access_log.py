import logging
import logging.handlers
import json
import time

from flask import Flask, g, request
from werkzeug.wrappers import Response

from src.common.logger import create_logger

class AccessLogMiddleware:
  def __init__(self, app: Flask, debug_mode: bool = True, log_path: str = "", log_level: str = "DEBUG"):
    """
    Initializes the AccessLogMiddleware to handle request and response logging in the Flask app.

    Parameters:
    - app: The Flask application instance.
    - debug_mode: Whether to log detailed information, including response body on success.
    - log_path: Path to the log file for access logs.
    - log_level: The logging level (e.g., DEBUG, INFO).
    """

    # Suppress Werkzeug access logs to avoid duplicate logging
    werkzeug_log = logging.getLogger("werkzeug")
    werkzeug_log.disabled = True

    # Setup logging with a custom JSON formatter
    logger = create_logger("access", log_level, log_path, JSONFormatter(datefmt="%Y-%m-%d %H:%M:%S"))

    # Initialize request metrics
    @app.before_request
    def initialize_request_matrics():
      g.start_time = time.time()  # Capture the start time of the request

    # Log request and response information after processing
    @app.after_request
    def log_response_info(response: Response):
      """
      After processing a request, log relevant request and response data.
      """

      extras = {}

      # Add request ID to log
      request_id = request.environ.get("REQUEST_ID", "")
      extras["req_id"] = request_id

      # Add client's IP address to log
      extras["ip"] = request.remote_addr

      # Add request body to log, masking sensitive data
      request_body = request.get_json(silent=True) 
      if request_body is not None:
        extras["req_body"] = self._mask_request(request_body)

      # Add query parameters to log
      query_params = request.args.to_dict()
      if query_params:
        extras["params"] = query_params

      # Add response body to log, masking sensitive data.
      # Will not mask on non 200 responses, on errors, or in debug mode.
      try:
        json_resp = json.loads(response.get_data())
        code = json_resp.get("code")
        if debug_mode or code != 200:
          extras["res_body"] = self._mask_response(json_resp)
      except Exception as e:
        extras["res_body"] = response.get_data(as_text=True)

      # Add error message if available in Flask's global context
      if hasattr(g, "error"):
        extras["error"] = g.error

      # Add user ID to log if available in Flask's global context
      if hasattr(g, "user_id"):
        extras["user_id"] = g.user_id

      # Add request latency to log (in milliseconds)
      extras["latency"] = round((time.time() - g.start_time) * 1000, 3)

      # Log the request and response details
      logger.info(
        msg=f"{request.method} {request.path} {request.environ.get("SERVER_PROTOCOL")} {response.status_code}",
        extra=extras
      )
      
      return response

  def _mask_response(self, json_resp: dict) -> dict:
    """
    Mask sensitive response data.

    Parameters:
    - json_resp: The response body in JSON format.

    Returns:
    - A masked JSON response with sensitive fields hidden.
    """

    hidden_message = "***Hidden Data***"
    data: dict = json_resp["data"]

    # Mask sensitive information in the response
    if "access_token" in data:
      json_resp["data"]["access_token"] = hidden_message
    
    if "refresh_token" in data:
      json_resp["data"]["refresh_token"] = hidden_message

    return json_resp
  
  def _mask_request(self, json_req: dict) -> dict:
    """
    Mask sensitive request data.

    Parameters:
    - json_req: The request body in JSON format.

    Returns:
    - A masked JSON request with sensitive fields hidden.
    """

    hidden_message = "***Hidden Data***"

    # Hide auth data
    if "password" in json_req:
      json_req["password"] = hidden_message

    return json_req


# Custom JSON formatter for logging
class JSONFormatter(logging.Formatter):
  def format(self, record: logging.LogRecord) -> str:
    """
    Format the log record as a JSON string.

    Parameters:
    - record: The log record containing information to be logged.

    Returns:
    - A JSON string representing the log entry.
    """

    log_record = {
      "level": record.levelname,
      "timestamp": self.formatTime(record, self.datefmt),
      "message": record.getMessage(),
      "req_id": getattr(record, "req_id", ""),
      "ip": getattr(record, "ip", ""),
      "latency_ms": getattr(record, "latency", "")
    }

    # Optionally add request body to the log if available
    request_body = getattr(record, "req_body", None)
    if request_body is not None:
      log_record["req_body"] = request_body

    # Optionally add user ID to the log if available
    user_id = getattr(record, "user_id", None)
    if user_id is not None:
      log_record["uid"] = user_id

    # Optionally add query parameters to the log if available
    query_params = getattr(record, "params", None)
    if query_params is not None:
      log_record["params"] = query_params

    # Optionally add response body to the log if available
    response_body = getattr(record, "res_body", None)
    if response_body is not None:
      log_record["res_body"] = response_body

    # Optionally add error message to the log if available
    err = getattr(record, "error", None)
    if err is not None:
      log_record["error"] = str(err)

    # Convert the log record dictionary to a JSON string
    return json.dumps(log_record, ensure_ascii=False)
