import json
import time

from datetime import timedelta
from flask import Flask
from flask_redis import FlaskRedis
from functools import wraps
from logging import Logger
from typing import Any, Callable, Optional, TypedDict, Union

from src.common.inspect import get_caller_name
from src.common.logger import BasicJSONFormatter, create_logger
from redis import Redis

def log_slow_queries(threshold_ms: float, logger: Logger, log_msg: str, caller: str, 
                     fn: Callable[..., Any]) -> Callable[..., Any]:
  """
  Decorator function to log slow Redis queries.
  It measures the execution time of a Redis call and logs it if it exceeds the specified threshold.
  
  Parameters:
  - threshold_ms: The threshold in milliseconds. Queries taking longer than this will be considered slow.
  - logger: The logger instance used to log slow queries.
  - log_msg: A custom log message. If provided, it replaces the default message.
  - caller: The name of the function that called the Redis operation.
  - fn: The Redis method being wrapped with the slow query logging.
  
  Returns:
  - A wrapper function that logs slow queries if they exceed the threshold and then calls the original function.
  """

  @wraps(fn)
  def wrapper(*args: Any, **kwargs: Any):
    # Start the timer
    start_time = time.time()

    # Execute the original function
    result = fn(*args, **kwargs)

    # Calculate the execution time in milliseconds
    query_time = round((time.time() - start_time) * 1000, 3)
    if query_time > threshold_ms:
      msg = f"Slow Query: {fn.__name__}" if log_msg == "" else f"Slow Query: {log_msg}"
      logger.warning(
        msg,
        extra={"latency": f"{query_time} ms", "caller": caller}
      )

    return result
  return wrapper


class Action(TypedDict):
  field: str
  action: str
  value: str


class Condition(TypedDict):
  field: str
  operator: str
  value: str


class RedisServicer:
  """
  A Redis service wrapper that extends the basic Redis client functionalities.
  It adds support for logging slow queries and implementing custom commands.
  """

  client: Union[Redis, FlaskRedis]

  def __init__(self, app: Flask = None, log_path: str = "", slow_threshold_ms: float = 50):
    """
    Initializes the RedisServicer instance, which sets up FlaskRedis and configures slow query logging.
    The service can be initialized with a Flask app during instantiation or later via the `init_app` method.
    
    Parameters:
    - app: Optional Flask application instance to initialize the Redis client.
    - log_path: Path where slow query logs will be stored.
    - slow_threshold_ms: Threshold (in milliseconds) to classify a query as slow and log it.
    """

    if app is not None:
      self.init_app(app, log_path, slow_threshold_ms)

  def init_app(self, app: Flask, log_path: str, slow_threshold_ms: float = 50):
    """
    Initializes the FlaskRedis with the provided Flask app and sets up logging for slow queries.
    Configures a logger to capture queries that exceed the defined threshold.
    
    Parameters:
    - app: Flask application instance to initialize the Redis client.
    - log_path: Path where slow Redis query logs will be stored.
    - slow_threshold_ms: Threshold (in milliseconds) to classify a query as slow and log it.
    """

    # Initializing the Redis client using FlaskRedis
    self.client = FlaskRedis(app)
    self.slow_threshold_ms = slow_threshold_ms

    # Configure the logger with a JSON format for logging slow queries
    self.logger = create_logger("redis", "info", log_path, 
                                BasicJSONFormatter(datefmt="%Y-%m-%d %H:%M:%S"))

  def __getattr__(self, name: str) -> Any:
    """
    Intercepts calls to Redis methods and wraps them with the slow query logging decorator.
    
    Parameters:
    - name: Name of the Redis command being accessed.
    
    Returns:
    - The original Redis method, wrapped with the slow query logging if applicable.
    """

    # Get the redis attribute from the actual Redis client
    redis_attr = getattr(self.client, name)

    # If the attribute is callable, wrap it with the slow query logger
    if callable(redis_attr):
      return log_slow_queries(self.slow_threshold_ms, self.logger, "", 
                              get_caller_name(), redis_attr)

    return redis_attr

  def custom_lock(
      self,
      name: str,
      timeout: Optional[float] = None,
      sleep: float = 0.1,
      blocking: bool = True,
      blocking_timeout: Optional[float] = None,
      lock_class: Union[None, Any] = None,
      thread_local: bool = True,
      caller: str = ""
    ) -> Any:
    """
    Returns a new Lock object using key ``name``, which mimics
    the behavior of threading.Lock.

    Parameters:
    - name: The Redis key used for the lock.
    - timeout: Optional maximum life for the lock. It will remain locked until release() is called by default.
    - sleep: Amount of time to sleep per loop iteration when the lock is in blocking mode.
    - blocking: Whether ``acquire`` should block until the lock is acquired.
    - blocking_timeout: Maximum time (in seconds) to wait for acquiring the lock. A value of ``None`` waits indefinitely.
    - lock_class: Forces a specific lock implementation. Defaults to Redis' Lua-based lock.
    - thread_local: If True, the lock token is stored in thread-local storage.

    Returns:
    - The Lock object.
    """
  
    return log_slow_queries(
      self.slow_threshold_ms, 
      self.logger,
      "lock",
      caller,
      self.client.lock
    )(name, timeout, sleep, blocking, blocking_timeout, lock_class, thread_local)

  def hset_with_condition(self, key: str, conditions: list[Condition], success_actions: list[Action], 
      failure_actions: list[Action], success_if_key_not_exists: bool):
    """
    Atomically update a Redis hash based on conditions.

    Args:
    - key (str): The Redis key to operate on.
    - conditions (list[Condition]): A list of conditions to check against the existing hash values.
    - success_actions (list[Action]): A list of actions to perform if the conditions are met.
    - failure_actions (list[Action]): A list of actions to perform if the conditions are not met.
    - success_if_key_not_exists (bool): Whether to treat a non-existent key as a successful case (True) or a failure (False).

    Returns:
    - int: 1 if the success path is executed, 0 if the failure path is executed.
    """

    script = """
    local key = KEYS[1]

    -- Parse arguments
    local conditions = cjson.decode(ARGV[1])
    local success_actions = cjson.decode(ARGV[2])
    local failure_actions = cjson.decode(ARGV[3])
    local success_if_key_not_exists = tonumber(ARGV[4]) -- 0: fail if key doesn't exist, 1: success if key doesn't exist
   
    -- Function to handle actions
    local function handle_actions(actions)
      local hset_args = {}
      local expr = 0

      for i, action in ipairs(actions) do
        local field = action["field"]
        local action_type = action["action"]
        local value = action["value"]

        if action_type == "set" then
          table.insert(hset_args, field)
          table.insert(hset_args, value)
        elseif action_type == "incr" then
          redis.call("HINCRBY", key, field, tonumber(value))
        elseif action_type == "expr" then
          expr = tonumber(value)
        end
      end

      -- Call HSET with all collected fields and values
      local batch_size = 500
      for i = 1, #hset_args, batch_size * 2 do
        local batch = {unpack(hset_args, i, math.min(i + batch_size * 2 - 1, #hset_args))}
        redis.call("HSET", key, unpack(batch))
      end

      if expr ~= 0 then 
        redis.call("EXPIRE", key, expr)
      end
    end

    if redis.call("EXISTS", key) == 0 then
      if success_if_key_not_exists == 1 then
        handle_actions(success_actions)
        return 1
      else
        handle_actions(failure_actions)
        return 0
      end
    end


    -- Get current values
    local current_values_raw = redis.call("HGETALL", key)

    -- Convert HGETALL results into a key-value map
    local current_values = {}
    for i = 1, #current_values_raw, 2 do
      local field = current_values_raw[i]
      local value = current_values_raw[i + 1]
      current_values[field] = value
    end

    -- Check conditions
    for i, condition in ipairs(conditions) do
      local field = condition["field"]
      local operator = condition["operator"]
      local value = condition["value"]

      if operator == "==" then
        local current_value = tostring(current_values[field]) or ""
        if current_value ~= tostring(value) then
          handle_actions(failure_actions)
          return 0
        end
      elseif operator == "!=" then
        local current_value = tostring(current_values[field]) or ""
        if current_value == tostring(value) then
          handle_actions(failure_actions)
          return 0
        end
      elseif operator == ">" then
        local current_value = tonumber(current_values[field]) or 0
        if current_value <= tonumber(value) then
          handle_actions(failure_actions)
          return 0
        end
      elseif operator == ">=" then
        local current_value = tonumber(current_values[field]) or 0
        if current_value < tonumber(value) then
          handle_actions(failure_actions)
          return 0
        end
      elseif operator == "<" then
        local current_value = tonumber(current_values[field]) or 0
        if current_value >= tonumber(value) then
          handle_actions(failure_actions)
          return 0
        end
      elseif operator == "<=" then
        local current_value = tonumber(current_values[field]) or 0
        if current_value > tonumber(value) then
          handle_actions(failure_actions)
          return 0
        end
      else
        handle_actions(failure_actions)
        return 0
      end
    end

    handle_actions(success_actions)
    return 1
    """

    caller = get_caller_name()

    return log_slow_queries(
      self.slow_threshold_ms, 
      self.logger,
      "eval hset_with_condition",
      caller,
      self.client.eval
    )(
      script, 
      1, 
      key, 
      json.dumps(conditions), 
      json.dumps(success_actions),
      json.dumps(failure_actions), 
      1 if success_if_key_not_exists else 0
    )

  def incr_with_expiry(self, key: str, incr: int, duration: timedelta) -> int:
    """
    Redis INCRBY operation with an expiry. The key is incremented by the given value, 
    and the key's expiry is updated after incrementing.

    Parameters:
    - key: The Redis key to increment.
    - incr: The amount by which to increment the key's value.
    - duration: Expiry time to be set for the key.

    Returns:
    - The new value after incrementing.
    """
     
    script = """
    local result = redis.call("INCRBY", KEYS[1], ARGV[1])
    redis.call("EXPIRE", KEYS[1], ARGV[2])
    return result
    """

    caller = get_caller_name()

    return log_slow_queries(
      self.slow_threshold_ms, 
      self.logger,
      "eval incr_with_expiry",
      caller,
      self.client.eval
    )(script, 1, key, incr, duration.seconds)

  def pop(self, key: str):
    """
    Simulate Redis Pop operation using Get and Del.

    Parameters:
    - key: The Redis key to pop.

    Returns:
    - Return the value (or nil if the key didn't exist)
    """
     
    script = """
    local result = redis.call("GET", KEYS[1])

    -- If the key exists, delete it
    if result then
      redis.call("DEL", KEYS[1])
    end

    return result
    """

    caller = get_caller_name()

    return log_slow_queries(
      self.slow_threshold_ms, 
      self.logger,
      "eval pop",
      caller,
      self.client.eval
    )(script, 1, key)