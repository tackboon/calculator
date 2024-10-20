class CustomAPIException(Exception):
  """
  Base class for all custom exceptions
  """

  def __init__(self, status_code: int, code: int, status: str, message: str, data: dict):
    """
    Initializes the CustomAPIException.

    Parameters:
    - status_code: The HTTP status code to return.
    - code: A custom application-level code for the error.
    - status: A short description of the error.
    - message: A detailed error message.
    - data: Additional data for the error
    """

    super().__init__(message)
    self.status_code = status_code
    self.code = code
    self.status = status
    self.message = message
    self.data = data


class NotFoundError(CustomAPIException):
  """
  Exception raised when a resource is not found.
  """

  def __init__(self, message: str = "Resource not found.", data: dict = {}):
    super().__init__(status_code=200, code=404, status="Not Found", message=message, data=data)


class ResourceConflictError(CustomAPIException):
  """
  Exception raised when a resource conflict occurs (e.g., duplicate resource).
  """

  def __init__(self, message: str = "Resource already exists", data: dict = {}):
    super().__init__(status_code=200, code=409, status="Conflict", message=message, data=data)


class TooManyRequestError(CustomAPIException):
  """
  Exception raised when too many requests happened.
  """

  def __init__(self, message: str = "Too Many Requests", data: dict = {}):
    super().__init__(status_code=200, code=429, status="Too Many Requests", message=message, data=data)


class UnauthorizedError(CustomAPIException):
  """
  Exception raised when authentication or authorization fails.
  """

  def __init__(self, message: str = "Unauthorized", data: dict = {}):
    super().__init__(status_code=200, code=401, status="Unauthorized", message=message, data=data)


class UnprocessableEntityError(CustomAPIException):
  """
  Exception raised when the server understands the content type of the request entity but cannot process it.
  """

  def __init__(self, message: str = "Unprocessable Entity", data: dict = {}):
    super().__init__(status_code=200, code=422, status="Unprocessable Entity", message=message, data=data)
