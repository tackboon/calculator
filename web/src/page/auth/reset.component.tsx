import styles from "./auth.module.scss";
import Container from "../../component/container/container.component";
import ResetPasswordForm from "../../form/reset_password/reset_form.component";

const ResetPasswordPage = () => {
  const handleSubmit = (password: string): string => {
    console.log(password);
    return "";
  };

  return (
    <div className={styles["wrapper"]}>
      <Container className={styles["container"]}>
        <ResetPasswordForm submitHandler={handleSubmit} />
      </Container>
    </div>
  );
};

export default ResetPasswordPage;
