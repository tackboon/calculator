import { FC, HTMLAttributes } from "react";

import styles from "./slidebar.module.scss";

type SlidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  position: "left" | "right";
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

const Slidebar: FC<SlidebarProps> = ({
  isOpen,
  onClose,
  position,
  className,
  children,
  ...props
}) => {
  return (
    <>
      {isOpen && <div className={styles["backdrop"]} onClick={onClose} />}

      <div
        className={`${styles["slidebar"]} ${styles[position]} ${
          isOpen ? styles["open"] : ""
        } ${className}`}
        {...props}
      >
        <div className={styles["close-btn-container"]}>
          <div className={styles["close-btn"]} onClick={onClose}>
            &times;
          </div>
        </div>
        {children}
      </div>
    </>
  );
};

export default Slidebar;
