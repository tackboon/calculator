from typing import Any, Optional


def make_response(code: int, message: str = "", data: Optional[dict] = None) -> dict[str, Any]:
  """Constructs and sets the response object with a given status code, message, and data."""

  resp: dict[str, Any] = {"code": code}

  if data is None:
    data = {}
  resp["data"] = data

  if message != "":
    resp["message"] = message

  return resp
