from flask_smorest import Blueprint

from src.app.record.http_handler import create_record_blueprint
from src.config import Config
from src.service.redis import RedisServicer
from src.service.sql_alchemy import SQLAlchemyServicer


def init_record_app(config: Config, db_client: SQLAlchemyServicer, redis_client: RedisServicer) -> Blueprint: 
  return create_record_blueprint()
