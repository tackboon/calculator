import { FC, HTMLAttributes, ReactNode } from "react";
import styles from "./link.module.scss";

type SpanProps = {
  children?: ReactNode;
} & HTMLAttributes<HTMLSpanElement>;

const Link: FC<SpanProps> = ({ children, className, ...props }) => {
  return (
    <span className={`${styles["link"]} ${className}`} {...props}>
      {children}
    </span>
  );
};

export default Link;
