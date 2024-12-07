import { AxiosResponse } from "axios";
import { call, put, select, takeLeading } from "typed-redux-saga/macro";

import { api } from "../../../service/openapi";
import { loginFinished, checkSessionFinished } from "../user.action";
import { getRefreshTokenStatus } from "./user.saga.promise";
import { selectCurrentUser } from "../user.selector";
import { BaseResponse } from "../../../openapi";
import { CustomError } from "../../../common/error/error";
import {
  LoginResponse,
  USER_ACTION_TYPES,
  USER_STATUS_VALUES,
  UserData,
} from "../user.types";

function* checkSession() {
  // check is session already exists
  const user: UserData | null = yield select(selectCurrentUser);
  if (user) return;

  // check is refresh needed
  const refreshStatus: USER_STATUS_VALUES | null = yield call(
    getRefreshTokenStatus
  );
  if (refreshStatus === USER_STATUS_VALUES.FAILED) return;

  // get user info
  const res: AxiosResponse<BaseResponse, any> = yield call([
    api.AuthAPI,
    api.AuthAPI.appApiV1AuthMePost,
  ]);
  switch (res.data.code) {
    case 200:
      const resData = (res.data?.data as LoginResponse) ?? null;
      if (resData) {
        return resData.user;
      }
      break;
    case 401:
      break;
    default:
      throw new CustomError("Failed to check session", res.data.code || 500);
  }
}

function* checkSessionFlow() {
  try {
    const res: UserData | undefined = yield call(checkSession);
    if (res) {
      yield put(loginFinished(res, ""));
    }
  } catch (e) {
    if (e instanceof CustomError) {
      console.error("Failed to check session:", e.statusCode);
    } else {
      console.error("Failed to check session:", e);
    }
  } finally {
    yield put(checkSessionFinished());
  }
}

export function* onCheckSession() {
  yield takeLeading(USER_ACTION_TYPES.CHECK_SESSION, checkSessionFlow);
}
