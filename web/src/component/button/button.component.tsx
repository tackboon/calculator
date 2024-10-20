import { ButtonHTMLAttributes, FC, ReactNode } from "react";

import styles from "./button.module.scss";

type ButtonProps = {
  children?: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const Button: FC<ButtonProps> = ({ children, className, ...props }) => (
  <button
    className={`${styles["btn"]} ${className ? className : ""}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
