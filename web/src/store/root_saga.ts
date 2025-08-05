import { all, call } from "typed-redux-saga";

import { userSagas } from "./user/saga/user.saga.index";
import { otpSagas } from "./otp/otp.saga";
import { forexSagas } from "./forex/forex.saga";

export function* rootSaga() {
  yield* all([call(userSagas), call(otpSagas), call(forexSagas)]);
}
