import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./reset_form.module.scss";
import { validatePassword } from "../../common/validation/auth.validation";
import Button from "../../component/common/button/button.component";
import Input from "../../component/common/input/input.component";
import toast from "react-hot-toast";

type FormProps = {
  apiError: string;
  apiLoading: boolean;
  email: string;
  submitHandler: (password: string) => Promise<null>;
};

const ResetPasswordForm: FC<FormProps> = ({
  apiError,
  apiLoading,
  email,
  submitHandler,
}) => {
  const navigate = useNavigate();

  // State for submit button
  const [isDisabled, setIsDisabled] = useState(false);

  // State for form values
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

    // Validate password
    errorMsg = validatePassword(password);
    if (errorMsg !== "") {
      setErrorMessage(errorMsg);
      setIsDisabled(false);
      return;
    }

    // Validate confirm password
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setIsDisabled(false);
      return;
    }

    // Handle form submission
    submitHandler(password)
      .then(() => {
        toast.success(<b>Password reset successfully.</b>)
        setIsDisabled(false);
        navigate("/login", { replace: true });
      })
      .catch((e) => {
        setIsDisabled(false);
      });
  };

  return (
    <form className={styles["form-wrapper"]} onSubmit={handleSubmit}>
      <h1 className={styles["form-title"]}>Reset Password</h1>

      <div>
        <div className={styles["form-group"]}>
          <label htmlFor="email">Email</label>
          <Input id="email" value={email} disabled={true} />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="password">Password</label>
          <Input
            type="password"
            id="password"
            placeholder="Enter your new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="confirm-password">Confirm Password</label>
          <Input
            type="password"
            id="confirm-password"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <p className={styles["error"]}>
          {errorMessage === "" ? apiError : errorMessage}
        </p>
      </div>

      <div className={styles["form-footer"]}>
        <Button
          className={styles["submit-btn"]}
          type="submit"
          disabled={isDisabled || apiLoading}
        >
          Reset Password
        </Button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;
