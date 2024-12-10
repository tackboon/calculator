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

const LoginPage = () => {
  const dispatch = useDispatch();
  const userError = useSelector(selectUserError);
  const userLoading = useSelector(selectUserIsLoading);

  const handleSubmit = (email: string, password: string, otp: string) => {
    dispatch(login(email, password, navigator.userAgent, false, otp));
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
          apiError={userError[USER_ERROR_TYPES.LOGIN]}
          apiLoading={userLoading[USER_LOADING_TYPES.LOGIN]}
          submitHandler={handleSubmit}
        />
      </Container>
    </div>
  );
};

export default LoginPage;
