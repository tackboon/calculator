import { FC, HTMLAttributes, ReactNode } from "react";

import styles from "./container.module.scss";

type ContainerProps = {
  children?: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

const Container: FC<ContainerProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={`${styles["container"]} ${className ? className : ""}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Container;
