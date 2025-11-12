import { FC, useState, MouseEvent } from "react";

import styles from "./numbox.module.scss";

type NumboxProps = {
  min: number;
  max: number;
  defaultValue: number;
  onChange: (val: number) => void;
};

const Numbox: FC<NumboxProps> = ({ min, max, defaultValue, onChange }) => {
  const [value, setValue] = useState(defaultValue);

  const handleClick = (e: MouseEvent<HTMLButtonElement>, incr: number) => {
    e.preventDefault();

    const newValue = value + incr;
    if (newValue >= min || newValue <= max) {
      setValue(newValue);
      onChange(newValue);
    }
  };

  return (
    <div className={styles["container"]}>
      <button onClick={(e) => handleClick(e, -1)}>-</button>
      <div className={styles["value"]}>{value}</div>
      <button className={styles["plus"]} onClick={(e) => handleClick(e, 1)}>
        +
      </button>
    </div>
  );
};

export default Numbox;
