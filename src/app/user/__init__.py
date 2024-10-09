from flask_smorest import Blueprint

from src.app.user.http_handler import create_user_blueprint
from src.app.user.repository import UserRepo
from src.app.user.manager import UserService
from src.config import Config
from src.service.ip import IP2LocationServicer
from src.service.redis import RedisServicer
from src.service.sql_alchemy import SQLAlchemyServicer

def init_user_app(config: Config, db_client: SQLAlchemyServicer, redis_client: RedisServicer, 
                    ip_location: IP2LocationServicer) -> Blueprint:
  user_repo = UserRepo(config, db_client, redis_client)
  user_service = UserService(config, user_repo, ip_location)
  
  return create_user_blueprint(user_service)
