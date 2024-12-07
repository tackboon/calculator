from flask_smorest import Blueprint
from flask.views import MethodView

from src.extensions import auth_service


def create_journal_blueprint() -> Blueprint:
  journal_bp = Blueprint("Journals", __name__, description="Operations on journal")

  @journal_bp.route("/")
  class Journal(MethodView):
    @auth_service.jwt_required()
    def get(self):
      return {"message": "Get journal successfully."}, 200
    

  return journal_bp
  