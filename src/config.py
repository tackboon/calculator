import os

from dataclasses import dataclass

@dataclass
class Config:
  """
  Configuration class to hold application settings loaded from environment variables.
  """

  app_mode: str # App mode to run [http_public, http_internal]
  debug_mode: bool
  log_base_dir: str # Log base directory
  log_level: str # Log level
  session_lifetime: int # Session's lifetime in seconds.
  access_token_lifetime: int # Access token's lifetime in seconds.
  max_session_per_user: int # Maximum number of concurrent sessions per user.
  db_uri: str # Database connection URI
  db_slow_threshold: float # Threshold in milliseconds to identify slow queries.
  redis_uri: str # Redis connection URI
  redis_slow_threshold: float # Threshold in milliseconds to identify slow queries.

# Initialize configs
config = Config(
  app_mode = os.getenv("APP_MODE", "http_public"),
  debug_mode = os.getenv("FLASK_DEBUG", "1") == "1",
  log_base_dir = os.getenv("LOG_BASE", ""),
  log_level = os.getenv("LOG_LEVEL", "DEBUG"),
  session_lifetime = int(os.getenv("SESSION_LIFETIME", "7776000")),
  access_token_lifetime = int(os.getenv("ACCESS_TOKEN_LIFETIME", "3600")),
  max_session_per_user= int(os.getenv("MAX_SESSION_PER_USER", "10")),
  db_uri = os.getenv("DATABASE_URI", ""),
  db_slow_threshold = float(os.getenv("DB_SLOW_THRESHOLD", "200")),
  redis_uri = os.getenv("REDIS_URI", ""),
  redis_slow_threshold = float(os.getenv("REDIS_SLOW_THRESHOLD", "50"))
)
