import styles from "./auth.module.scss";
import Container from "../../component/container/container.component";
import ForgotPasswordForm from "../../form/forgot_password/forgot_form.component";

const ForgotPasswordPage = () => {
  const handleSubmit = (email: string): string => {
    console.log(email);
    return "";
  };

  return (
    <div className={styles["wrapper"]}>
      <Container className={styles["container"]}>
        <ForgotPasswordForm submitHandler={handleSubmit} />
      </Container>
    </div>
  );
};

export default ForgotPasswordPage;
