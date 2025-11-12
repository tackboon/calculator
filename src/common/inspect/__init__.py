import inspect

def get_caller_name() -> str:
  """
  Retrieves the name of the function that called the function 
  where this function was invoked.
  
  Returns:
  - The name of the calling function, or 'Unknown' if it cannot be determined.
  """
  
  caller_frame = inspect.currentframe()
  if caller_frame is not None and caller_frame.f_back is not None and caller_frame.f_back.f_back is not None:
      return caller_frame.f_back.f_back.f_code.co_name
  return "Unknown"
