import src.app.forex.schema as schema
import src.common.error as common_error

from flask_smorest import Blueprint
from flask.views import MethodView

from src.app.forex.manager import ForexService 
from src.common.response import make_response_body
from src.app.forex.constant import (
  DEFAULT_CURRENCIES, DEFAULT_COMMODITIES, DEFAULT_CURRENCY_PAIRS, DEFAULT_COMMODITY_PAIRS
)


def create_forex_blueprint(forex_service: ForexService) -> Blueprint:
  forex_bp = Blueprint("Forex", __name__, description="Operations on forex")

  @forex_bp.route("/assets")
  class Asset(MethodView):
    @forex_bp.response(200, schema.BaseResponseSchema)
    def get(self):
      resp_data = {
        "currencies": DEFAULT_CURRENCIES,
        "currency_pairs": DEFAULT_CURRENCY_PAIRS,
        "commodity_pairs": DEFAULT_COMMODITY_PAIRS
      }
      return make_response_body(200, "", resp_data), 200
    

  @forex_bp.route("/commodities")
  class Commodity(MethodView):
    @forex_bp.arguments(schema.GetCommodityPriceRequestSchema, location="query")
    @forex_bp.response(200, schema.BaseResponseSchema)
    def get(self, params: dict):
      symbol = str(params["symbol"]).upper()
      if symbol not in DEFAULT_COMMODITIES:
         raise common_error.UnprocessableEntityError("Invalid symbol.")

      resp_data = forex_service.get_commodity_price(symbol)
      return make_response_body(200, "", resp_data), 200
    

  @forex_bp.route("/currencies")
  class Currency(MethodView):
    @forex_bp.arguments(schema.GetCurrencyRateRequestSchema, location="query")
    @forex_bp.response(200, schema.BaseResponseSchema)
    def get(self, params: dict):
      base = str(params["base"]).upper()
      if base not in DEFAULT_CURRENCIES:
         raise common_error.UnprocessableEntityError("Invalid currency.")
      
      resp_data = forex_service.get_currency_rate(base)
      return make_response_body(200, "", resp_data), 200

  return forex_bp
  