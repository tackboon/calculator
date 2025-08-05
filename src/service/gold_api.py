import requests

from datetime import datetime
from dataclasses import dataclass
from typing import Optional

from src.common.logger import BasicJSONFormatter, create_logger


@dataclass
class CommodityPriceResp:
  """
  Data class representing commodity price response.
  """

  name: str
  price: float
  symbol: str
  updated_at: int


class GoldAPIServicer:
  def __init__(self, log_path: str):
    """
    Initialize the gold-api service to get commodities price.
    """

    self.basic_url = "https://api.gold-api.com"

    # Configure the logger with a JSON format for logging error
    self.logger = create_logger("gold-api", "info", log_path, 
                                BasicJSONFormatter(datefmt="%Y-%m-%d %H:%M:%S"))

  def get_commodities_price(self, symbol: str) -> Optional[CommodityPriceResp]:
    """
    Get commodity price based on the given symbol.
    """

    url = f"{self.basic_url}/price/{symbol}"

    # Send Get request with parameters
    response = requests.get(url, timeout=10) # 10s timeout

    # Handle response
    if response.status_code == 200:
      json_resp: dict = response.json()

      updated_at = 0
      update_time = json_resp.get("updatedAt", 0)
      if update_time is not None:
        updated_at = int(datetime.strptime(update_time, "%Y-%m-%dT%H:%M:%SZ").timestamp())

      return CommodityPriceResp(
        name=json_resp.get("name", ""),
        price=json_resp.get("price", 0),
        symbol=json_resp.get("symbol", ""),
        updated_at=updated_at
      )
    
    self.logger.error(
      f"Failed to get commodity price with symbol {symbol}. Status code: {response.status_code}. Response: {response.text}"
    )
    return None
  