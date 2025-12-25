import { FC, HTMLAttributes, ReactNode } from "react";
import styles from "./link.module.scss";

type SpanProps = {
  children?: ReactNode;
  disabled?: boolean;
} & HTMLAttributes<HTMLSpanElement>;

const Link: FC<SpanProps> = ({ children, disabled, className, ...props }) => {
  return (
    <span
      className={`${styles["link"]} ${
        disabled ? styles["disabled"] : ""
      } ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Link;
