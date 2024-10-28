import src.app.user.schema as schema
import src.common.error as common_error

from datetime import datetime
from flask import make_response, request
from flask.views import MethodView
from flask_jwt_extended import jwt_required
from flask_smorest import Blueprint

from src.app.user.manager import UserService
from src.common.response import make_response_body
from src.service.auth.token import get_info_from_token
from src.extensions import auth_service


def create_auth_blueprint(user_service: UserService) -> Blueprint:
  auth_bp = Blueprint("Auth", __name__, description="Operations on auth")

  @auth_bp.route("/register")
  class UserRegister(MethodView):
    @auth_bp.arguments(schema.LoginRequestSchema)
    @auth_bp.response(200, schema.BaseResponseSchema)
    def post(self, req_data: dict):
      email = req_data["email"]
      password = req_data["password"]
      device_id = req_data["device_id"]
      device_name = req_data["device_name"]
    
      user, access_token, refresh_token = user_service.register(
        email=email, 
        password=password,
        ip=request.remote_addr,
        device_id=device_id,
        device_name=device_name
      )

      # Serialize user data
      user_schema = schema.UserResponseSchema()
      serialized_user = user_schema.dump(user)

      resp_data = {"user": serialized_user, "access_token": access_token, "refresh_token": refresh_token}   
      return make_response_body(201, "", resp_data), 200


  @auth_bp.route("/login")
  class UserLogin(MethodView):
    @auth_bp.arguments(schema.LoginRequestSchema)
    @auth_bp.response(200, schema.BaseResponseSchema)
    def post(self, req_data: dict):
      email = req_data["email"]
      password = req_data["password"]
      device_id = req_data["device_id"]
      device_name = req_data["device_name"]
      set_cookie = req_data["set_cookie"]
      
      user, access_token, refresh_token = user_service.login(
        email=email, 
        password=password,
        ip=request.remote_addr,
        device_id=device_id,
        device_name=device_name
      )

      # Serialize user data
      user_schema = schema.UserResponseSchema()
      serialized_user = user_schema.dump(user)

      if not set_cookie:
        resp_data = {"user": serialized_user, "access_token": access_token, "refresh_token": refresh_token}
        return make_response_body(200, "", resp_data), 200
      else:
        # Set tokens to cookies
        resp_data = {"user": serialized_user}   
        resp_body = make_response_body(200, "", resp_data)

        resp = make_response(resp_body, 200)
        resp.set_cookie("access_token", access_token, httponly=True, secure=True, samesite="Lax")
        resp.set_cookie("refresh_token", refresh_token, httponly=True, secure=True, samesite="Lax",
          path="/app/api/v1/auth/refresh-token")
        return resp

  @auth_bp.route("/logout")
  class Logout(MethodView):
    @auth_service.jwt_required()
    @auth_bp.response(200, schema.BaseResponseSchema)
    def post(self):
      # Extract info from JWT
      user_id, session_id = get_info_from_token()

      # Logout session
      user_service.logout(user_id, session_id)

      return make_response_body(200, "", {}), 200


  @auth_bp.route("/refresh-token")
  class RefreshToken(MethodView):
    @auth_service.jwt_required(refresh=True)
    @auth_bp.arguments(schema.RefreshTokenRequestSchema)
    @auth_bp.response(200, schema.BaseResponseSchema)
    def post(self, req_data: dict):
      set_cookie = req_data["set_cookie"]

      user_id, session_id = get_info_from_token()
      access_token, refresh_token = user_service.refresh_token(user_id, session_id)

      if not set_cookie:
        resp_data = {"access_token": access_token, "refresh_token": refresh_token}
        return make_response_body(200, "", resp_data), 200
      else:
        # Set tokens to cookies
        resp_body = make_response_body(200, "", {})

        resp = make_response(resp_body, 200)
        resp.set_cookie("access_token", access_token, httponly=True, secure=True, samesite="Lax")
        resp.set_cookie("refresh_token", refresh_token, httponly=True, secure=True, samesite="Lax",
          path="/app/api/v1/auth/refresh-token")
        return resp
    

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
      new_password = req_data["new_password"]
      claims = get_info_from_token()

      user_service.reset_password(claims.user_id, claims.session_id, new_password)

      return make_response_body(200, "", {}), 200


  return auth_bp
