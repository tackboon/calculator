import { FC, HTMLAttributes } from "react";

import styles from "./scrollbar.module.scss";

type ScrollableProps = HTMLAttributes<HTMLElement>;

const Scrollable: FC<ScrollableProps> = ({ children, className, ...props }) => (
  <div className={`${styles["scrollable"]} ${className}`} {...props}>
    {children}
  </div>
);

export default Scrollable;
