import json
import logging
import logging.handlers
import os
import sys


def create_logger(name: str, log_level: str, log_path: str, formatter: logging.Formatter) -> logging.Logger:
  """
  Create and return a daily rotate custom logger. If log_path is empty string, it prints to stdout.
  Return logger.
  """
  
  # Setup logging format
  logger = logging.getLogger(name)
  logger.setLevel(logging._nameToLevel.get(log_level.upper(), logging.DEBUG))

  # Declaring handler
  handler: logging.Handler

  try:
    if log_path == "":
      handler = logging.StreamHandler()
    else:
      # Split the directory path and the file name
      directory, _ = os.path.split(log_path)

      # Create the directory if not exist
      if directory:
        os.makedirs(directory, exist_ok=True)
        logging.info(f"Directory {directory} created or already exists.")

      handler = logging.handlers.TimedRotatingFileHandler(log_path, when="D", interval=1, backupCount=3)
      logger.propagate = False

    handler.setFormatter(formatter)
    logger.addHandler(handler)

    return logger
  except OSError as e:
    logging.fatal(f"Failed to create directory or log file '{log_path}': {e}")
    sys.exit(1)


# Custom a basicJSON formatter for logging
class BasicJSONFormatter(logging.Formatter):
  def format(self, record: logging.LogRecord) -> str:
    # Create a dictionary for the log record
    log_record = {
      "level": record.levelname,
      "timestamp": self.formatTime(record, self.datefmt),
      "message": record.getMessage(),
      "funcName": record.funcName,
      "line": record.lineno
    }

    # Add error to log record if exists
    err = getattr(record, "error", None)
    if err is not None:
      log_record["error"] = str(err)

    # Convert the log record to JSON string
    return json.dumps(log_record)
  