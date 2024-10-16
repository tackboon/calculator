import { ButtonHTMLAttributes, FC, ReactNode } from "react";

import styles from "./button.module.scss";

type ButtonProps = {
  children?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const Button: FC<ButtonProps> = ({ children, ...props }) => (
  <button className={styles["btn"]} {...props}>
    {children}
  </button>
);

export default Button;
