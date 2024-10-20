import src.app.user.schemas as schemas
import src.common.error as common_error

from flask import request
from flask.views import MethodView
from flask_smorest import Blueprint

from src.app.user.manager import UserService
from src.common.response import make_response
from src.service.auth.token import get_info_from_token
from src.extensions import auth_service


def create_auth_blueprint(user_service: UserService) -> Blueprint:
  auth_bp = Blueprint("Auth", __name__, description="Operations on auth")

  @auth_bp.route("/register")
  class UserRegister(MethodView):
    @auth_bp.arguments(schemas.LoginRequestSchema)
    @auth_bp.response(200, schemas.BaseResponseSchema)
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
      user_schema = schemas.UserResponseSchema()
      serialized_user = user_schema.dump(user)

      resp = {"user": serialized_user, "access_token": access_token, "refresh_token": refresh_token}   
      return make_response(201, "", resp), 200


  @auth_bp.route("/login")
  class UserLogin(MethodView):
    @auth_bp.arguments(schemas.LoginRequestSchema)
    @auth_bp.response(200, schemas.BaseResponseSchema)
    def post(self, req_data: dict):
      email = req_data["email"]
      password = req_data["password"]
      device_id = req_data["device_id"]
      device_name = req_data["device_name"]
      
      user, access_token, refresh_token = user_service.login(
        email=email, 
        password=password,
        ip=request.remote_addr,
        device_id=device_id,
        device_name=device_name
      )

      # Serialize user data
      user_schema = schemas.UserResponseSchema()
      serialized_user = user_schema.dump(user)

      resp = {"user": serialized_user, "access_token": access_token, "refresh_token": refresh_token}   
      return make_response(200, "", resp), 200
    

  @auth_bp.route("/logout")
  class Logout(MethodView):
    @auth_service.jwt_required()
    @auth_bp.response(200, schemas.BaseResponseSchema)
    def post(self):
      # Extract info from JWT
      user_id, session_id = get_info_from_token()

      # # Logout session
      user_service.logout(user_id, session_id)

      return make_response(200, "", {}), 200


  @auth_bp.route("/refresh-token")
  class RefreshToken(MethodView):
    @auth_service.jwt_required(refresh=True)
    @auth_bp.response(200, schemas.BaseResponseSchema)
    def post(self):
      # Extract info from JWT
      user_id, session_id = get_info_from_token()

      access_token, refresh_token = user_service.refresh_token(user_id, session_id)

      resp = {"access_token": access_token, "refresh_token": refresh_token} 
      return make_response(200, "", resp), 200


  @auth_bp.route("/heartbeat")
  class Heartbeat(MethodView):
    @auth_service.jwt_required()
    @auth_bp.response(200, schemas.BaseResponseSchema)
    def post(self):
      ip = request.remote_addr
      user_id, session_id = get_info_from_token()

      user_service.heartbeat(user_id, session_id, ip)

      return make_response(200, "", {}), 200


  @auth_bp.route("/check-email")
  class CheckEmail(MethodView):
    @auth_bp.arguments(schemas.EmailRequestSchema)
    @auth_bp.response(200, schemas.BaseResponseSchema)
    def post(self, req_data: dict):
      email = req_data["email"]

      if user_service.check_email_exists(email):
        raise common_error.ResourceConflictError("Email already exists.")

      return make_response(200, "", {}), 200


  @auth_bp.route("/send-reset-password-link")
  class SendResetPasswordLink(MethodView):
    @auth_bp.arguments(schemas.EmailRequestSchema)
    @auth_bp.response(200, schemas.BaseResponseSchema)
    def post(self, req_data: dict):
      email = req_data["email"]
      ip = request.remote_addr

      user_service.send_reset_password_link(ip, email)

      return make_response(200, "", {}), 200

  return auth_bp
