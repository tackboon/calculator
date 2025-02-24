import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./login_form.module.scss";
import Button from "../../component/common/button/button.component";
import Input from "../../component/common/input/input.component";
import {
  validateEmail,
  validateOTP,
  validatePassword,
} from "../../common/validation/auth.validation";
import Link from "../../component/common/link/link.component";
import toast from "react-hot-toast";
import { getLastGetRegisterOTPTimeFromCookie } from "../../common/storage/cookie";
import Checkbox from "../../component/common/checkbox/checkbox.component";

type FormProps = {
  apiError: string;
  apiLoading?: boolean;
  otpLoading?: boolean;
  isRegister?: boolean;
  submitHandler: (email: string, password: string, otp: string) => void;
  otpHandler?: (email: string) => Promise<null>;
};

const LoginForm: FC<FormProps> = ({
  isRegister = false,
  apiError,
  apiLoading,
  otpLoading,
  submitHandler,
  otpHandler,
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
  const [otp, setOTP] = useState("");

  // State for error messages
  const [errorMessage, setErrorMessage] = useState("");

  // Send OTP handler
  const handleSendOTP = () => {
    if (otpHandler) {
      const errorMsg = validateEmail(email);
      if (errorMsg !== "") {
        toast.error(<b>Failed to send email. Invalid email address.</b>);
        return;
      }

      toast
        .promise(otpHandler(email), {
          loading: "Sending...",
          success: <b>OTP sent to your email.</b>,
          error: (err) => <b>Failed to send email. {err}</b>,
        })
        .catch(() => {});
    }
  };

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDisabled(true);

    setErrorMessage("");
    let errorMsg = "";

    try {
      // Validate email
      errorMsg = validateEmail(email);
      if (errorMsg !== "") {
        setErrorMessage(errorMsg);
        return;
      }

      // Validate password
      errorMsg = validatePassword(password);
      if (errorMsg !== "") {
        setErrorMessage(errorMsg);
        return;
      }

      if (isRegister) {
        // Validate confirm password
        if (password !== confirmPassword) {
          setErrorMessage("Passwords do not match.");
          return;
        }

        // Validate otp code
        errorMsg = validateOTP(otp);
        if (errorMsg !== "") {
          setErrorMessage(errorMsg);
          return;
        }
      }

      // Handle successful form submission
      submitHandler(email, password, otp);
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
          <>
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

            <div className={styles["form-group"]}>
              <label htmlFor="otp">OTP Verification</label>
              <div className={styles["otp-container"]}>
                <Input
                  type="text"
                  id="otp"
                  placeholder="Enter your verification code"
                  value={otp}
                  onChange={(e) => setOTP(e.target.value)}
                />
                <Button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={otpLoading}
                  checkCooldown={otpLoading}
                  cooldownPeriod={60}
                  getRemainingCooldown={getLastGetRegisterOTPTimeFromCookie}
                >
                  Get OTP
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className={styles["forgot-password"]}>
            <Link onClick={handleForgotPassword}>Forgot Password?</Link>
          </div>
        )}

        <p className={styles["error"]}>
          {errorMessage === "" ? apiError : errorMessage}
        </p>

        {isRegister && (
          <div className={styles["form-group"]}>
            <div className={styles["checkbox-wrapper"]}>
              <Checkbox isCheck={true} color="green" disabled />
              <div>
                By proceeding to register, I agree to the{" "}
                <Link>Terms and Conditions</Link>.
              </div>
            </div>
          </div>
        )}
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
