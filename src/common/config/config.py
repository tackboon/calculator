from dataclasses import dataclass

@dataclass
class Config:
  debug_mode: bool
  log_base_dir: str # Log base directory
  log_level: str # Log level
  session_lifetime: int # Session's lifetime in seconds.
  access_token_lifetime: int # Access token's lifetime in seconds.
  max_session_per_user: int # Maximum number of sessions a user can have concurrently.
  db_uri: str # Database URI
  redis_uri: str # Redis URI
