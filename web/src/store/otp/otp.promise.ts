import { store } from "../store";
import { getOTP } from "./otp.action";
import { OTP_ERROR_TYPES, OTP_LOADING_TYPES, OTP_TYP } from "./otp.types";

export const callGetOTP = (email: string, typ: OTP_TYP): Promise<null> =>
  new Promise((resolve, reject) => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      const { isLoading, error } = state.otp;

      if (
        !isLoading[OTP_LOADING_TYPES.GET_OTP] &&
        error[OTP_ERROR_TYPES.GET_OTP] === ""
      ) {
        unsubscribe(); // Stop listening to store updates
        resolve(null);
      } else if (
        !isLoading[OTP_LOADING_TYPES.GET_OTP] &&
        error[OTP_ERROR_TYPES.GET_OTP] !== ""
      ) {
        unsubscribe(); // Stop listening to store updates
        reject(error[OTP_ERROR_TYPES.GET_OTP]);
      }
    });

    // Dispatch forgot password
    store.dispatch(getOTP(email, typ));
  });
