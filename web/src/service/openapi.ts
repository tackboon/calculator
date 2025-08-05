import axios from "axios";

import {
  AuthApi,
  BaseResponse,
  Configuration,
  ForexApi,
  JournalsApi,
} from "../openapi";
import { store } from "../store/store";
import { logout } from "../store/user/user.action";
import { getAuthCSRFTokenFromCookie } from "../common/storage/cookie";

const API_HOST = process.env.REACT_APP_API_HOST || "http://localhost";

const customAxios = axios.create({
  baseURL: API_HOST,
  withCredentials: true,
});

// Intercept request for adding csrf token
customAxios.interceptors.request.use(async (config) => {
  const csrfToken = getAuthCSRFTokenFromCookie();
  const method = config.method || "";

  if (["POST", "PUT", "DELETE"].includes(method.toUpperCase())) {
    if (config.url?.endsWith("/app/api/v1/auth/refresh-token")) {
      config.headers["X-CSRF-TOKEN"] = csrfToken.refreshCSRFToken;
    } else if (!config.url?.endsWith("/app/api/v1/auth/reset-password")) {
      config.headers["X-CSRF-TOKEN"] = csrfToken.accessCSRFToken;
    }
  }

  return config;
});

// Intercept response to handle unauthorized
customAxios.interceptors.response.use(
  (res) => {
    const baseResp: BaseResponse = res.data;
    const config = res.config;

    // Check for 401 and ensure it's not an excluded URL
    if (
      baseResp.code === 401 &&
      !["/app/api/v1/auth/login", "/app/api/v1/auth/reset-password"].some(
        (url) => config.url?.endsWith(url)
      )
    ) {
      store.dispatch(logout());
    }
    return res;
  },
  (error) => {
    console.error("Response error intercepted:", error);
    return Promise.reject(error);
  }
);

class OpenAPI {
  AuthAPI: AuthApi;
  JournalAPI: JournalsApi;
  ForexAPI: ForexApi;

  constructor() {
    const conf = new Configuration();

    this.AuthAPI = new AuthApi(conf, API_HOST, customAxios);
    this.JournalAPI = new JournalsApi(conf, API_HOST, customAxios);
    this.ForexAPI = new ForexApi(conf, API_HOST, customAxios);
  }
}

export const api = new OpenAPI();
