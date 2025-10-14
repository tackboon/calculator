import requests

from dataclasses import dataclass
from typing import Optional

from src.common.logger import BasicJSONFormatter, create_logger


@dataclass
class CommodityPriceResp:
  """
  Data class representing commodity price response.
  """

  price: float
  metal: str
  timestamp: int


class GoldAPIIOServicer:
  def __init__(self, log_path: str, access_token: str):
    """
    Initialize the goldapi.io service to get commodities price.
    """

    self.basic_url = "https://www.goldapi.io"
    self.access_token = access_token

    # Configure the logger with a JSON format for logging error
    self.logger = create_logger("goldapi", "info", log_path, 
                                BasicJSONFormatter(datefmt="%Y-%m-%d %H:%M:%S"))

  def get_commodities_price(self, symbol: str, currency: str) -> Optional[CommodityPriceResp]:
    """
    Get commodity price based on the given symbol.
    """

    url = f"{self.basic_url}/api/{symbol}/{currency}"
    headers = {"x-access-token": self.access_token}

    # Send Get request with parameters
    response = requests.get(url, headers=headers, timeout=10) # 10s timeout

    # Handle response
    if response.status_code == 200:
      json_resp: dict = response.json()

      return CommodityPriceResp(
        price=json_resp.get("price", 0),
        metal=json_resp.get("metal", ""),
        timestamp=json_resp.get("timestamp", 0)
      )
    
    self.logger.error(
      f"Failed to get commodity price with symbol {symbol}. Status code: {response.status_code}. Response: {response.text}"
    )
    return None
  