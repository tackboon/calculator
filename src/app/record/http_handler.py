from flask_smorest import Blueprint
from flask.views import MethodView

from src.extensions import auth_service


def create_record_blueprint() -> Blueprint:
  record_bp = Blueprint("Records", __name__, description="Operations on record")

  @record_bp.route("/")
  class Record(MethodView):
    @auth_service.jwt_required()
    def get(self):
      return {"message": "Get records successfully."}, 200
    

  return record_bp
  