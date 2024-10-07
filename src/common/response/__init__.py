from typing import Any, Optional


def make_response(code: int, message: str = "", data: Optional[dict] = None) -> dict[str, Any]:
  """
  Constructs a response dictionary with a given status code, message, and data.
  
  Parameters:
  - code: The status code of the response.
  - message: Optional message to include in the response.
  - data: Optional dictionary containing response data.
  
  Returns:
  - A dictionary representing the response.
  """

  return {
    "code": code,
    "data": data or {},  # Default to an empty dictionary if data is None
    **({"message": message} if message else {})  # Add message only if it's provided
  }
