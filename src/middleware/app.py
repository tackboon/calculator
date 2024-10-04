import logging
import logging.handlers
import json
import sys
import os

from flask import Flask, g, request
from werkzeug.wrappers import Response

from src.common.logger.logger import create_logger

class AppMiddleware:
  def __init__(self, app: Flask = None, debug: bool = True, log_path: str = "", log_level: str = "DEBUG"):
    """
    If an app is provided, initialize the access log middleware with it. 
    Otherwise, the app can be initialized later via `init_app`.
    """
    if app is not None:
      self.init_app(app, debug, log_path, log_level)

  def init_app(self, app: Flask, debug_mode: bool = True, log_path: str = "", log_level: str = "DEBUG"):
    """
    Register access log middleware with the given Flask app.
    """

    # Suppress Werkzeug access logs
    werkzeug_log = logging.getLogger("werkzeug")
    werkzeug_log.disabled = True

    # Setup logging format
    logger = create_logger("access", log_level, log_path, JSONFormatter(datefmt="%Y-%m-%d %H:%M:%S"))

    # Log both request and response info after processing
    @app.after_request
    def log_response_info(response: Response):
      extras = {}

      # add request id into log
      request_id = request.environ.get("REQUEST_ID", "")
      extras["req_id"] = request_id
      extras["ip"] = request.remote_addr

      # add request body into log
      request_body = request.get_json(silent=True) 
      if request_body is not None:
        extras["req_body"] = self._mask_request(request_body)

      # add query params into log
      query_params = request.args.to_dict()
      if query_params:
        extras["params"] = query_params

      # add response body into log on debug mode or on error
      try:
        json_resp = json.loads(response.get_data())
        code = json_resp.get("code")
        if debug_mode or code != 200:
          extras["res_body"] = self._mask_response(json_resp)
      except Exception as e:
        extras["res_body"] = response.get_data(as_text=True)

      # add error message into log
      if hasattr(g, "error"):
        extras["error"] = g.error

      # add user id into log
      if hasattr(g, "user_id"):
        extras["user_id"] = g.user_id

      logger.info(
        msg=f"{request.method} {request.path} {request.environ.get("SERVER_PROTOCOL")} {response.status_code} - ",
        extra=extras
      )
      
      return response

  def _mask_response(self, json_resp: dict) -> dict:
    """Masking sensitive response data"""

    hidden_message = "***Hidden Data***"
    data: dict = json_resp["data"]

    # hide auth data
    if "access_token" in data:
      json_resp["data"]["access_token"] = hidden_message
    
    if "refresh_token" in data:
      json_resp["data"]["refresh_token"] = hidden_message

    return json_resp
  
  def _mask_request(self, json_req: dict) -> dict:
    """Mask sensitive request data"""

    hidden_message = "***Hidden Data***"

    # Hide auth data
    if "password" in json_req:
      json_req["password"] = hidden_message

    return json_req


# Custom JSON formatter for logging
class JSONFormatter(logging.Formatter):
  def format(self, record: logging.LogRecord) -> str:
    # Create a dictionary for the log record
    log_record = {
      "level": record.levelname,
      "timestamp": self.formatTime(record, self.datefmt),
      "message": record.getMessage(),
      "req_id": getattr(record, "req_id", ""),
      "ip": getattr(record, "ip", "")
    }

    # Add request body to log record if exists
    request_body = getattr(record, "req_body", None)
    if request_body is not None:
      log_record["req_body"] = request_body

    # Add user id to log record if exists
    user_id = getattr(record, "user_id", None)
    if user_id is not None:
      log_record["uid"] = user_id

    # Add query params to log record if exists
    query_params = getattr(record, "params", None)
    if query_params is not None:
      log_record["params"] = query_params

    # Add response body to log record if exists
    response_body = getattr(record, "res_body", None)
    if response_body is not None:
      log_record["res_body"] = response_body

    # Add error to log record if exists
    err = getattr(record, "error", None)
    if err is not None:
      log_record["error"] = str(err)

    # Convert the log record to JSON string
    return json.dumps(log_record)
