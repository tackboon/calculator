import src.common.error as common_error

from marshmallow import EXCLUDE, Schema, fields
from typing import Any


# Create requests schema
class BaseRequestSchema(Schema):
  class Meta:
    unknown = EXCLUDE


  def handle_error(self, err: fields.ValidationError, data: Any, *, many: bool, **kwargs):
    raise common_error.UnprocessableEntityError(message=err.messages ,data=err.args)


class GetCurrencyRateRequestSchema(BaseRequestSchema):
  base = fields.Str(required=True)


class GetCommodityPriceRequestSchema(BaseRequestSchema):
  symbol = fields.Str(required=True)


# Create response schema
class BaseResponseSchema(Schema):
  code = fields.Int()
  message = fields.Str()
  data = fields.Dict()
