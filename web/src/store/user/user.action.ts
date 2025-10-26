import {
  Action,
  ActionWithPayload,
  createAction,
  createActionWithPayload,
  withMatcher,
} from "../../common/redux/action";
import { USER_ACTION_TYPES, USER_STATUS_VALUES, UserData } from "./user.types";

// Handle login
export type Login = ActionWithPayload<
  USER_ACTION_TYPES.LOGIN,
  {
    email: string;
    password: string;
    device_name: string;
    is_register: boolean;
    otp: string;
  }
>;
export const login = withMatcher(
  (
    email: string,
    password: string,
    device_name: string,
    is_register: boolean,
    otp: string
  ): Login =>
    createActionWithPayload(USER_ACTION_TYPES.LOGIN, {
      email,
      password,
      device_name,
      is_register,
      otp,
    })
);

// Handle login finished
export type LoginFinished = ActionWithPayload<
  USER_ACTION_TYPES.LOGIN_FINISHED,
  { user: UserData | null; err: string }
>;
export const loginFinished = withMatcher(
  (user: UserData | null, err: string): LoginFinished =>
    createActionWithPayload(USER_ACTION_TYPES.LOGIN_FINISHED, { user, err })
);

// Handle login Cancel
export type LoginCancel = Action<USER_ACTION_TYPES.LOGIN_CANCELED>;
export const loginCancel = withMatcher(
  (): LoginCancel => createAction(USER_ACTION_TYPES.LOGIN_CANCELED)
);

// Handle logout
export type Logout = Action<USER_ACTION_TYPES.LOGOUT>;
export const logout = withMatcher(
  (): Logout => createAction(USER_ACTION_TYPES.LOGOUT)
);

// Handle logout finished
export type LogoutFinished = Action<USER_ACTION_TYPES.LOGOUT_FINISHED>;
export const logoutFinished = withMatcher(
  (): LogoutFinished => createAction(USER_ACTION_TYPES.LOGOUT_FINISHED)
);

// Handle check session
export type CheckSession = Action<USER_ACTION_TYPES.CHECK_SESSION>;
export const checkSession = withMatcher(
  (): CheckSession => createAction(USER_ACTION_TYPES.CHECK_SESSION)
);

//Handle check session finished
export type CheckSessionFinished =
  Action<USER_ACTION_TYPES.CHECK_SESSION_FINISHED>;
export const checkSessionFinished = withMatcher(
  (): CheckSessionFinished =>
    createAction(USER_ACTION_TYPES.CHECK_SESSION_FINISHED)
);

// Handle refresh token
export type RefreshToken = Action<USER_ACTION_TYPES.REFRESH_TOKEN>;
export const refreshToken = withMatcher(
  (): RefreshToken => createAction(USER_ACTION_TYPES.REFRESH_TOKEN)
);

// Handle refresh token finished
export type RefreshTokenFinished = ActionWithPayload<
  USER_ACTION_TYPES.REFRESH_TOKEN_FINISHED,
  { status: USER_STATUS_VALUES }
>;
export const refreshTokenFinished = withMatcher(
  (status: USER_STATUS_VALUES): RefreshTokenFinished =>
    createActionWithPayload(USER_ACTION_TYPES.REFRESH_TOKEN_FINISHED, {
      status,
    })
);

// Handle forgot password
export type ForgotPassword = ActionWithPayload<
  USER_ACTION_TYPES.FORGOT_PASSWORD,
  { email: string }
>;
export const forgotPassword = withMatcher(
  (email: string): ForgotPassword =>
    createActionWithPayload(USER_ACTION_TYPES.FORGOT_PASSWORD, { email })
);

// Handle forgot password finished
export type ForgotPasswordFinished = ActionWithPayload<
  USER_ACTION_TYPES.FORGOT_PASSWORD_FINISHED,
  { err: string; status: USER_STATUS_VALUES }
>;
export const forgotPasswordFinished = withMatcher(
  (err: string, status: USER_STATUS_VALUES): ForgotPasswordFinished =>
    createActionWithPayload(USER_ACTION_TYPES.FORGOT_PASSWORD_FINISHED, {
      err,
      status,
    })
);

// Handle forgot password reset
export type ForgotPasswordReset =
  Action<USER_ACTION_TYPES.FORGOT_PASSWORD_RESET>;
export const forgotPasswordReset = withMatcher(
  (): ForgotPasswordReset =>
    createAction(USER_ACTION_TYPES.FORGOT_PASSWORD_RESET)
);

// Handle reset password
export type ResetPassword = ActionWithPayload<
  USER_ACTION_TYPES.RESET_PASSWORD,
  { password: string; token: string; exp: number }
>;
export const resetPassword = withMatcher(
  (password: string, token: string, exp: number): ResetPassword =>
    createActionWithPayload(USER_ACTION_TYPES.RESET_PASSWORD, {
      password,
      token,
      exp,
    })
);

// Handle reset password finished
export type ResetPasswordFinished = ActionWithPayload<
  USER_ACTION_TYPES.RESET_PASSWORD_FINISHED,
  { err: string }
>;
export const resetPasswordFinished = withMatcher(
  (err: string): ResetPasswordFinished =>
    createActionWithPayload(USER_ACTION_TYPES.RESET_PASSWORD_FINISHED, { err })
);
