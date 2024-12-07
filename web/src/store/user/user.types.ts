export enum USER_ACTION_TYPES {
  CHECK_SESSION = "user/check_session",
  CHECK_SESSION_FINISHED = "user/check_session_finished",
  FORGOT_PASSWORD = "user/forgot_password",
  FORGOT_PASSWORD_RESET = "user/forgot_password_reset",
  FORGOT_PASSWORD_FINISHED = "user/forgot_password_finished",
  LOGIN = "user/login",
  LOGIN_CANCELED = "user/login_canceled",
  LOGIN_FINISHED = "user/login_finished",
  LOGOUT = "user/logout",
  LOGOUT_FINISHED = "user/logout_finished",
  REFRESH_TOKEN = "user/refresh_token",
  REFRESH_TOKEN_FINISHED = "user/refresh_token_finished",
  RESET_PASSWORD = "user/reset_password",
  RESET_PASSWORD_FINISHED = "user/reset_password_finished",
}

export enum USER_LOADING_TYPES {
  LOGIN = "loading/login",
  CHECK_AUTH_SESSION = "loading/check_auth_session",
  FORGOT_PASSWORD = "loading/forgot_password",
  RESET_PASSWORD = "loading/reset_password",
}

export enum USER_ERROR_TYPES {
  LOGIN = "error/login",
  FORGOT_PASSWORD = "error/forgot_password",
  RESET_PASSWORD = "error/reset_password",
}

export enum USER_STATUS_TYPES {
  CHECK_AUTH_SESSION = "status/check_auth_session",
  FORGOT_PASSWORD = "status/forgot_password",
  REFRESH_TOKEN = "status/refresh_token",
  RESET_PASSWORD = "status/reset_password",
}

export enum USER_STATUS_VALUES {
  START,
  SUCCESS,
  FAILED,
}

export type UserData = {
  id: number;
  email: string;
  role: number;
};

export type LoginResponse = {
  user: UserData;
  access_token_expiry: number;
};

export type RefreshTokenResponse = {
  access_token_expiry: number;
};
