import time

from flask import Flask
from flask_redis import FlaskRedis
from functools import wraps
from logging import Logger
from typing import Any, Awaitable, Callable, Optional, Union

from src.common.logger import BasicJSONFormatter, create_logger


def log_slow_queries(threshold_ms: float, logger: Logger, skip_log: bool, log_msg: str, 
                     fn: Callable[..., Any]) -> Callable[..., Any]:
  """
  Wrapper function to log slow Redis queries. 
  It measures the execution time of a Redis call and logs it if it exceeds the threshold.
  If skip_log is True, logging is bypassed. If log_msg is provided, it is used instead of
  the default log message.
  
  Parameters:
  - threshold_ms: The threshold in milliseconds. If the query execution time exceeds this, it is considered slow.
  - logger: The logger instance to use for logging slow queries.
  - skip_log: A boolean flag to skip logging if True.
  - log_msg: Custom message to log instead of the default message. If empty, the default message is logged.
  - fn: The Redis method to be wrapped with slow query logging.
  
  Returns:
  - A wrapper function that logs slow queries and calls the original method.
  """

  @wraps(fn)
  def wrapper(*args: Any, **kwargs: Any):
    # Start the timer
    start_time = time.time()

    # Execute the original function
    result = fn(*args, **kwargs)

    # Calculate the execution time
    if not skip_log:
      query_time = round((time.time() - start_time) * 1000, 3)
      if query_time > threshold_ms:
        msg = f"Slow Query: {fn.__name__}, args: {args}, kwargs: {kwargs}" if log_msg == "" else log_msg
        logger.warning(
          msg,
          extra={"latency": f"{query_time} ms"}
        )

    return result
  return wrapper


class RedisServicer:
  """
  A Redis service wrapper that extends the basic Redis client functionalities 
  with decorators to log slow queries and implement custom commands. 
  """

  def __init__(self, app: Flask = None, log_path: str = "", slow_threshold_ms: float = 50):
    """
    Initializes the RedisServicer instance, which sets up FlaskRedis and 
    logs slow queries. The service can be initialized with a Flask app during instantiation,
    or later via the `init_app` method.
    """

    self.client = FlaskRedis()

    if app is not None:
      self.init_app(app, log_path, slow_threshold_ms)

  def init_app(self, app: Flask, log_path: str, slow_threshold_ms: float = 50):
    """
    Initializes the FlaskRedis with the given Flask app and sets up logging for slow queries.
    It also configures a logger to capture queries that exceed the defined threshold.

    Parameters:
    - app: Flask application instance to initialize the Redis client.
    - log_path: Path for logging slow Redis queries.
    - slow_threshold_ms: Threshold (in milliseconds) to classify a query as slow and log it.
    """

    # Initializing the Redis client using FlaskRedis
    self.client.init_app(app)
    self.slow_threshold_ms = slow_threshold_ms

    # Configure the logger with a JSON format for logging slow queries
    self.logger = create_logger("redis", "info", log_path, 
                                BasicJSONFormatter(datefmt="%Y-%m-%d %H:%M:%S"))

  def __getattr__(self, name: str) -> Any:
    """
    Intercepts calls to Redis methods and applies the slow query logging decorator.

    Parameters:
    - name: Name of the Redis command being called.

    Returns:
    - The original Redis method, wrapped with the slow query logging if applicable.
    """

    # Get the redis attribute from the actual Redis client
    redis_attr = getattr(self.client, name)

    # If the attribute is callable, wrap it with the slow query logger
    if callable(redis_attr):
      return log_slow_queries(self.slow_threshold_ms, self.logger, False, "", redis_attr)

    return redis_attr

  def hget(self, key: str, field: str, 
           skip_log: bool = False, log_msg: str = "") -> Union[Awaitable[Optional[str]], Optional[str]]:
    """
    Redis HGET command with optional slow query logging.

    Parameters:
    - key: Redis key to retrieve the hash from.
    - field: The specific field in the hash to retrieve.
    - skip_log: Flag to skip logging this query if set to True.
    - log_msg: Custom log message to replace the default slow query log.
    
    Returns:
    - The value of the field in the hash, or None if the field does not exist.
    """
    
    return log_slow_queries(
      self.slow_threshold_ms, 
      self.logger, 
      skip_log,
      log_msg,
      self.client.hget
    )(key, field)

  def hgetall(self, key: str, skip_log: bool = False, log_msg: str = "") -> Union[Awaitable[dict], dict]:
    """
    Redis HGETALL command with optional slow query logging.
    
    The HGETALL command retrieves all the fields and values of a hash stored at a specific key.
    This method wraps the command and adds optional logging of slow queries based on the
    provided threshold and log configuration.

    Parameters:
    - key: The Redis key for the hash.
    - skip_log: Flag to skip logging slow queries. If set to True, the logging is bypassed.
    - log_msg: Custom log message to replace the default slow query log. If empty, the default message is used.
    
    Returns:
    - A dictionary containing all the fields and values stored in the hash. 
      If the key does not exist, an empty dictionary is returned.
    """

    return log_slow_queries(
      self.slow_threshold_ms, 
      self.logger, 
      skip_log,
      log_msg,
      self.client.hgetall
    )(key)

  def hset_if_exist(self, key: str, field: str, value: str, 
                    skip_log: bool = False, log_msg: str = "") -> Union[Awaitable[int] | int]:
    """
    Redis HSET operation that updates a field in a hash only if the field already exists.
    
    Parameters:
    - key: The Redis key for the hash.
    - field: The field to be updated in the hash.
    - value: The new value to be set for the field.

    Returns:
    - 1 if the field was updated, 0 if the field does not exist.
    """

    script = """
    local exists = redis.call("HEXISTS", KEYS[1], ARGV[1])
    if exists == 1 then
      redis.call("HSET", KEYS[1], ARGV[1], ARGV[2])
      return 1
    else
      return 0
    end
    """

    return log_slow_queries(
      self.slow_threshold_ms, 
      self.logger, 
      skip_log,
      log_msg,
      self.client.eval
    )(script, 1, key, field, value)

  def hset_with_expiry(self, key: str, field: str, value: str, duration: int, 
                       skip_log: bool = False, log_msg: str = "") -> Union[Awaitable[int], int]:
    """
    Redis HSET operation with an expiry. The field is set in the hash and the key's expiry is updated.

    Parameters:
    - key: The Redis key for the hash.
    - field: The field to be set in the hash.
    - value: The value to be set for the field.
    - duration: Expiry time (in seconds) to be set for the key.

    Returns:
    - Always 1 in this implementation.
    """

    script = """
    redis.call("HSET", KEYS[1], ARGV[1], ARGV[2])
    redis.call("EXPIRE", KEYS[1], ARGV[3])

    return 1
    """

    return log_slow_queries(
      self.slow_threshold_ms, 
      self.logger,
      skip_log,
      log_msg,
      self.client.eval
    )(script, 1, key, field, value, duration)

  def hsetnx_with_expiry(self, key: str, field: str, value: str, duration: int, 
                         skip_log: bool = False, log_msg: str = "") -> Union[Awaitable[int], int]:
    """
    Redis HSETNX operation with an expiry. The field is set only if it does not already exist, 
    and the key's expiry is updated if the field was created.

    Parameters:
    - key: The Redis key for the hash.
    - field: The field to be conditionally set in the hash.
    - value: The value to be set for the field if it does not exist.
    - duration: Expiry time (in seconds) to be set for the key.

    Returns:
    - 1 if the field was created, 0 if the field already existed.
    """
    
    script = """
    local result = redis.call("HSETNX", KEYS[1], ARGV[1], ARGV[2])
    if result == 1 then
      redis.call("EXPIRE", KEYS[1], ARGV[3])
      return 1
    else
      return 0
    end
    """

    return log_slow_queries(
      self.slow_threshold_ms, 
      self.logger,
      skip_log,
      log_msg,
      self.client.eval
    )(script, 1, key, field, value, duration)
  