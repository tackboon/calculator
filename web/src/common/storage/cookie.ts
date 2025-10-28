import Cookies from "js-cookie";
import { aesDecrypt, aesEncrypt } from "../crypto/aes";

type CSRFResponse = {
  accessCSRFToken: string;
  refreshCSRFToken: string;
};
export const getAuthCSRFTokenFromCookie = (): CSRFResponse => {
  const accessCSRFToken = Cookies.get("csrf_access_token") || "";
  const refreshCSRFToken = Cookies.get("csrf_refresh_token") || "";

  return { accessCSRFToken, refreshCSRFToken };
};

export const deleteAuthCookies = () => {
  Cookies.remove("csrf_access_token");
  Cookies.remove("csrf_refresh_token");
  Cookies.remove("ygYUDINDNx");
};

export const getAccessTokenExpiryFromCookie = async (): Promise<
  string | null
> => {
  const aesKey = process.env.REACT_APP_AES_KEY || "";
  const val = Cookies.get("ygYUDINDNx");
  if (val === undefined) {
    return null;
  }

  return await aesDecrypt(aesKey, val);
};

export const setAccessTokenExpiryToCookie = async (expiry: number) => {
  const aesKey = process.env.REACT_APP_AES_KEY || "";
  const encVal = await aesEncrypt(aesKey, String(expiry));
  Cookies.set("ygYUDINDNx", encVal, { expires: new Date(expiry * 1000) });
};

export const getLastForgotPasswordTimeFromCookie = async (): Promise<
  string | null
> => {
  const aesKey = process.env.REACT_APP_AES_KEY || "";
  const val = Cookies.get("jTrl0cx7nT");
  if (val === undefined) {
    return null;
  }

  return await aesDecrypt(aesKey, val);
};

export const setLastForgotPassowrdTimeToCookie = async () => {
  const currentTime = Date.now();
  const aesKey = process.env.REACT_APP_AES_KEY || "";
  const encVal = await aesEncrypt(aesKey, currentTime.toString());

  Cookies.set("jTrl0cx7nT", encVal, { expires: 1 / (24 * 60) });
};

export const getLastGetRegisterOTPTimeFromCookie = async (): Promise<
  string | null
> => {
  const aesKey = process.env.REACT_APP_AES_KEY || "";
  const val = Cookies.get("3e8SN1Qsew");
  if (val === undefined) {
    return null;
  }

  return await aesDecrypt(aesKey, val);
};

export const setLastGetRegisterOTPTimeToCookie = async () => {
  const currentTime = Date.now();
  const aesKey = process.env.REACT_APP_AES_KEY || "";
  const encVal = await aesEncrypt(aesKey, currentTime.toString());

  Cookies.set("3e8SN1Qsew", encVal, { expires: 1 / (24 * 60) });
};