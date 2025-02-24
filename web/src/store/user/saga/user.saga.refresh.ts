import { AxiosResponse } from "axios";
import {
  call,
  put,
  race,
  takeLeading,
  delay,
  take,
} from "typed-redux-saga/macro";
import { api } from "../../../service/openapi";
import {
  refreshTokenFinished,
  refreshToken as refreshTokenStart,
} from "../user.action";
import { BaseResponse, RefreshTokenRequest } from "../../../openapi";
import {
  getAccessTokenExpiryFromCookie,
  getAuthCSRFTokenFromCookie,
  setAccessTokenExpiryToCookie,
} from "../../../common/storage/cookie";
import { CustomError } from "../../../common/error/error";
import {
  RefreshTokenResponse,
  USER_ACTION_TYPES,
  USER_STATUS_VALUES,
} from "../user.types";

function* checkIsSessionExpiring() {
  const expiry: string | null = yield call(getAccessTokenExpiryFromCookie);
  return !expiry || Number(expiry) - Date.now() / 1000 - 300 < 0; // 5 min before expiry
}

export function* refreshToken() {
  // Check is csrf refresh token exists
  const authCSRFToken = getAuthCSRFTokenFromCookie();
  if (!authCSRFToken.refreshCSRFToken) return USER_STATUS_VALUES.FAILED;

  // Check is session expiring
  const isSessionExpiring: boolean = yield call(checkIsSessionExpiring);
  if (!isSessionExpiring && authCSRFToken.accessCSRFToken !== "")
    return USER_STATUS_VALUES.SUCCESS;

  const controller = new AbortController();
  try {
    const req: RefreshTokenRequest = { set_cookie: true };
    const res: AxiosResponse<BaseResponse> = yield call(
      [api.AuthAPI, api.AuthAPI.appApiV1AuthRefreshTokenPost],
      req,
      { signal: controller.signal }
    );

    if (res.data.code === 200) {
      const resData = (res.data?.data as RefreshTokenResponse) ?? null;
      if (resData) {
        yield call(setAccessTokenExpiryToCookie, resData.access_token_expiry);
        return USER_STATUS_VALUES.SUCCESS;
      }
    } else {
      throw new CustomError("Failed to refresh token", res.data.code || 500);
    }

    return USER_STATUS_VALUES.FAILED;
  } finally {
    controller.abort();
  }
}

function* refreshTokenFlow() {
  try {
    const { res }: { res: USER_STATUS_VALUES } = yield race({
      res: call(refreshToken),
      cancel: take(USER_ACTION_TYPES.LOGOUT),
    });

    yield put(refreshTokenFinished(res));
  } catch (e) {
    if (e instanceof CustomError) {
      console.error("Failed to refresh token:", e.statusCode);
    } else {
      console.error("Failed to refresh token:", e);
    }

    yield put(refreshTokenFinished(USER_STATUS_VALUES.FAILED));
  }
}

export function* onRefreshToken() {
  yield takeLeading(USER_ACTION_TYPES.REFRESH_TOKEN, refreshTokenFlow);
}

export function* scheduleNextRefreshToken() {
  while (true) {
    yield delay(60000); // Check for refresh token every 1 minute
    yield put(refreshTokenStart());
  }
}
