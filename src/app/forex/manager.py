
from src.app.forex.repository import Repository
from src.config import Config


class ForexService:
  def __init__(self, config: Config, repo: Repository):

    self.config = config
    self.repo = repo

  def get_currency_rate(self, base_currency: str) -> dict:
    rates = self.repo.currency.get_currency_rate(base_currency)
    if rates is None:
      raise Exception(f"Failed to get currency rates, base: {base_currency}")
    
    return rates

  def get_commodity_price(self, symbol: str) -> dict:
    price = self.repo.currency.get_commodity_price(symbol)
    if price is None:
      raise Exception(f"Failed to get commodity price, symbol: {symbol}")
    
    return price
  