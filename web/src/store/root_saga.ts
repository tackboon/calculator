import { all, call } from "typed-redux-saga";

import { userSagas } from "./user/saga/user.saga.index";

export function* rootSaga() {
  yield* all([call(userSagas)]);
}
