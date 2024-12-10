import { combineReducers } from "@reduxjs/toolkit";

import { userReducer } from "./user/user.reducer";
import { otpReducer } from "./otp/otp.reducer";

export const rootReducer = combineReducers({
  user: userReducer,
  otp: otpReducer,
});
