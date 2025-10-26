import src.app.user.constant as constant
import src.app.user.schema as schema
import src.common.error as common_error

from flask import g, make_response, request, Response
from flask.views import MethodView
from flask_jwt_extended import (
  jwt_required, set_access_cookies, set_refresh_cookies, unset_access_cookies, unset_refresh_cookies
)
from flask_smorest import Blueprint


from src.app.user.manager import UserService
from src.common.response import make_response_body
from src.service.auth.token import get_info_from_token, get_token_expiry
from src.extensions import app_logger, auth_service

def set_tokens_in_cookies(resp_body: dict, access_token: str, refresh_token: str, clear: bool = False) -> Response:
  """
  Set tokens in cookies and create the HTTP response.
  """
  
  resp = make_response(resp_body, 200)

  if clear:
    unset_access_cookies(resp)
    unset_refresh_cookies(resp)
  else:
    set_access_cookies(resp, access_token, constant.ACCESS_TOKEN_LIFETIME)
    set_refresh_cookies(resp, refresh_token, constant.REFRESH_TOKEN_LIFETIME)

  return resp

def create_auth_blueprint(user_service: UserService) -> Blueprint:
  auth_bp = Blueprint("Auth", __name__, description="Operations on auth")

  @auth_bp.route("/send-otp")
  class SendOTP(MethodView):
    @auth_bp.arguments(schema.SendOTPRequestSchema)
    @auth_bp.response(200, schema.BaseResponseSchema)
    def post(self, req_data: dict):
      email = req_data["email"]
      typ = req_data["typ"]
      
      user_service.send_otp(request.remote_addr, typ, email)
      return make_response_body(200, "", {}), 200

  @auth_bp.route("/register")
  class UserRegister(MethodView):
    @auth_bp.arguments(schema.RegisterRequestSchema)
    @auth_bp.response(200, schema.BaseResponseSchema)
    def post(self, req_data: dict):
      email = req_data["email"]
      password = req_data["password"]
      device_name = req_data["device_name"]
      set_cookie = req_data["set_cookie"]
      otp_code = req_data["otp_code"]
    
      user, access_token, refresh_token = user_service.register(
        email=email, 
        password=password,
        ip=request.remote_addr,
        device_name=device_name,
        otp_code=otp_code
      )
    
      # Serialize user data
      user_schema = schema.UserResponseSchema()
      serialized_user = user_schema.dump(user)

      if not set_cookie:
        resp_data = {
          "user": serialized_user,
          "access_token": access_token,
          "refresh_token": refresh_token
        }
        return make_response_body(201, "", resp_data), 200
      else:
        # Get access token expiry
        exp = get_token_expiry(access_token)

        # Set tokens to cookies
        resp_data = {"user": serialized_user, "access_token_expiry": exp}   
        resp_body = make_response_body(201, "", resp_data)

        return set_tokens_in_cookies(resp_body, access_token, refresh_token)


  @auth_bp.route("/login")
  class UserLogin(MethodView):
    @auth_bp.arguments(schema.LoginRequestSchema)
    @auth_bp.response(200, schema.BaseResponseSchema)
    def post(self, req_data: dict):
      email = req_data["email"]
      password = req_data["password"]
      device_name = req_data["device_name"]
      set_cookie = req_data["set_cookie"]
      
      user, access_token, refresh_token = user_service.login(
        email=email, 
        password=password,
        ip=request.remote_addr,
        device_name=device_name
      )

      # Serialize user data
      user_schema = schema.UserResponseSchema()
      serialized_user = user_schema.dump(user)

      if not set_cookie:
        resp_data = {
          "user": serialized_user,
          "access_token": access_token, 
          "refresh_token": refresh_token
        }
        return make_response_body(200, "", resp_data), 200
      else:
        # Get access token expiry
        exp = get_token_expiry(access_token)

        # Set tokens to cookies
        resp_data = {"user": serialized_user, "access_token_expiry": exp}   
        resp_body = make_response_body(200, "", resp_data)
        return set_tokens_in_cookies(resp_body, access_token, refresh_token)

  @auth_bp.route("/logout")
  class Logout(MethodView):
    @auth_service.jwt_required(optional=True)
    @auth_bp.response(200, schema.BaseResponseSchema)
    def post(self):
      # Extract info from JWT
      token_info = get_info_from_token()
      if token_info is not None:
        user_id, session_id = token_info

        try:
          # Logout session
          user_service.logout(user_id, session_id)
        except Exception as e:
          # Handle exception gracefully
          app_logger.error(f"Failed to logout: {e}")
          pass

      resp_body = make_response_body(200, "", {})
      return set_tokens_in_cookies(resp_body, "", "", True)


  @auth_bp.route("/refresh-token")
  class RefreshToken(MethodView):
    @auth_service.jwt_required(refresh=True)
    @auth_bp.arguments(schema.RefreshTokenRequestSchema)
    @auth_bp.response(200, schema.BaseResponseSchema)
    def post(self, req_data: dict):
      set_cookie = req_data["set_cookie"]

      claims = get_info_from_token()
      if not claims:
        raise common_error.UnauthorizedError("Failed to extract info from token.")

      access_token, refresh_token = user_service.refresh_token(claims.user_id, claims.session_id)

      if not set_cookie:
        resp_data = {
          "access_token": access_token, 
          "refresh_token": refresh_token
        }
        return make_response_body(200, "", resp_data), 200
      else:
        # Get access token expiry
        exp = get_token_expiry(access_token)

        # Set tokens to cookies
        resp_body = make_response_body(200, "", {"access_token_expiry": exp})
        return set_tokens_in_cookies(resp_body, access_token, refresh_token)
    

  @auth_bp.route("/me")
  class GetMyInfo(MethodView):
    @auth_service.jwt_required()
    @auth_bp.response(200, schema.BaseResponseSchema)
    def post(self):
      # Serialize user data
      user_schema = schema.UserResponseSchema()
      serialized_user = user_schema.dump(g.user_info)
      
      resp_data = {"user": serialized_user}
      return make_response_body(200, "", resp_data), 200

  @auth_bp.route("/check-email")
  class CheckEmail(MethodView):
    @auth_bp.arguments(schema.EmailRequestSchema)
    @auth_bp.response(200, schema.BaseResponseSchema)
    def post(self, req_data: dict):
      email = req_data["email"]

      if user_service.check_email_exists(email):
        raise common_error.ResourceConflictError("Email already exists.")

      return make_response_body(200, "", {}), 200


  @auth_bp.route("/send-reset-password-link")
  class SendResetPasswordLink(MethodView):
    @auth_bp.arguments(schema.EmailRequestSchema)
    @auth_bp.response(200, schema.BaseResponseSchema)
    def post(self, req_data: dict):
      email = req_data["email"]
      ip = request.remote_addr

      user_service.send_reset_password_link(ip, email)

      return make_response_body(200, "", {}), 200


  @auth_bp.route("/reset-password")
  class ResetPassword(MethodView):
    @jwt_required()
    @auth_bp.arguments(schema.ResetPasswordRequestSchema)
    @auth_bp.response(200, schema.BaseResponseSchema)
    def post(self, req_data: dict):
      new_password = req_data["password"]
      claims = get_info_from_token()
      if not claims:
        raise common_error.UnauthorizedError("Failed to extract info from token.")

      user_service.reset_password(claims.user_id, claims.session_id, new_password)

      return make_response_body(200, "", {}), 200


  return auth_bp
