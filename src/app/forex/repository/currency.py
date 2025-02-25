import json

from typing import Union
from redis import Redis
from typing import Optional
from datetime import timedelta
from dataclasses import asdict

from src.extensions import app_logger
from src.service.redis import RedisServicer
from src.service.frankfurter import FrankFurtherServicer
from src.service.gold_api import GoldAPIServicer


class CurrencyRepo:
  rdb: Union[Redis, RedisServicer]

  def __init__(self, rdb: RedisServicer, ffs: FrankFurtherServicer, gs: GoldAPIServicer):
    self.rdb = rdb
    self.ffs = ffs
    self.gs = gs

  def get_currency_rate(self, base: str) -> Optional[dict]:
    """
    Get currency rates by base currency.
    Return rates data in json format if found, else None.
    """

    key, duration = self._get_currency_rate_cache_info(base)

    # Get data from cache
    rate_bytes = self.rdb.get(key)
    if rate_bytes is not None:    
      if rate_bytes == b"":
        return None
      
      return json.loads(rate_bytes)

    # Get data from service
    rates = self.ffs.get_currency_rates(base)
    if rates is None:
      return None

    # Store data to cache
    rate_dict = asdict(rates)
    json_str = json.dumps(rate_dict)
    if not self.rdb.set(key, json_str, duration):
      app_logger.error(f"Failed to write currency rates data to cache, key: {key}.")

    return rate_dict
    
  def get_commodity_price(self, symbol: str) -> Optional[dict]:
    """
    Get commodity price by symbol.
    Return price data in json format if found, else None.
    """

    key, duration = self._get_commodity_price_cache_info(symbol)

    # Get data from cache
    price_bytes = self.rdb.get(key)
    if price_bytes is not None:    
      if price_bytes == b"":
        return None
      
      return json.loads(price_bytes)
    
    # Get data from service
    prices = self.gs.get_commodities_price(symbol)
    if prices is None:
      return None
    
    # Store data to cache
    price_dict = asdict(prices)
    json_str = json.dumps(price_dict)
    if not self.rdb.set(key, json_str, duration):
      app_logger.error(f"Failed to write commodity price data to cache, key: {key}.")

    return price_dict

  def _get_currency_rate_cache_info(self, base: str) -> tuple[str, timedelta]:
    """
    Construct currency rate cache key and cache duration.
    """

    return f"forex:currency:{base}", timedelta(days=1)  
  
  def _get_commodity_price_cache_info(self, symbol: str) -> tuple[str, timedelta]:
    """
    Construct commodity price cache key and cache duration.
    """

    return f"forex:commodity:{symbol}", timedelta(minutes=1)  
  