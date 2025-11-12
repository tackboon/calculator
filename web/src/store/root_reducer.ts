import { combineReducers } from "@reduxjs/toolkit";

import { userReducer } from "./user/user.reducer";
import { otpReducer } from "./otp/otp.reducer";
import { forexReducer } from "./forex/forex.reducer";

export const rootReducer = combineReducers({
  user: userReducer,
  otp: otpReducer,
  forex: forexReducer,
});
