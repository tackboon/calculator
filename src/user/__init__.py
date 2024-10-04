import src.user.schemas as schemas

from flask import request
from flask.views import MethodView
from flask_smorest import Blueprint

from src.common.auth.auth import get_info_from_token, jwt_required
from src.common.response.response import make_response
from src.extensions import config, db, ip_location, redis_client
from src.user.services import UserService
from src.user.storage import UserStorage


# Initialize blueprint for user module
user_bp = Blueprint("Users", __name__, description="Operations on user")

# Initialize user service
user_storage = UserStorage(config, db, redis_client)
user_svc = UserService(config, user_storage, ip_location)

@user_bp.route("/register")
class UserRegister(MethodView):
  @user_bp.arguments(schemas.RegisterRequestSchema)
  @user_bp.response(200, schemas.BaseResponseSchema)
  def post(self, req_data: dict):
    username = req_data["username"]
    password = req_data["password"]
    device_id = req_data["device_id"]
    device_name = req_data["device_name"]
   
    user, access_token, refresh_token = user_svc.register(
      username=username, 
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


@user_bp.route("/login")
class UserLogin(MethodView):
  @user_bp.arguments(schemas.LoginRequestSchema)
  @user_bp.response(200, schemas.BaseResponseSchema)
  def post(self, req_data: dict):
    username = req_data["username"]
    password = req_data["password"]
    device_id = req_data["device_id"]
    device_name = req_data["device_name"]
    
    user, access_token, refresh_token = user_svc.login(
      username=username, 
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
  

@user_bp.route("/logout")
class Logout(MethodView):
  @jwt_required(user_storage)
  @user_bp.response(200, schemas.BaseResponseSchema)
  def post(self):
    # Extract info from JWT
    user_id, session_id = get_info_from_token()

    # Logout session
    user_svc.logout(user_id, session_id)

    return make_response(200, "", {}), 200

@user_bp.route("/refresh-token")
class RefreshToken(MethodView):
  @jwt_required(user_storage, refresh=True)
  @user_bp.response(200, schemas.BaseResponseSchema)
  def post(self):
    # Extract info from JWT
    user_id, session_id = get_info_from_token()

    access_token, refresh_token = user_svc.refresh_token(user_id, session_id)

    resp = {"access_token": access_token, "refresh_token": refresh_token} 
    return make_response(200, "", resp), 200


@user_bp.route("/heartbeat")
class Heartbeat(MethodView):
  @jwt_required(user_storage)
  @user_bp.response(200, schemas.BaseResponseSchema)
  def post(self):
    ip = request.remote_addr
    user_id, session_id = get_info_from_token()

    user_svc.heartbeat(user_id, session_id, ip)

    return make_response(200, "", {}), 200


@user_bp.route("/check-username")
class CheckUsername(MethodView):
  @user_bp.arguments(schemas.UsernameRequestSchema)
  @user_bp.response(200, schemas.BaseResponseSchema)
  def post(self, req_data: dict):
    username = req_data["username"]

    user_svc.check_username_availability(username)

    return make_response(200, "", {}), 200
