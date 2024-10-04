import os

from flask_redis import FlaskRedis
from flask_sqlalchemy import SQLAlchemy
from request_id import RequestId

from src.common.config.config import Config
from src.common.ip.ip import IPLocation
from src.common.logger.logger import BasicJSONFormatter, create_logger
from src.middleware.app import AppMiddleware
from src.middleware.error import ErrorMiddleware
from src.middleware.jwt import JWTMiddleware


# Initialize configs
config = Config(
  debug_mode = os.getenv("FLASK_DEBUG", "1") == "1",
  log_base_dir = os.getenv("LOG_BASE", ""),
  log_level = os.getenv("LOG_LEVEL", "DEBUG"),
  session_lifetime = int(os.getenv("SESSION_LIFETIME", "7776000")),
  access_token_lifetime = int(os.getenv("ACCESS_TOKEN_LIFETIME", "3600")),
  max_session_per_user= int(os.getenv("MAX_SESSION_PER_USER", "10")),
  db_uri = os.getenv("DATABASE_URI", ""),
  redis_uri = os.getenv("REDIS_URI", "")
)

# Initialize logger
app_logger = create_logger(
  "app",
  config.log_level, 
  os.path.join(config.log_base_dir, os.path.basename("app.log")) if config.log_base_dir != "" else "", 
  BasicJSONFormatter(datefmt="%Y-%m-%d %H:%M:%S")
)

# Create middlewares
db = SQLAlchemy()
redis_client = FlaskRedis()
request_id_middleware = RequestId()
jwt_middleware = JWTMiddleware()
err_middleware = ErrorMiddleware()
app_middleware = AppMiddleware()

# Initialize IP2Location
ip_location = IPLocation("IP2LOCATION-LITE-DB3.BIN", "IP2LOCATION-LITE-DB3.IPV6.BIN")
