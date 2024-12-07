import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./login_form.module.scss";
import Button from "../../component/button/button.component";
import Input from "../../component/input/input.component";
import {
  ValidateEmail,
  ValidatePassword,
} from "../../common/validation/auth.validation";
import Link from "../../component/link/link.component";

type FormProps = {
  apiError: string;
  apiLoading: boolean;
  isRegister?: boolean;
  submitHandler: (email: string, password: string) => void;
};

const LoginForm: FC<FormProps> = ({
  isRegister = false,
  apiError,
  apiLoading,
  submitHandler,
}) => {
  // Setup navigation
  const navigate = useNavigate();

  // Setup button text
  const submitBtnText = isRegister ? "Register" : "Login";
  const switchBtnText = isRegister ? "Login instead" : "Create an account";
  const titleText = isRegister ? "Register" : "Login";

  // State for submit button
  const [isDisabled, setIsDisabled] = useState(false);

  // State for form values
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State for error messages
  const [errorMessage, setErrorMessage] = useState("");

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDisabled(true);

    setErrorMessage("");
    let errorMsg = "";

    try {
      // Validate email
      errorMsg = ValidateEmail(email);
      if (errorMsg !== "") {
        setErrorMessage(errorMsg);
        return;
      }

      // Validate password
      errorMsg = ValidatePassword(password);
      if (errorMsg !== "") {
        setErrorMessage(errorMsg);
        return;
      }

      // Validate confirm password
      if (isRegister && password !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
      }

      // Handle successful form submission
      submitHandler(email, password);
    } finally {
      setIsDisabled(false);
    }
  };

  // Switch button handler
  const handleSwitch = () => {
    if (isRegister) {
      navigate("/login");
    } else {
      navigate("/register");
    }
  };

  // Forgot password handler
  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <form className={styles["form-wrapper"]} onSubmit={handleSubmit}>
      <h1 className={styles["form-title"]}>{titleText}</h1>

      <div>
        <div className={styles["form-group"]}>
          <label htmlFor="email">Email</label>
          <Input
            type="text"
            id="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="password">Password</label>
          <Input
            type="password"
            id="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {isRegister ? (
          <div className={styles["form-group"]}>
            <label htmlFor="confirm-password">Confirm Password</label>
            <Input
              type="password"
              id="confirm-password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        ) : (
          <div className={styles["forgot-password"]}>
            <Link onClick={handleForgotPassword}>Forgot Password?</Link>
          </div>
        )}

        <p className={styles["error"]}>
          {errorMessage === "" ? apiError : errorMessage}
        </p>
      </div>

      <div className={styles["form-footer"]}>
        <Button
          className={styles["switch-btn"]}
          type="button"
          onClick={handleSwitch}
        >
          {switchBtnText}
        </Button>
        <Button
          className={styles["submit-btn"]}
          type="submit"
          disabled={isDisabled || apiLoading}
        >
          {submitBtnText}
        </Button>
      </div>
    </form>
  );
};

export default LoginForm;
