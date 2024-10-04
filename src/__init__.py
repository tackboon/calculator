import os

from flask import Flask
from flask_smorest import Api

from src.extensions import (
  app_middleware, config, db, err_middleware, jwt_middleware, redis_client, request_id_middleware 
)
from src.record import record_bp
from src.user import user_bp


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

  # Initialize the database
  db.init_app(app)

  # Initialize the redis
  redis_client.init_app(app)

  # Initialize middlewares
  request_id_middleware.init_app(app)
  err_middleware.init_app(app)
  jwt_middleware.init_app(app)
  app_middleware.init_app(
    app, 
    config.debug_mode, 
    os.path.join(config.log_base_dir, os.path.basename("access.log")) if config.log_base_dir != "" else "",
    config.log_level
  )

  # Initialize the API with flask_smorest
  api = Api(app)

  # Register blueprints
  api.register_blueprint(user_bp, url_prefix="/app/api/v1/user")
  api.register_blueprint(record_bp, url_prefix="/app/api/v1/record")

  return app
