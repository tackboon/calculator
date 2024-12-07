import styles from "./auth.module.scss";
import Container from "../../component/container/container.component";
import ResetPasswordForm from "../../form/reset_password/reset_form.component";
import { useLoaderData, useNavigate } from "react-router-dom";
import { resetPasswordLoader } from "../../router/loader";
import { useSelector } from "react-redux";
import {
  selectUserError,
  selectUserIsLoading,
} from "../../store/user/user.selector";
import {
  USER_ERROR_TYPES,
  USER_LOADING_TYPES,
  USER_STATUS_VALUES,
} from "../../store/user/user.types";
import { callResetPassword } from "../../store/user/saga/user.saga.promise";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const userError = useSelector(selectUserError);
  const userLoading = useSelector(selectUserIsLoading);
  const params = useLoaderData() as Awaited<
    ReturnType<typeof resetPasswordLoader>
  >;

  let email = "";
  if (!(params instanceof Response)) {
    email = params.email;
  }

  const handleSubmit = async (password: string) => {
    if (!(params instanceof Response)) {
      const status = await callResetPassword(
        password,
        params.token,
        params.exp,
      );
      if (status === USER_STATUS_VALUES.SUCCESS) {
        navigate("/login", { replace: true });
      }
    }
  };

  return (
    <div className={styles["wrapper"]}>
      <Container className={styles["container"]}>
        <ResetPasswordForm
          email={email}
          apiError={userError[USER_ERROR_TYPES.RESET_PASSWORD]}
          apiLoading={userLoading[USER_LOADING_TYPES.RESET_PASSWORD]}
          submitHandler={handleSubmit}
        />
      </Container>
    </div>
  );
};

export default ResetPasswordPage;
