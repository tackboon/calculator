import { FC, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./forgot_form.module.scss";
import { ValidateEmail } from "../../common/validation/auth.validation";
import Button from "../../component/button/button.component";
import Input from "../../component/input/input.component";
import Link from "../../component/link/link.component";

type FormProps = {
  submitHandler: (email: string) => string;
};

const COOLDOWN_PERIOD = 60;

const ForgotPasswordForm: FC<FormProps> = ({ submitHandler }) => {
  const navigate = useNavigate();

  // State for send link cooldown
  const [isDisabled, setIsDisabled] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const intervalID = useRef<NodeJS.Timeout | null>(null);

  // State for form values
  const [email, setEmail] = useState("");

  // State for error messages
  const [errorMessage, setErrorMessage] = useState("");

  // Enable send link button if cooldown is 0
  const startCooldown = () => {
    // Start the countdown
    const id = setInterval(() => {
      setCooldown((prevCooldown) => {
        if (prevCooldown <= 1) {
          clearInterval(id);
          setIsDisabled(false);
          return 0;
        }
        return prevCooldown - 1;
      });
    }, 1000);
    intervalID.current = id;
  };

  // Save last action time to local storage
  const saveLastActionTime = () => {
    const currentTime = Date.now();
    localStorage.setItem("lastActionTime", currentTime.toString());
  };

  // Retrieve last action time from local storage
  const retrieveLastActionTime = (): string | null => {
    return localStorage.getItem("lastActionTime");
  };

  // Check localStorage for last action timestamp
  useEffect(() => {
    const lastActionTime = retrieveLastActionTime();
    if (lastActionTime) {
      const elapsedTime = Math.floor(
        (Date.now() - Number(lastActionTime)) / 1000
      );
      const remainingCooldown = COOLDOWN_PERIOD - elapsedTime;

      // Start the timer if there's time left
      if (remainingCooldown > 0) {
        setIsDisabled(true);
        setCooldown(remainingCooldown);
        startCooldown();
      }
    }

    // Cleanup interval
    return () => {
      if (intervalID.current) {
        clearInterval(intervalID.current);
      }
    };
  }, []);

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDisabled(true);

    setErrorMessage("");
    let errorMsg = "";

    // Validate email
    errorMsg = ValidateEmail(email);
    if (errorMsg !== "") {
      setErrorMessage(errorMsg);
      setIsDisabled(false);
      return;
    }

    // Handle successful form submission
    setErrorMessage(submitHandler(email));

    // Start cooldown send link
    saveLastActionTime();
    setCooldown(COOLDOWN_PERIOD);
    startCooldown();
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
          disabled={isDisabled}
        >
          Request reset link{cooldown > 0 ? ` (${cooldown})s` : ""}
        </Button>
        <div className={styles["back-to-login"]}>
          <Link onClick={handleBackToLogin}>Back to Login</Link>
        </div>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;
