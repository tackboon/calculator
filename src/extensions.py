import os

from src.common.logger import BasicJSONFormatter, create_logger
from src.config import config
from src.service.auth import AuthServicer
from src.service.email import SendEmailService
from src.service.ip import IP2LocationServicer
from src.service.redis import RedisServicer
from src.service.sql_alchemy import SQLAlchemyServicer


# Initialize logger
app_logger = create_logger(
  "app",
  config.log_level, 
  os.path.join(config.log_base_dir, os.path.basename("app.log")) if config.log_base_dir != "" else "", 
  BasicJSONFormatter(datefmt="%Y-%m-%d %H:%M:%S")
)

# Create services
auth_service = AuthServicer()
db_service = SQLAlchemyServicer()
email_service = SendEmailService(
  os.path.join(config.log_base_dir, os.path.basename("email.log")) if config.log_base_dir != "" else "",
  config.reset_password_link, 
  config.send_grid_token, 
  config.sender_email
)
ip_service = IP2LocationServicer("IP2LOCATION-LITE-DB11.BIN", "IP2LOCATION-LITE-DB11.IPV6.BIN")
redis_service = RedisServicer()
