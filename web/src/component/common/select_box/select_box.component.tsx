import { FC, SelectHTMLAttributes, useState } from "react";

import styles from "./select_box.module.scss";

type SelectBoxProps = {
  options: string[];
  defaultIndex: number;
  onChangeHandler: (selectedIndex: number) => void;
} & SelectHTMLAttributes<HTMLSelectElement>;

const SelectBox: FC<SelectBoxProps> = ({
  defaultIndex,
  options,
  onChangeHandler,
  ...props
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(defaultIndex);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedIndex(event.target.selectedIndex);
    if (onChangeHandler) onChangeHandler(event.target.selectedIndex);
  };

  return (
    <div className={styles["select-box-wrapper"]}>
      <select
        className={styles["select-box"]}
        value={options[selectedIndex]}
        onChange={handleChange}
        {...props}
      >
        {options.map((opt, idx) => (
          <option key={idx} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectBox;
