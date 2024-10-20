import { FC, InputHTMLAttributes, useState } from "react";

import styles from "./input.module.scss";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

const Input: FC<InputProps> = ({ type = "text", ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  return (
    <div className={styles["input-container"]}>
      <input
        className={styles["input"]}
        type={type === "password" && showPassword ? "text" : type}
        {...props}
      />
      {type === "password" && (
        <button
          type="button"
          className={styles["toggle-button"]}
          onClick={togglePasswordVisibility}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      )}
    </div>
  );
};

export default Input;
