import { store } from "../../store";
import {
  checkSession,
  forgotPassword,
  refreshToken,
  resetPassword,
} from "../user.action";
import {
  USER_ERROR_TYPES,
  USER_LOADING_TYPES,
  USER_STATUS_TYPES,
  USER_STATUS_VALUES,
  UserData,
} from "../user.types";

export const getCurrentUserFromSession = (): Promise<UserData | null> =>
  new Promise((resolve) => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      const { currentUser, isLoading } = state.user;

      if (!isLoading[USER_LOADING_TYPES.CHECK_AUTH_SESSION]) {
        // Stop listening to store updates
        unsubscribe();
        resolve(currentUser);
      }
    });

    // Dispatch check session
    store.dispatch(checkSession());
  });

export const getRefreshTokenStatus = (): Promise<USER_STATUS_VALUES> =>
  new Promise((resolve) => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      const { status } = state.user;

      if (
        status[USER_STATUS_TYPES.REFRESH_TOKEN] !== USER_STATUS_VALUES.START
      ) {
        // Stop listening to store updates
        unsubscribe();
        resolve(status[USER_STATUS_TYPES.REFRESH_TOKEN]);
      }
    });

    // Dispatch check session
    store.dispatch(refreshToken());
  });

export const sendResetPasswordLink = (email: string): Promise<null> =>
  new Promise((resolve, reject) => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      const { isLoading, error } = state.user;

      if (
        !isLoading[USER_LOADING_TYPES.FORGOT_PASSWORD] &&
        error[USER_ERROR_TYPES.FORGOT_PASSWORD] === ""
      ) {
        unsubscribe(); // Stop listening to store updates
        resolve(null);
      } else if (
        !isLoading[USER_LOADING_TYPES.FORGOT_PASSWORD] &&
        error[USER_ERROR_TYPES.FORGOT_PASSWORD] !== ""
      ) {
        unsubscribe(); // Stop listening to store updates
        reject(error[USER_ERROR_TYPES.FORGOT_PASSWORD]);
      }
    });

    // Dispatch forgot password
    store.dispatch(forgotPassword(email));
  });

export const callResetPassword = (
  password: string,
  token: string,
  exp: number
): Promise<null> =>
  new Promise((resolve, reject) => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      const { isLoading, error } = state.user;

      if (
        !isLoading[USER_LOADING_TYPES.RESET_PASSWORD] &&
        error[USER_ERROR_TYPES.RESET_PASSWORD] === ""
      ) {
        unsubscribe(); // Stop listening to store updates
        resolve(null);
      } else if (
        !isLoading[USER_LOADING_TYPES.RESET_PASSWORD] &&
        error[USER_ERROR_TYPES.RESET_PASSWORD] !== ""
      ) {
        unsubscribe(); // Stop listening to store updates
        reject(error[USER_ERROR_TYPES.RESET_PASSWORD]);
      }
    });

    // Dispatch forgot password
    store.dispatch(resetPassword(password, token, exp));
  });
