import { call, put, takeLeading } from "typed-redux-saga/macro";
import { api } from "../../../service/openapi";
import { logoutFinished } from "../user.action";
import { deleteAuthCookies } from "../../../common/storage/cookie";
import { CustomError } from "../../../common/error/error";
import { USER_ACTION_TYPES } from "../user.types";
import { BaseResponse } from "../../../openapi";
import { AxiosResponse } from "axios";

function* logout() {
  try {
    // Call server to logout
    const res: AxiosResponse<BaseResponse> = yield call([
      api.AuthAPI,
      api.AuthAPI.appApiV1AuthLogoutPost,
    ]);
    if (res.data.code !== 200) {
      throw new CustomError("Failed to logout", res.data.code || 500);
    }
  } catch (e) {
    if (e instanceof CustomError) {
      console.error("Failed to logout: ", e.statusCode);
    } else {
      console.error("Failed to logout: ", e);
    }
  } finally {
    deleteAuthCookies();
    yield put(logoutFinished());
  }
}

export function* onLogout() {
  yield takeLeading(USER_ACTION_TYPES.LOGOUT, logout);
}
