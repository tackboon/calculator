import styles from "./auth.module.scss";
import Container from "../../component/container/container.component";
import ForgotPasswordForm from "../../form/forgot_password/forgot_form.component";
import { useDispatch, useSelector } from "react-redux";
import {
  selectUserError,
  selectUserIsLoading,
} from "../../store/user/user.selector";
import { forgotPasswordReset } from "../../store/user/user.action";
import {
  USER_ERROR_TYPES,
  USER_LOADING_TYPES,
} from "../../store/user/user.types";
import { useEffect } from "react";
import { sendResetPasswordLink } from "../../store/user/saga/user.saga.promise";

const ForgotPasswordPage = () => {
  const dispatch = useDispatch();
  const userLoading = useSelector(selectUserIsLoading);

  const handleSubmit = (email: string): Promise<null> => {
    return sendResetPasswordLink(email);
  };

  useEffect(() => {
    dispatch(forgotPasswordReset());
  }, [dispatch]);

  return (
    <div className={styles["wrapper"]}>
      <Container className={styles["container"]}>
        <ForgotPasswordForm
          apiLoading={userLoading[USER_LOADING_TYPES.FORGOT_PASSWORD]}
          submitHandler={handleSubmit}
        />
      </Container>
    </div>
  );
};

export default ForgotPasswordPage;
