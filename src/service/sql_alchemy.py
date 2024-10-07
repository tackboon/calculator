import time

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import event
from sqlalchemy.engine import Engine, Connection
from typing import Any

from src.common.logger import BasicJSONFormatter, create_logger


class SQLAlchemyServicer:
  def __init__(self, app: Flask = None, log_path: str = "", slow_threshold_ms: float = 200):
    """
    Initializes the SQLAlchemyServicer instance, which sets up SQLAlchemy and 
    logs slow queries. The service can be initialized with a Flask app during instantiation,
    or later via the `init_app` method.
    """

    self.client = SQLAlchemy()

    if app is not None:
      self.init_app(app, log_path, slow_threshold_ms)

  def init_app(self, app: Flask, log_path: str, slow_threshold_ms: float = 200):
    """
    Initializes SQLAlchemy with the given Flask app and sets up logging for slow queries.
    It also configures a logger to capture queries that exceed the defined threshold.
    
    Parameters:
    - app: Flask instance to bind the SQLAlchemy service.
    - log_path: Path where the slow query logs will be written.
    - slow_threshold_ms: Threshold (in milliseconds) beyond which a query is considered slow.
    """
    
    # Initialize SQLAlchemy with the Flask app
    self.client.init_app(app)
    self.slow_threshold_ms = slow_threshold_ms

    # Configure the logger with a JSON format for logging slow queries
    self.logger = create_logger("sql_alchemy", "info", log_path, 
                                BasicJSONFormatter(datefmt="%Y-%m-%d %H:%M:%S"))

    # Event listener to record the query start time before execution
    @event.listens_for(Engine, "before_cursor_execute")
    def sqlalchemy_before_handler(conn: Connection, cursor: Any, statement: str,
                                  parameters: Any, context: Any, executemany: bool):
      """
      Captures the start time before the query is executed.
      This event is triggered before each SQL execution and stores the current time in the context.
      
      Parameters:
      - conn: The connection instance.
      - cursor: The cursor instance being used.
      - statement: The SQL statement to be executed.
      - parameters: The parameters to be used with the SQL statement.
      - context: Context object to hold the metadata.
      - executemany: Boolean indicating if multiple statements are being executed.
      """

      context._query_start_time = time.time()

    # Event listener to log slow queries after they have been executed
    @event.listens_for(Engine, "after_cursor_execute")
    def sqlalchemy_after_handler(conn: Connection, cursor: Any, statement: str, 
                                parameters: Any, context: Any, executemany: bool):
      """
      Captures the end time after the query execution and calculates the query duration.
      If the query time exceeds the defined threshold, it logs the query as slow.
      
      Parameters:
      - conn: The connection instance.
      - cursor: The cursor instance being used.
      - statement: The SQL statement that was executed.
      - parameters: The parameters used with the SQL statement.
      - context: Context object containing the metadata.
      - executemany: Boolean indicating if multiple statements were executed.
      """

      query_time = round((time.time() - context._query_start_time) * 1000, 3)
      if query_time > self.slow_threshold_ms:
        self.logger.warning(
          f"Slow Query: {statement}, params: {parameters}",
          extra={"latency": f"{query_time} ms"}
        )
  