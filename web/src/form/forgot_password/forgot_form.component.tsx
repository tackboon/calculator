import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./forgot_form.module.scss";
import { ValidateEmail } from "../../common/validation/auth.validation";
import Button from "../../component/button/button.component";
import Input from "../../component/input/input.component";
import Link from "../../component/link/link.component";
import { getLastForgotPasswordTimeFromCookie } from "../../common/storage/cookie";
import toast from "react-hot-toast";

type FormProps = {
  apiLoading: boolean;
  submitHandler: (email: string) => Promise<null>;
};

const ForgotPasswordForm: FC<FormProps> = ({ submitHandler, apiLoading }) => {
  const navigate = useNavigate();

  // State for form values
  const [email, setEmail] = useState("");

  // State for error messages
  const [errorMessage, setErrorMessage] = useState("");

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage("");
    let errorMsg = "";

    // Validate email
    errorMsg = ValidateEmail(email);
    if (errorMsg !== "") {
      setErrorMessage(errorMsg);
      return;
    }

    toast
      .promise(submitHandler(email), {
        loading: "Sending...",
        success: <b>Reset email sent.</b>,
        error: (err) => <b>Failed to send email. {err}</b>,
      })
      .then(() => {})
      .catch(() => {});
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <form className={styles["form-wrapper"]} onSubmit={handleSubmit}>
      <h1>Forgot your password</h1>
      <p className={styles["description"]}>
        Please enter the email address you'd like your password reset
        information sent to.
      </p>

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

        <p className={styles["error"]}>{errorMessage}</p>
      </div>

      <div className={styles["form-footer"]}>
        <Button
          className={styles["submit-btn"]}
          type="submit"
          disabled={apiLoading}
          checkCooldown={apiLoading}
          cooldownPeriod={60}
          getRemainingCooldown={getLastForgotPasswordTimeFromCookie}
        >
          Request reset link
        </Button>
        <div className={styles["back-to-login"]}>
          <Link onClick={handleBackToLogin}>Back to Login</Link>
        </div>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;
