import src.common.error as common_error

from marshmallow import Schema, fields, validate
from typing import Any


# Create requests schema
class BaseRequestSchema(Schema):
  def handle_error(self, err: fields.ValidationError, data: Any, *, many: bool, **kwargs):
    raise common_error.UnprocessableEntityError(message=err.messages ,data=err.args)


class BlockUserRequestSchema(BaseRequestSchema):
  user_id = fields.Int(required=True)


class LoginRequestSchema(BaseRequestSchema):
  email = fields.Email(required=True)
  password = fields.Str(required=True, load_only=True, validates=[
    validate.Length(min=6, max=20),
    validate.Regexp(
      regex=r"^(?=.*[A-Za-z])(?=.*\d)", 
      error="Password must contain atleast one number and one letter"
    )
  ])
  device_id = fields.Str(required=True, validate=validate.Length(max=255))
  device_name = fields.Str(required=True, validate=validate.Length(max=255))


class RemoveAllSessionsRequestSchema(BaseRequestSchema):
  user_id = fields.Int(required=True)


class EmailRequestSchema(BaseRequestSchema):
  email = fields.Email(required=True)


# Create response schema
class BaseResponseSchema(Schema):
  code = fields.Int()
  message = fields.Str()
  data = fields.Dict()


class UserResponseSchema(Schema):
  id = fields.Int(dump_only=True)
  email = fields.Str()
