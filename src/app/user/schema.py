import src.common.error as common_error

from marshmallow import Schema, fields, validate
from typing import Any


# Validators
password_validator = [
  validate.Length(min=8, max=20),
  validate.Regexp(
    regex=r"^(?=.*[A-Za-z])(?=.*\d)", 
    error="Password must contain atleast one number and one letter"
  )
]

# Create requests schema
class BaseRequestSchema(Schema):
  def handle_error(self, err: fields.ValidationError, data: Any, *, many: bool, **kwargs):
    raise common_error.UnprocessableEntityError(message=err.messages ,data=err.args)


class BlockUserRequestSchema(BaseRequestSchema):
  user_id = fields.Int(required=True)


class LoginRequestSchema(BaseRequestSchema):
  email = fields.Email(required=True)
  password = fields.Str(required=True, load_only=True, validates=password_validator)
  device_name = fields.Str(required=True, validate=validate.Length(max=255))
  set_cookie = fields.Bool(required=False, missing=False)


class RefreshTokenRequestSchema(BaseRequestSchema):
  set_cookie = fields.Bool(required=False, missing=False)

class ResetPasswordRequestSchema(BaseRequestSchema):
  new_password = fields.Str(required=True, load_only=True, validates=password_validator)


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
  id = fields.Int()
  email = fields.Str()
  role = fields.Int()
