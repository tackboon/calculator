from flask_smorest import Blueprint

from src.app.journal.http_handler import create_journal_blueprint
from src.config import Config
from src.service.redis import RedisServicer
from src.service.sql_alchemy import SQLAlchemyServicer


def init_journal_app(config: Config, db_client: SQLAlchemyServicer, redis_client: RedisServicer) -> Blueprint: 
  return create_journal_blueprint()
