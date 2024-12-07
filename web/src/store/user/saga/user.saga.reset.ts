import { call, put, takeLeading } from "typed-redux-saga";
import { USER_ACTION_TYPES } from "../user.types";
import { logout, ResetPassword, resetPasswordFinished } from "../user.action";
import { BaseResponse, ResetPasswordRequest } from "../../../openapi";
import { AxiosResponse } from "axios";
import { api } from "../../../service/openapi";
import { CustomError } from "../../../common/error/error";

function* resetPassword({ payload: { password, token, exp } }: ResetPassword) {
  if (exp <= Date.now() / 1000) {
    throw new CustomError(
      "The reset password link is invalid or has expired.",
      401
    );
  }

  const req: ResetPasswordRequest = { new_password: password };
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const res: AxiosResponse<BaseResponse> = yield call(
    [api.AuthAPI, api.AuthAPI.appApiV1AuthResetPasswordPost],
    req,
    { headers }
  );

  switch (res.data.code) {
    case 200:
      return;
    case 401:
      throw new CustomError(
        "The reset password link is invalid or has expired.",
        401
      );
    default:
      throw new CustomError(
        "Something went wrong, please try again later.",
        res.data.code || 500
      );
  }
}

function* resetPasswordFlow(action: ResetPassword) {
  try {
    yield call(resetPassword, action);
    yield put(logout());
    yield put(resetPasswordFinished(""));
  } catch (e) {
    let msg = "Something went wrong, please try again later.";
    if (e instanceof CustomError) {
      msg = e.message;
      console.error("Failed to send reset password link:", e.statusCode);
    } else {
      console.error("Failed to send reset password link:", e);
    }

    yield put(resetPasswordFinished(msg));
  }
}

export function* onResetPassword() {
  yield takeLeading(USER_ACTION_TYPES.RESET_PASSWORD, resetPasswordFlow);
}
