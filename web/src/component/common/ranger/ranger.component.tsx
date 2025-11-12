import { FC, useState, ChangeEvent, useRef, useEffect } from "react";

import styles from "./ranger.module.scss";

type RangerProps = {
  min: number;
  max: number;
  defaultValue: number;
  onChange: (val: number) => void;
};

const Ranger: FC<RangerProps> = ({ min, max, defaultValue, onChange }) => {
  const [value, setValue] = useState(defaultValue);
  const sliderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sliderRef.current === null) return;

    const percent = (value / max) * 100;
    sliderRef.current.style.background = `linear-gradient(to right, #000000 ${percent}%, #ebe9e7 ${percent}%)`;
  }, [max, value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setValue(newValue);
    onChange(newValue);
  };

  return (
    <div className={styles["container"]}>
      <input
        ref={sliderRef}
        className={styles["slider"]}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
      />
      <div className={styles["value"]}>{value}</div>
    </div>
  );
};

export default Ranger;
