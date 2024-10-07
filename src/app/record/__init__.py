from flask_smorest import Blueprint
from flask_sqlalchemy import SQLAlchemy

from src.app.record.http_handler import create_record_blueprint
from src.config import Config
from src.service.redis import RedisServicer


def init_record_app(config: Config, db_client: SQLAlchemy, redis_client: RedisServicer) -> Blueprint: 
  return create_record_blueprint()
