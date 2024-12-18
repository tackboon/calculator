import { FC, InputHTMLAttributes, useState } from "react";

import styles from "./input.module.scss";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

const Input: FC<InputProps> = ({ type = "text", ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  return (
    <div
      className={`${styles["input-container"]} ${
        type === "password" ? styles["password"] : ""
      }`}
    >
      <input
        className={`${styles["input"]} ${
          type === "password" ? styles["password"] : ""
        }`}
        type={type === "password" && showPassword ? "text" : type}
        {...props}
      />
      {type === "password" && (
        <button
          type="button"
          className={styles["toggle-button"]}
          onClick={togglePasswordVisibility}
          tabIndex={-1}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      )}
    </div>
  );
};

export default Input;
