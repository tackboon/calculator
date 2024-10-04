from redis import Redis
from typing import Awaitable


def hset_with_expiry(client: Redis, key: str, field: str, value: str, duration: int) -> (Awaitable[int] | int):
  """
  Redis HSET with expiry. 
  Return the number of fields that were added.
  """

  script = """
  redis.call("HSET", KEYS[1], ARGV[1], ARGV[2])
  redis.call("EXPIRE", KEYS[1], ARGV[3])

  return 1
  """

  return client.eval(script, 1, key, field, value, duration)

def hsetnx_with_expiry(client: Redis, key: str, field: str, value: str, duration: int) -> (Awaitable[int] | int):
  """
  Redis HSETNX with expiry. 
  Return 1 if HSETNX created a field, otherwise 0.
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

  return client.eval(script, 1, key, field, value, duration)

def hset_if_exist(client: Redis, key: str, field: str, value: str) -> (Awaitable[int] | int):
  """
  Redis HSET if the field already exists in the hash.
  Return 1 if the field was updated, 0 if the field does not exist.
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

  return client.eval(script, 1, key, field, value)
