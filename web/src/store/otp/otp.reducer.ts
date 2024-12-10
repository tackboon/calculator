import { UnknownAction } from "redux";

import { initStateObj } from "../../common/redux/reducer";
import {
  OTP_ERROR_TYPES,
  OTP_LOADING_TYPES,
} from "./otp.types";
import { getOTP, getOTPFinished } from "./otp.action";

export type OTPState = {
  readonly error: { [key: string]: string };
  readonly isLoading: { [key: string]: boolean };
};

const INITIAL_STATE: OTPState = {
  error: initStateObj(OTP_ERROR_TYPES, ""),
  isLoading: initStateObj(OTP_LOADING_TYPES, false),
};

export const otpReducer = (
  state = INITIAL_STATE,
  action: UnknownAction
): OTPState => {
  if (getOTP.match(action)) {
    return {
      ...state,
      isLoading: {
        ...state.isLoading,
        [OTP_LOADING_TYPES.GET_OTP]: true,
      },
      error: {
        ...state.error,
        [OTP_ERROR_TYPES.GET_OTP]: "",
      },
    };
  }

  if (getOTPFinished.match(action)) {
    return {
      ...state,
      isLoading: {
        ...state.isLoading,
        [OTP_LOADING_TYPES.GET_OTP]: false,
      },
      error: {
        ...state.error,
        [OTP_ERROR_TYPES.GET_OTP]: action.payload.err,
      },
    };
  }

  return state;
};
