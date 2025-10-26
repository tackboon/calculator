import { store } from "../store/store";
import { refreshToken } from "../store/user/user.action";

let interval: ReturnType<typeof setInterval> | null = null;
let timeout: ReturnType<typeof setTimeout> | null = null;

export const startRefreshTokenInterval = () => {
  if (interval || timeout) return;

  // Start the timeout to refresh session in the next minute
  timeout = setTimeout(() => {
    // Dispatch immediately at the start of the next minute
    store.dispatch(refreshToken());

    // Start the regular interval for subsequent refreshes
    interval = setInterval(() => {
      store.dispatch(refreshToken());
    }, 60000);

    // Clear the timeout reference
    timeout = null;
  }, 60000);
};

export const stopRefreshTokenInterval = () => {
  if (timeout) {
    clearTimeout(timeout);
    timeout = null;
    console.log("Refresh token initial timeout cleared.");
  }

  if (interval) {
    clearInterval(interval);
    interval = null;
    console.log("Refresh token interval stopped.");
  }
};
