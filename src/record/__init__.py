from flask_smorest import Blueprint
from flask.views import MethodView

from src.common.auth.auth import jwt_required
from src.extensions import config, db, redis_client
from src.user.storage import UserStorage


# Initialize blueprint for record module
record_bp = Blueprint("Records", __name__, description="Operations on record")

user_storage = UserStorage(config, db, redis_client)

@record_bp.route("/")
class Record(MethodView):
  @jwt_required(user_storage)
  def get(self):
    return {"message": "Get records successfully."}, 200
  