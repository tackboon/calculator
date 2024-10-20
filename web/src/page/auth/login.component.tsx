import styles from "./auth.module.scss";
import Container from "../../component/container/container.component";
import LoginForm from "../../form/login/login_form.component";

const LoginPage = () => {
  const handleSubmit = (email: string, password: string): string => {
    console.log(
      "Login successfully with email: " + email + ", password: " + password
    );
    return "";
  };

  return (
    <div className={styles["wrapper"]}>
      <Container className={styles["container"]}>
        <LoginForm submitHandler={handleSubmit} />
      </Container>
    </div>
  );
};

export default LoginPage;
