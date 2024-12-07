import { UnknownAction } from "redux";

import {
  USER_ERROR_TYPES,
  USER_LOADING_TYPES,
  USER_STATUS_TYPES,
  USER_STATUS_VALUES,
  UserData,
} from "./user.types";
import {
  checkSession,
  checkSessionFinished,
  forgotPassword,
  forgotPasswordFinished,
  forgotPasswordReset,
  login,
  loginCancel,
  loginFinished,
  logoutFinished,
  refreshToken,
  refreshTokenFinished,
  resetPassword,
  resetPasswordFinished,
} from "./user.action";
import { initStateObj } from "../../common/redux/reducer";

export type UserState = {
  readonly currentUser: UserData | null;
  readonly error: { [key: string]: string };
  readonly status: { [key: string]: number };
  readonly isLoading: { [key: string]: boolean };
};

const INITIAL_STATE: UserState = {
  currentUser: null,
  error: initStateObj(USER_ERROR_TYPES, ""),
  status: initStateObj(USER_STATUS_TYPES, USER_STATUS_VALUES.START),
  isLoading: initStateObj(USER_LOADING_TYPES, false),
};

export const userReducer = (
  state = INITIAL_STATE,
  action: UnknownAction
): UserState => {
  // Handle login start
  if (login.match(action)) {
    return {
      ...state,
      isLoading: {
        ...state.isLoading,
        [USER_LOADING_TYPES.LOGIN]: true,
      },
    };
  }

  // Handle login finished
  if (loginFinished.match(action)) {
    return {
      ...state,
      currentUser: action.payload.user,
      error: {
        ...state.error,
        [USER_ERROR_TYPES.LOGIN]: action.payload.err,
      },
      isLoading: {
        ...state.isLoading,
        [USER_LOADING_TYPES.LOGIN]: false,
      },
    };
  }

  // Handle login canceled
  if (loginCancel.match(action)) {
    return {
      ...state,
      error: {
        ...state.error,
        [USER_ERROR_TYPES.LOGIN]: "",
      },
    };
  }

  // Handle logout
  if (logoutFinished.match(action)) {
    return {
      ...state,
      currentUser: null,
    };
  }

  // Handle refresh token
  if (refreshToken.match(action)) {
    return {
      ...state,
      status: {
        ...state.status,
        [USER_STATUS_TYPES.REFRESH_TOKEN]: USER_STATUS_VALUES.START,
      },
    };
  }

  // Handle refresh token finished
  if (refreshTokenFinished.match(action)) {
    return {
      ...state,
      status: {
        ...state.status,
        [USER_STATUS_TYPES.REFRESH_TOKEN]: action.payload.status,
      },
    };
  }

  // Handle check session
  if (checkSession.match(action)) {
    return {
      ...state,
      status: {
        ...state.status,
        [USER_STATUS_TYPES.CHECK_AUTH_SESSION]: USER_STATUS_VALUES.START,
      },
    };
  }

  // Handle check session finished
  if (checkSessionFinished.match(action)) {
    return {
      ...state,
      status: {
        ...state.status,
        [USER_STATUS_TYPES.CHECK_AUTH_SESSION]: USER_STATUS_VALUES.SUCCESS,
      },
    };
  }

  // Handle forgot password start
  if (forgotPassword.match(action)) {
    return {
      ...state,
      isLoading: {
        ...state.isLoading,
        [USER_LOADING_TYPES.FORGOT_PASSWORD]: true,
      },
      status: {
        ...state.status,
        [USER_STATUS_TYPES.FORGOT_PASSWORD]: USER_STATUS_VALUES.START,
      },
    };
  }

  // Handle forgot password finished
  if (forgotPasswordFinished.match(action)) {
    return {
      ...state,
      error: {
        ...state.error,
        [USER_ERROR_TYPES.FORGOT_PASSWORD]: action.payload.err,
      },
      isLoading: {
        ...state.isLoading,
        [USER_LOADING_TYPES.FORGOT_PASSWORD]: false,
      },
      status: {
        ...state.status,
        [USER_STATUS_TYPES.FORGOT_PASSWORD]: action.payload.status,
      },
    };
  }

  // Handle forgot password canceled
  if (forgotPasswordReset.match(action)) {
    return {
      ...state,
      error: {
        ...state.error,
        [USER_ERROR_TYPES.FORGOT_PASSWORD]: "",
      },
    };
  }

  // Handle reset password start
  if (resetPassword.match(action)) {
    return {
      ...state,
      isLoading: {
        ...state.isLoading,
        [USER_LOADING_TYPES.RESET_PASSWORD]: true,
      },
      status: {
        ...state.status,
        [USER_STATUS_TYPES.RESET_PASSWORD]: USER_STATUS_VALUES.START,
      },
    };
  }

  // Handle reset password finished
  if (resetPasswordFinished.match(action)) {
    return {
      ...state,
      error: {
        ...state.error,
        [USER_ERROR_TYPES.RESET_PASSWORD]: action.payload.err,
      },
      isLoading: {
        ...state.isLoading,
        [USER_LOADING_TYPES.RESET_PASSWORD]: false,
      },
      status: {
        ...state.status,
        [USER_STATUS_TYPES.RESET_PASSWORD]:
          action.payload.err === ""
            ? USER_STATUS_VALUES.SUCCESS
            : USER_STATUS_VALUES.FAILED,
      },
    };
  }

  return state;
};
