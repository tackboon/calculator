import src.app.user.schemas as schemas

from flask import request
from flask.views import MethodView
from flask_smorest import Blueprint

from src.app.user.manager import UserService
from src.common.response import make_response
from src.service.auth.token import get_info_from_token
from src.extensions import auth_service


def create_internal_user_blueprint(user_service: UserService) -> Blueprint:
  user_bp = Blueprint("Users", __name__, description="Operations on user")

  @user_bp.route("/block-user")
  class BlockUser(MethodView):
    @user_bp.arguments(schemas.BlockUserRequestSchema)
    @user_bp.response(200, schemas.BaseResponseSchema)
    def post(self, req_data: dict):
      user_id = req_data["user_id"]

      user_service.block_user(user_id)

      return make_response(200, "", {}), 200


  @user_bp.route("/remove-all-sessions")
  class RemoveAllSessions(MethodView):
    @user_bp.arguments(schemas.RemoveAllSessionsRequestSchema)
    @user_bp.response(200, schemas.BaseResponseSchema)
    def post(self, req_data: dict):
      user_id = req_data["user_id"]

      user_service.remove_all_sessions(user_id)

      return make_response(200, "", {}), 200

  return user_bp
