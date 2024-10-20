import styles from "./auth.module.scss";
import Container from "../../component/container/container.component";
import LoginForm from "../../form/login/login_form.component";

const RegisterPage = () => {
  const handleSubmit = (email: string, password: string): string => {
    console.log(
      "Register successfully with email: " + email + ", password: " + password
    );
    return "";
  };

  return (
    <div className={styles["wrapper"]}>
      <Container className={styles["container"]}>
        <LoginForm isRegister submitHandler={handleSubmit} />
      </Container>
    </div>
  );
};

export default RegisterPage;
