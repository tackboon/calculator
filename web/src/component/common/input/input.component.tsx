import { FC, InputHTMLAttributes, useState } from "react";

import styles from "./input.module.scss";

type InputProps = {
  preUnit?: string;
  postUnit?: string;
  isInvalid?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

const Input: FC<InputProps> = ({
  type = "text",
  preUnit,
  postUnit,
  isInvalid,
  value,
  className,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  return (
    <div
      className={`${styles["input-container"]} ${
        type === "password" ? styles["password"] : ""
      } ${className}`}
    >
      {preUnit && value && value.toString().length > 0 && (
        <span className={styles["pre-unit"]}>{preUnit}</span>
      )}
      {postUnit && value && value.toString().length > 0 && (
        <span className={styles["post-unit"]}>{postUnit}</span>
      )}
      
      <input
        className={`${styles["input"]} ${
          type === "password" ? styles["password"] : ""
        } ${
          preUnit && value && value.toString().length > 0
            ? styles["pre-unit-input"]
            : ""
        } ${
          postUnit && value && value.toString().length > 0
            ? styles["post-unit-input"]
            : ""
        }`}
        type={type === "password" && showPassword ? "text" : type}
        style={isInvalid ? { border: "1px solid red" } : {}}
        value={value}
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
