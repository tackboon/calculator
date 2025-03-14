from flask_smorest import Blueprint

from src.app.forex.http_handler import create_forex_blueprint
from src.app.forex.manager import ForexService
from src.app.forex.repository import Repository
from src.config import Config
from src.service.redis import RedisServicer
from src.service.frankfurter import FrankFurtherServicer
from src.service.gold_api import GoldAPIServicer


def init_forex_app(config: Config, redis_client: RedisServicer, ffs: FrankFurtherServicer,
  gs: GoldAPIServicer) -> Blueprint: 
  repo = Repository(redis_client, ffs, gs)
  forex_service = ForexService(config, repo)

  return create_forex_blueprint(forex_service)
