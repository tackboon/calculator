import os
import sys

from flask import Flask
from flask_smorest import Api
from request_id import RequestId

from src.app.user import init_internal_user_app, init_user_app
from src.app.record import init_record_app
from src.app.user.repository import UserRepo
from src.config import config
from src.extensions import app_logger, auth_service, db_service, ip_service, redis_service
from src.middleware.access_log import AccessLogMiddleware
from src.middleware.error import ErrorMiddleware


def create_app():
  app = Flask(__name__)

  # API Configuration
  app.config["API_TITLE"] = "Calculator Rest API"
  app.config["API_VERSION"] = "v1"
  app.config["OPENAPI_VERSION"] = "3.0.3"
  app.config["OPENAPI_URL_PREFIX"] = "/"
  app.config["OPENAPI_SWAGGER_UI_PATH"] = "/swagger-ui"
  app.config["OPENAPI_SWAGGER_UI_URL"] = "https://cdn.jsdelivr.net/npm/swagger-ui-dist/"

  # Database configuration
  app.config["SQLALCHEMY_DATABASE_URI"] = config.db_uri
  app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

  # Configuring Redis connection
  app.config["REDIS_URL"] = config.redis_uri

  # Load the private and public keys for ES256
  with open('ec_private.pem', 'r') as f:
    private_key = f.read()

  with open('ec_public.pem', 'r') as f:
    public_key = f.read()

  # Setup the Flask-JWT-Extended extension
  app.config["JWT_ALGORITHM"] = "ES256"
  app.config["JWT_PRIVATE_KEY"] = private_key
  app.config["JWT_PUBLIC_KEY"] = public_key

  # Disable strict slash
  app.url_map.strict_slashes = False

  # Initialize services
  db_service.init_app(
    app, 
    os.path.join(config.log_base_dir, os.path.basename("sql.log")) if config.log_base_dir != "" else "",
    config.db_slow_threshold
  )
  redis_service.init_app(
    app,
    os.path.join(config.log_base_dir, os.path.basename("redis.log")) if config.log_base_dir != "" else "",
    config.db_slow_threshold
  )
  auth_service.init_app(app, UserRepo(config, db_service, redis_service)) 

  # Initialize middlewares
  access_log_middleware = AccessLogMiddleware(
    app, 
    config.debug_mode, 
    os.path.join(config.log_base_dir, os.path.basename("access.log")) if config.log_base_dir != "" else "",
    config.log_level
  )
  error_middleware = ErrorMiddleware(app)
  request_id_middleware = RequestId(app)

  # Initialize the API with flask_smorest
  api = Api(app)

  # Register blueprints
  match config.app_mode:
    case "http_public":
      api.register_blueprint(
        init_user_app(config, db_service, redis_service, ip_service), 
        url_prefix="/app/api/v1/user"
      )
      api.register_blueprint(
        init_record_app(config, db_service, redis_service), 
        url_prefix="/app/api/v1/record"
      )
    case "http_internal":
      api.register_blueprint(
        init_internal_user_app(config, db_service, redis_service, ip_service), 
        url_prefix="/app/api/v1/user"
      )
    case _:  
      app_logger.fatal(f"Invalid app mode: '{config.app_mode}' detected. Expected 'http_pulic' or 'http_internal'.")
      sys.exit(1)

  return app
