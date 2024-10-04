import src.common.response.custom_error as custom_error

from marshmallow import Schema, fields, validate
from typing import Any


# Create requests schema
class BaseRequestSchema(Schema):
  def handle_error(self, error: fields.ValidationError, data: Any, *, many: bool, **kwargs):
    raise custom_error.UnprocessableEntityError(message=error.messages ,data=error.args)


class LoginRequestSchema(BaseRequestSchema):
  username = fields.Str(required=True)
  password = fields.Str(required=True, load_only=True)
  device_id = fields.Str(required=True, validate=validate.Length(max=255))
  device_name = fields.Str(required=True, validate=validate.Length(max=255))


class RegisterRequestSchema(BaseRequestSchema):
  username = fields.Str(required=True, validate=validate.Length(min=3, max=20))
  password = fields.Str(required=True, load_only=True, validates=[
    validate.Length(min=6, max=20),
    validate.Regexp(
      regex=r"^(?=.*[A-Za-z])(?=.*\d)", 
      error="Password must contain atleast one number and one letter"
    )
  ])
  device_id = fields.Str(required=True, validate=validate.Length(max=255))
  device_name = fields.Str(required=True, validate=validate.Length(max=255))


class UsernameRequestSchema(BaseRequestSchema):
  username = fields.Str(required=True, validate=validate.Length(min=3, max=20))


# Create response schema
class BaseResponseSchema(Schema):
  code = fields.Int()
  message = fields.Str()
  data = fields.Dict()


class UserResponseSchema(Schema):
  id = fields.Int(dump_only=True)
  username = fields.Str()
