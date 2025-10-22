import requests

from typing import Optional
from dataclasses import dataclass

from src.common.logger import BasicJSONFormatter, create_logger


@dataclass
class CurrencyRateResp:
  """
  Data class representing currency rates response.
  """

  amount: float
  base: str
  date: str
  rates: dict[str, float]


class FrankFurtherServicer:
  def __init__(self, log_path: str):
    """
    Initialize the frankfurther api service to get currency pairs exchange rate.
    """

    self.basic_url = "https://api.frankfurter.dev/v1"

    # Configure the logger with a JSON format for logging error
    self.logger = create_logger("frankfurther", "info", log_path, 
                                BasicJSONFormatter(datefmt="%Y-%m-%d %H:%M:%S"))

  def get_currency_rates(self, base_currency: str) -> Optional[CurrencyRateResp]:
    """
    Get currency exchange rates based on the base currency.
    """

    url = f"{self.basic_url}/latest"
    params = {
      "base": base_currency
    }

    try:
      # Send Get request with parameters
      response = requests.get(url, params=params, timeout=10) # 10s timeout

      # Handle response
      if response.status_code == 200:
        json_resp:dict = response.json()

        return CurrencyRateResp(
          amount=json_resp.get("amount", 0),
          base=json_resp.get("base", ""),
          date=json_resp.get("date", ""),
          rates=json_resp.get("rates", {})
        )

      self.logger.error(
        f"Failed to get currency rates with base currency of {base_currency}. Status code: {response.status_code}. Response: {response.text}"
      )
      return None
    except Exception as e:
      self.logger.error(
        f"Failed to get currency rates with base currency of {base_currency}. Error: {e}."
      )
      return None
  