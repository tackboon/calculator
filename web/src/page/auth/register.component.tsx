import { useDispatch, useSelector } from "react-redux";

import styles from "./auth.module.scss";
import Container from "../../component/container/container.component";
import LoginForm from "../../form/login/login_form.component";
import { login, loginCancel } from "../../store/user/user.action";
import {
  selectUserError,
  selectUserIsLoading,
} from "../../store/user/user.selector";
import {
  USER_ERROR_TYPES,
  USER_LOADING_TYPES,
} from "../../store/user/user.types";
import { useEffect } from "react";
import { callGetOTP } from "../../store/otp/otp.promise";
import { OTP_LOADING_TYPES, OTP_TYP } from "../../store/otp/otp.types";
import { selectOTPIsLoading } from "../../store/otp/otp.selector";

const RegisterPage = () => {
  const dispatch = useDispatch();
  const userError = useSelector(selectUserError);
  const userLoading = useSelector(selectUserIsLoading);
  const otpLoading = useSelector(selectOTPIsLoading);

  const handleSubmit = (email: string, password: string, otp: string) => {
    dispatch(login(email, password, navigator.userAgent, true, otp));
  };

  const handleOTP = async (email: string) => {
    return callGetOTP(email, OTP_TYP.REGISTRATION);
  };

  useEffect(() => {
    return () => {
      dispatch(loginCancel());
    };
  }, [dispatch]);

  return (
    <div className={styles["wrapper"]}>
      <Container className={styles["container"]}>
        <LoginForm
          isRegister
          apiError={userError[USER_ERROR_TYPES.LOGIN]}
          apiLoading={userLoading[USER_LOADING_TYPES.LOGIN]}
          otpLoading={otpLoading[OTP_LOADING_TYPES.GET_OTP]}
          submitHandler={handleSubmit}
          otpHandler={handleOTP}
        />
      </Container>
    </div>
  );
};

export default RegisterPage;
