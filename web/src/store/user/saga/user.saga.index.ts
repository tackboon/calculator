import { all, call } from "typed-redux-saga/macro";
import { onLoginStart, onLoginSuccess } from "./user.saga.login";
import { onRefreshToken } from "./user.saga.refresh";
import { onCheckSession } from "./user.saga.session";
import { onLogout } from "./user.saga.logout";
import { onForgotPassword } from "./user.saga.forgot";
import { onResetPassword } from "./user.saga.reset";

export function* userSagas() {
  yield all([
    call(onLoginStart),
    call(onLoginSuccess),
    call(onRefreshToken),
    call(onCheckSession),
    call(onLogout),
    call(onForgotPassword),
    call(onResetPassword),
  ]);
}
