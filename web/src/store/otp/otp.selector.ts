import { createSelector } from "@reduxjs/toolkit";

import { RootState } from "../store";
import { OTPState } from "./otp.reducer";

export const selectOTPReducer = (state: RootState): OTPState => state.otp;

export const selectOTPError = createSelector(
  selectOTPReducer,
  (otp) => otp.error
);

export const selectOTPIsLoading = createSelector(
  selectOTPReducer,
  (otp) => otp.isLoading
);
