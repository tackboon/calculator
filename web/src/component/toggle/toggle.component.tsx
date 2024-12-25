import { FC, useState } from "react";

import styles from "./toggle.module.scss";

type ToggleProps = {
  onTitle: string;
  offTitle: string;
  defaultState: boolean;
  onToggle?: (state: boolean) => void;
};

const Toggle: FC<ToggleProps> = ({
  onTitle,
  offTitle,
  defaultState,
  onToggle,
}) => {
  const [isOn, setIsOn] = useState(defaultState);

  const handleToggle = () => {
    const newValue = !isOn;
    setIsOn(newValue);

    if (onToggle) {
      onToggle(newValue);
    }
  };

  return (
    <div className={styles["wrapper"]} onClick={handleToggle}>
      <span className={`${styles["label"]} ${isOn ? styles["active"] : ""}`}>
        {onTitle}
      </span>
      <span className={`${styles["label"]} ${isOn ? "" : styles["active"]}`}>
        {offTitle}
      </span>
    </div>
  );
};

export default Toggle;
