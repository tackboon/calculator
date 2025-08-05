import { FC, ReactNode } from "react";
import { useSelector } from "react-redux";

import { selectCurrentUser } from "../store/user/user.selector";
import { Navigate } from "react-router-dom";

interface GuardProps {
  children: ReactNode;
}

export const RequiredAuthRoute: FC<GuardProps> = ({ children }) => {
  const currentUser = useSelector(selectCurrentUser);
  return currentUser ? <>{children}</> : <Navigate to="/login" />;
};

export const RequiredGuestRoute: FC<GuardProps> = ({ children }) => {
  const currentUser = useSelector(selectCurrentUser);
  return currentUser ? <Navigate to="/calculator" /> : <>{children}</>;
};
