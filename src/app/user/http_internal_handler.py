import src.app.user.schema as schema

from flask.views import MethodView
from flask_smorest import Blueprint

from src.app.user.manager import UserService
from src.common.response import make_response_body


def create_internal_auth_blueprint(user_service: UserService) -> Blueprint:
  auth_bp = Blueprint("Auth", __name__, description="Operations on auth")

  @auth_bp.route("/block-user")
  class BlockUser(MethodView):
    @auth_bp.arguments(schema.BlockUserRequestSchema)
    @auth_bp.response(200, schema.BaseResponseSchema)
    def post(self, req_data: dict):
      user_id = req_data["user_id"]

      user_service.block_user(user_id)

      return make_response_body(200, "", {}), 200


  @auth_bp.route("/remove-all-sessions")
  class RemoveAllSessions(MethodView):
    @auth_bp.arguments(schema.RemoveAllSessionsRequestSchema)
    @auth_bp.response(200, schema.BaseResponseSchema)
    def post(self, req_data: dict):
      user_id = req_data["user_id"]

      user_service.remove_all_sessions(user_id)

      return make_response_body(200, "", {}), 200

  return auth_bp
