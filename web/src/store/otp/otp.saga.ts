import { AxiosResponse } from "axios";
import { all, call, put, takeLeading } from "typed-redux-saga";

import { OTP_ACTION_TYPES } from "./otp.types";
import { GetOTP, getOTPFinished } from "./otp.action";
import { BaseResponse, SendOTPRequest } from "../../openapi";
import { api } from "../../service/openapi";
import { CustomError } from "../../common/error/error";
import { setLastGetRegisterOTPTimeToCookie } from "../../common/storage/cookie";

function* getOTP({ payload: { email, typ } }: GetOTP) {
  const req: SendOTPRequest = { email, typ };

  const res: AxiosResponse<BaseResponse> = yield call(
    [api.AuthAPI, api.AuthAPI.appApiV1AuthSendOtpPost],
    req
  );

  switch (res.data.code) {
    case 200:
      return;
    case 409:
      throw new CustomError("This email is already in use.", 409);
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

function* getOTPFlow(action: GetOTP) {
  try {
    yield call(getOTP, action);
    yield call(setLastGetRegisterOTPTimeToCookie);
    yield put(getOTPFinished(""));
  } catch (e) {
    let msg = "Something went wrong, please try again later.";
    if (e instanceof CustomError) {
      msg = e.message;
      console.error("Failed to send reset password link:", e.statusCode);
    } else {
      console.error("Failed to send reset password link:", e);
    }

    yield put(getOTPFinished(msg));
  }
}

function* onGetOTP() {
  yield takeLeading(OTP_ACTION_TYPES.GET_OTP, getOTPFlow);
}

export function* otpSagas() {
  yield all([call(onGetOTP)]);
}
