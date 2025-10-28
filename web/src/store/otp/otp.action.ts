import {
  ActionWithPayload,
  createActionWithPayload,
  withMatcher,
} from "../../common/redux/action";
import { OTP_ACTION_TYPES, OTP_TYP } from "./otp.types";

// Handle get otp
export type GetOTP = ActionWithPayload<
  OTP_ACTION_TYPES.GET_OTP,
  { email: string; typ: OTP_TYP }
>;
export const getOTP = withMatcher(
  (email: string, typ: OTP_TYP): GetOTP =>
    createActionWithPayload(OTP_ACTION_TYPES.GET_OTP, { email, typ })
);

// Handle get otp finished
export type GetOTPFinished = ActionWithPayload<
  OTP_ACTION_TYPES.GET_OTP_FINISHED,
  { err: string }
>;
export const getOTPFinished = withMatcher(
  (err: string): GetOTPFinished =>
    createActionWithPayload(OTP_ACTION_TYPES.GET_OTP_FINISHED, { err })
);
