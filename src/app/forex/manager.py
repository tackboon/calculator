from concurrent.futures import ThreadPoolExecutor, as_completed

from src.app.forex.repository import Repository
from src.config import Config
from src.extensions import app_logger


class ForexService:
  def __init__(self, config: Config, repo: Repository):

    self.config = config
    self.repo = repo

  def get_currency_rate(self, base_currencies: list[str]) -> list[dict]:
    resp: list[dict] = []
 
    with ThreadPoolExecutor() as executor:
      futures = { executor.submit(self.repo.currency.get_currency_rate, base): base 
                 for base in base_currencies }

      for future in as_completed(futures):
        rates = future.result()
        if rates is None:
          app_logger.error(f"Failed to get currency rates, base: {futures[future]}")
          continue
        resp.append(rates)
    
    return resp

  def get_commodity_price(self, symbols: list[str]) -> list[dict]:
    resp: list[dict] = []

    with ThreadPoolExecutor() as executor:
      futures = { executor.submit(self.repo.currency.get_commodity_price, symbol): symbol for symbol in symbols}
      
      for future in as_completed(futures):
        price = future.result()
        if price is None:
          app_logger.error(f"Failed to get commodity price, symbols: {futures[future]}")
          continue
        resp.append(price)
    
    return resp
  