class CustomAPIException(Exception):
  """Base class for all custom exceptions"""

  def __init__(self, status_code: int, code: int, status: str, message: str, data: dict):
    super().__init__(message)
    self.status_code = status_code
    self.code = code
    self.status = status
    self.message = message
    self.data = data


class ResourceConflictError(CustomAPIException):
  def __init__(self, message: str = "Resource already exists", data: dict = {}):
    super().__init__(status_code=200, code=409, status="Conflict", message=message, data=data)


class UnauthorizedError(CustomAPIException):
  def __init__(self, message: str = "Unauthorized", data: dict = {}):
    super().__init__(status_code=200, code=401, status="Unauthorized", message=message, data=data)


class UnprocessableEntityError(CustomAPIException):
  def __init__(self, message: str = "Unprocessable Entity", data: dict = {}):
    super().__init__(status_code=200, code=422, status="Unprocessable Entity", message=message, data=data)
