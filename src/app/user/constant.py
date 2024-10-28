from datetime import timedelta


ACCESS_TOKEN_LIFETIME = timedelta(hours=1)
MAX_LOGIN_ATTEMPTS_COUNT = 20
MAX_SESSION_PER_USER = 5
REFRESH_TOKEN_LIFETIME = timedelta(days=90)
RESET_PASSWORD_TOKEN_LIFETIME = timedelta(minutes=10)
RESET_PASSWORD_SEND_COOLDOWN = timedelta(minutes=1)
