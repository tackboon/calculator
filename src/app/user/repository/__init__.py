from typing import Optional

from src.app.user.repository.user import UserRepo
from src.app.user.repository.session import SessionRepo
from src.service.auth import JWTRepo, SessionData, UserInfo
from src.service.redis import RedisServicer
from src.service.sql_alchemy import SQLAlchemyServicer


class Repository(JWTRepo):
  def __init__(self, db: SQLAlchemyServicer, rdb: RedisServicer):
    self.user = UserRepo(db, rdb)
    self.session = SessionRepo(db, rdb)

  def get_user_for_jwt(self, user_id: int) -> Optional[UserInfo]:
    return self.user.get_user_for_jwt(user_id)
  
  def get_session_for_jwt(self, user_id, session_id) -> Optional[SessionData]:
    return self.session.get_session_for_jwt(user_id, session_id)
  