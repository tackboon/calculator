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


class ConditionAction(TypedDict):
  conditions: list[Condition]
  success_actions: list[Action]
  failure_actions: list[Action]


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

  def hset_with_condition(self, key: str, conditions_and_actions: list[ConditionAction], 
    fields_to_return: set[str]) -> dict:
    """
    Atomically update a Redis hash based on conditions and actions.

    Args:
    - key (str): The Redis key to operate on.
    - conditions_and_actions (list[ConditionAction]): A list of condition-action sets where each set contains conditions to check and actions to perform based on the result of the condition check.
    - fields_to_return (set[str]): A set of fields to return after execution.

    Returns:
    - dict: A dictionary containing two keys:
      - "results": A dictionary with the values of the requested fields after the operation.
      - "is_success": A list of 1 and 0 to indicate the success of each condition set.
    """

    script = """
    	local key = KEYS[1]
      local results = {}
      local is_success = {}

      -- Parse arguments
      local fields = cjson.decode(ARGV[1]) -- fields to fetch
      local fields_to_return = cjson.decode(ARGV[2]) -- fields to return
      local sets = cjson.decode(ARGV[3]) -- multiple (conditions, actions) sets

      -- Get current values with HMGET
      local current_values_raw = {}
      if #fields > 0 then
        current_values_raw = redis.call("HMGET", key, unpack(fields))
      end

      -- Convert HMGET results into a key-value map
      local current_values = {}
      for i = 1, #fields do 
        current_values[fields[i]] = current_values_raw[i]
      end

      -- Function to handle actions
      local function handle_actions(actions)
        local hset_args = {}

        for i, action in ipairs(actions) do
          local field = action["field"]
          local action_type = action["action"]
          local value = action["value"]

          if #hset_args > 0 and action_type ~= "hset" then
            redis.call("HSET", key, unpack(hset_args))
            hset_args = {}
          end

          if action_type == "hset" then
            hset_args[#hset_args + 1] = field
            hset_args[#hset_args + 1] = value

            if fields_to_return[field] then
              results[field] = value
            end		
          elseif action_type == "hincr" then
            local new_value = redis.call("HINCRBY", key, field, tonumber(value))

            if fields_to_return[field] then 
              results[field] = new_value
            end
          elseif action_type == "hexpire" then
            redis.call("HEXPIRE", key, field, tonumber(value))
          elseif action_type == "hpersist" then
            redis.call("HPERSIST", key, field)
          elseif action_type == "expire" then
            redis.call("EXPIRE", key, tonumber(value))
          elseif action_type == "persist" then
            redis.call("PERSIST", key)
          end				
        end

        if #hset_args > 0 then
          redis.call("HSET", key, unpack(hset_args))
        end
      end

      -- Function to handle conditions
      local function handle_conditions(conditions)
        for i, condition in ipairs(conditions) do
          local field = condition["field"]
          local operator = condition["operator"]
          local value = condition["value"]
          
          if operator == "==" then
            local current_value = current_values[field] and tostring(current_values[field]) or ""
            if current_value ~= tostring(value) then
              return 0
            end
          elseif operator == "!=" then
            local current_value = current_values[field] and tostring(current_values[field]) or ""
            if current_value == tostring(value) then
              return 0
            end
          elseif operator == ">" then
            local current_value = current_values[field] and tonumber(current_values[field]) or 0
            if current_value <= tonumber(value) then
              return 0
            end
          elseif operator == ">=" then
            local current_value = current_values[field] and tonumber(current_values[field]) or 0
            if current_value < tonumber(value) then
              return 0
            end
          elseif operator == "<" then
            local current_value = current_values[field] and tonumber(current_values[field]) or 0
            if current_value >= tonumber(value) then
              return 0
            end
          elseif operator == "<=" then
            local current_value = current_values[field] and tonumber(current_values[field]) or 0
            if current_value > tonumber(value) then
              return 0
            end
          end
        end

        return 1
      end

      -- Process conditions and actions
      for i = 1, #sets do
        -- Check conditions
        if handle_conditions(sets[i]["conditions"]) == 1 then
          handle_actions(sets[i]["success_actions"])
          is_success[i] = 1
        else
          handle_actions(sets[i]["failure_actions"])
          is_success[i] = 0
        end
      end

      -- Populate results from fields_to_return
      for field, _ in pairs(fields_to_return) do
        if results[field] == nil and current_values[field] ~= nil then
          results[field] = current_values[field]
        end
      end

      return cjson.encode({results=results or {}, is_success=is_success or {}})
    """

    fields: list[str] = []
    field_sets: set[str] = set()

    # Populate fields from conditions
    for i, ca in enumerate(conditions_and_actions):
      for condition in ca["conditions"]:
        if condition["field"] != "" and condition["field"] not in field_sets:
          fields.append(condition["field"])
          field_sets.add(condition["field"])

      if "conditions" not in ca:
        conditions_and_actions[i]["conditions"] = []

      if "success_actions" not in ca:
        conditions_and_actions[i]["success_actions"] = []

      if "failure_actions" not in ca:
        conditions_and_actions[i]["failure_actions"] = []

    # Populate field from fields_to_return
    for field in fields_to_return:
      if field == "":
        fields_to_return.remove(field)
        continue
      
      if field not in field_sets:
        field_sets.add(field)
        fields.append(field)

    # Get caller name
    caller = get_caller_name()

    return json.loads(log_slow_queries(
      self.slow_threshold_ms, 
      self.logger,
      "eval hset_with_condition",
      caller,
      self.client.eval
    )(
      script, 
      1, 
      key, 
      json.dumps(fields),
      json.dumps(list(fields_to_return)),
      json.dumps(conditions_and_actions), 
    ))

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

  def pop(self, key: str) -> bytes:
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