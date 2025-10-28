import { LoaderFunctionArgs, redirect } from "react-router-dom";
import { getCurrentUserFromSession } from "../store/user/saga/user.saga.promise";
import { jwtDecode, JwtPayload } from "jwt-decode";

export const sessionLoader = async (isProtected: boolean) => {
  const currentUser = await getCurrentUserFromSession();
  if (isProtected && !currentUser) {
    // Redirect if not authenticated
    return redirect("/login");
  }

  return null;
};

type ResetPasswordJWTPayload = {
  email?: string;
} & JwtPayload;

export const resetPasswordLoader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    // Redirect if token not exists
    return redirect("/login");
  }

  try {
    const { exp, email }: ResetPasswordJWTPayload = jwtDecode(token);
    if (!exp || !email || email === "") {
      // Redirect if invalid token claims
      return redirect("/login");
    }

    await sessionLoader(false);

    return { email, exp, token };
  } catch (e) {
    // Redirect if failed to extract token
    return redirect("/login");
  }
};
