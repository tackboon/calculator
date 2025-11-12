import { call, put, takeLatest } from "typed-redux-saga";
import { USER_ACTION_TYPES, USER_STATUS_VALUES } from "../user.types";
import { AxiosResponse } from "axios";
import { BaseResponse, EmailRequest } from "../../../openapi";
import { api } from "../../../service/openapi";
import { ForgotPassword, forgotPasswordFinished } from "../user.action";
import { CustomError } from "../../../common/error/error";
import { setLastForgotPassowrdTimeToCookie } from "../../../common/storage/cookie";

function* forgotPassword({ payload: { email } }: ForgotPassword) {
  const req: EmailRequest = { email };

  const res: AxiosResponse<BaseResponse> = yield call(
    [api.AuthAPI, api.AuthAPI.appApiV1AuthSendResetPasswordLinkPost],
    req
  );

  switch (res.data.code) {
    case 200:
      return;
    case 404:
      throw new CustomError("Email not found.", 404);
    case 429:
      throw new CustomError(
        "You've made too many requests. Please try again later.",
        429
      );
    default:
      throw new CustomError(
        "Something went wrong, please try again later.",
        res.data.code || 500
      );
  }
}

function* forgotPasswordFlow(action: ForgotPassword) {
  try {
    yield call(forgotPassword, action);
    yield call(setLastForgotPassowrdTimeToCookie);
    yield put(forgotPasswordFinished("", USER_STATUS_VALUES.SUCCESS));
  } catch (e) {
    let msg = "Something went wrong, please try again later.";
    if (e instanceof CustomError) {
      msg = e.message;
      console.error("Failed to send reset password link:", e.statusCode);
    } else {
      console.error("Failed to send reset password link:", e);
    }

    yield put(forgotPasswordFinished(msg, USER_STATUS_VALUES.FAILED));
  }
}

export function* onForgotPassword() {
  yield takeLatest(USER_ACTION_TYPES.FORGOT_PASSWORD, forgotPasswordFlow);
}
