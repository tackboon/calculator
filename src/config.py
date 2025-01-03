import os

from dataclasses import dataclass

@dataclass
class Config:
  """
  Configuration class to hold application settings loaded from environment variables.
  """

  app_mode: str # App mode to run [http_public, http_internal]
  cors_allowed_origins: str # CORS origins to whitelist
  cookie_domain: str # Auth cookies's domain
  cookie_samesite: str # Auth cookie's samesite
  debug_mode: bool
  log_base_dir: str # Log base directory
  log_level: str # Log level
  db_uri: str # Database connection URI
  db_slow_threshold: float # Threshold in milliseconds to identify slow queries.
  redis_uri: str # Redis connection URI
  redis_slow_threshold: float # Threshold in milliseconds to identify slow queries.
  reset_password_link: str # Reset password link base url.
  send_grid_token: str # SendGrid auth token.
  sender_email: str # Email to use for sending email to user.


# Initialize configs
config = Config(
  app_mode = os.getenv("APP_MODE", "http_public"),
  cors_allowed_origins = os.getenv("CORS_ALLOWED_ORIGINS", ""),
  cookie_domain = os.getenv("COOKIE_DOMAIN", ""),
  cookie_samesite = os.getenv("COOKIE_SAMESITE", "Lax"),
  debug_mode = os.getenv("FLASK_DEBUG", "1") == "1",
  log_base_dir = os.getenv("LOG_BASE", ""),
  log_level = os.getenv("LOG_LEVEL", "DEBUG"),
  db_uri = os.getenv("DATABASE_URI", ""),
  db_slow_threshold = float(os.getenv("DB_SLOW_THRESHOLD", "200")),
  redis_uri = os.getenv("REDIS_URI", ""),
  redis_slow_threshold = float(os.getenv("REDIS_SLOW_THRESHOLD", "50")),
  reset_password_link= os.getenv("RESET_PASSWORD_LINK", ""),
  send_grid_token = os.getenv("SEND_GRID_TOKEN", ""),
  sender_email = os.getenv("SENDER_EMAIL", "")
)
