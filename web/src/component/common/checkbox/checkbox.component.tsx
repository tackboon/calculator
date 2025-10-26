import { FC } from "react";

import styles from "./checkbox.module.scss";

type CheckboxProps = {
  id: string;
  color?: "green" | "black";
  isCheck: boolean;
  disabled?: boolean;
  onCheck?: () => void;
};

const Checkbox: FC<CheckboxProps> = ({
  id,
  isCheck,
  disabled,
  onCheck,
  color = "black",
}) => {
  const handleCheck = () => {
    if (!disabled) {
      onCheck && onCheck();
    }
  };

  return (
    <label
      htmlFor={id}
      className={`${styles["checkbox"]} ${isCheck ? styles["active"] : ""} ${
        disabled ? styles["disabled"] : ""
      } ${styles[color]}`}
      style={{ margin: 0 }}
    >
      <input id={id} type="checkbox" checked={isCheck} onChange={handleCheck} />
    </label>
  );
};

export default Checkbox;
