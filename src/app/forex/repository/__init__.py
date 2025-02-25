from src.service.redis import RedisServicer
from src.service.frankfurter import FrankFurtherServicer
from src.service.gold_api import GoldAPIServicer

from src.app.forex.repository.currency import CurrencyRepo


class Repository:
  def __init__(self, rdb: RedisServicer, ffs: FrankFurtherServicer, gs: GoldAPIServicer):
    self.currency = CurrencyRepo(rdb, ffs, gs)
