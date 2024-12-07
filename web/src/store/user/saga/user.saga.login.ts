import { AxiosResponse } from "axios";
import {
  call,
  put,
  race,
  take,
  takeLatest,
  takeLeading,
} from "typed-redux-saga/macro";

import { api } from "../../../service/openapi";
import { loginFinished, Login, LoginFinished } from "../user.action";
import { BaseResponse, LoginRequest } from "../../../openapi";
import { setAccessTokenExpiryToCookie } from "../../../common/storage/cookie";
import { CustomError } from "../../../common/error/error";
import { LoginResponse, USER_ACTION_TYPES } from "../user.types";
import { scheduleNextRefreshToken } from "./user.saga.refresh";

function* login({
  payload: { email, password, device_name, is_register },
}: Login) {
  const controller = new AbortController();
  const req: LoginRequest = { email, password, device_name, set_cookie: true };

  try {
    const res: AxiosResponse<BaseResponse> = yield call(
      [
        api.AuthAPI,
        is_register
          ? api.AuthAPI.appApiV1AuthRegisterPost
          : api.AuthAPI.appApiV1AuthLoginPost,
      ],
      req,
      { signal: controller.signal }
    );

    switch (res.data.code) {
      case 200:
      case 201:
        const resData = (res.data?.data as LoginResponse) ?? null;
        if (resData) {
          yield call(setAccessTokenExpiryToCookie, resData.access_token_expiry);
          return resData.user;
        }
        break;
      case 401:
        throw new CustomError("Invalid username or password.", 401);
      case 409:
        throw new CustomError("Username already exists.", 409);
      case 429:
        throw new CustomError(
          "You've made too many requests. Please try again in an hour.",
          429
        );
      default:
        throw new CustomError(
          "Something went wrong, please try again later.",
          res.data.code || 500
        );
    }
  } finally {
    controller.abort();
  }
}

function* loginFlow(action: Login) {
  try {
    const { res } = yield race({
      res: call(login, action),
      cancel: take(USER_ACTION_TYPES.LOGIN_CANCELED),
    });

    yield put(loginFinished(res || null, ""));
  } catch (e) {
    let msg = "Something went wrong, please try again later.";
    if (e instanceof CustomError) {
      msg = e.message;
      console.error("Failed to login:", e.statusCode);
    } else {
      console.error("Failed to login:", e);
    }

    yield put(loginFinished(null, msg));
  }
}

export function* onLoginStart() {
  yield takeLatest(USER_ACTION_TYPES.LOGIN, loginFlow);
}

function* loginSuccess(action: LoginFinished) {
  if (action.payload.user) {
    yield race([
      call(scheduleNextRefreshToken),
      take(USER_ACTION_TYPES.LOGOUT), // Stop scheduling on logout
    ]);
  }
}

export function* onLoginSuccess() {
  yield takeLeading(USER_ACTION_TYPES.LOGIN_FINISHED, loginSuccess);
}
