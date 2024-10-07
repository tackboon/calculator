import json
import logging
import logging.handlers
import os
import sys


def create_logger(name: str, log_level: str, log_path: str, formatter: logging.Formatter) -> logging.Logger:
  """
  Create and return a daily rotating custom logger. If log_path is an empty string, it logs to stdout.
  
  Parameters:
  - name: Name of the logger.
  - log_level: Logging level (e.g., 'DEBUG', 'INFO').
  - log_path: Path to the log file. If empty, logs will be printed to stdout.
  - formatter: The formatter to be used for log messages.

  Returns:
  - logger: The configured logger instance.
  """
  
  logger = logging.getLogger(name)

  # Set log level
  logger.setLevel(logging._nameToLevel.get(log_level.upper(), logging.DEBUG))

  # Declaring handler
  handler: logging.Handler

  try:
    if log_path == "":
      # Logging to stdout if no file path is provided
      handler = logging.StreamHandler()
    else:
      # Create directories if they don't exist
      directory, _ = os.path.split(log_path)
      if directory:
        os.makedirs(directory, exist_ok=True)

      # Set up rotating file handler
      handler = logging.handlers.TimedRotatingFileHandler(log_path, when="D", interval=1, backupCount=3)
      logger.propagate = False

    # Set formatter
    handler.setFormatter(formatter)
    logger.addHandler(handler)

  except OSError as e:
    # Log to stdout if file handling fails and exit
    logging.fatal(f"Failed to create directory or log file '{log_path}': {e}")
    sys.exit(1)

  return logger

# Custom a JSON formatter for logging
class BasicJSONFormatter(logging.Formatter):
  """
  Custom JSON formatter for log messages.
  """
  
  def format(self, record: logging.LogRecord) -> str:
    """
    Format the log record into a JSON string.

    Parameters:
    - record: The log record containing the log information.

    Returns:
    - JSON string representation of the log record.
    """

    log_record = {
      "level": record.levelname,
      "timestamp": self.formatTime(record, self.datefmt),
      "message": record.getMessage()
    }

    # Add error to log record if exists
    err = getattr(record, "error", None)
    if err is not None:
      log_record["error"] = str(err)

    # Add latency to log record if exists
    latency = getattr(record, "latency", None)
    if latency is not None:
      log_record["latency"] = str(latency)

    # Convert the log record to JSON string
    return json.dumps(log_record)
