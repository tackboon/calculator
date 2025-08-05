import { FC, useState } from "react";
import Select, { SingleValue } from "react-select";

type SelectBoxProps = {
  name?: string;
  options: string[];
  defaultIndex: number;
  isSearchable?: boolean;
  onChangeHandler: (selectedIndex: number) => void;
};

const SelectBox: FC<SelectBoxProps> = ({
  name,
  defaultIndex,
  options,
  isSearchable = false,
  onChangeHandler,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(defaultIndex);

  const opts = options.map((val, idx) => ({ value: idx, label: val }));
  const handleChange = (val: SingleValue<{ value: number; label: string }>) => {
    const idx = val?.value || 0;
    setSelectedIdx(idx);
    if (onChangeHandler) onChangeHandler(idx);
  };

  const customStyles = {
    control: (base: any) => ({
      ...base,
      height: "45.59px",
      fontSize: "16px",
    }),
    menu: (base: any) => ({
      ...base,
      zIndex: 4, // Ensures dropdown is on top
    }),
    option: (base: any, { isFocused, isSelected }: any) => ({
      ...base,
      backgroundColor: isSelected
        ? "#000000"
        : isFocused
        ? "#e0e0e0"
        : "#ffffff",
      color: isSelected ? "#ffffff" : "#000000", // White text for selected, black for normal
    }),
  };

  return (
    <Select
      name={name}
      options={opts}
      defaultValue={opts[defaultIndex]}
      isSearchable={isSearchable}
      onChange={handleChange}
      styles={customStyles}
      value={opts[selectedIdx]}
    />
  );
};

export default SelectBox;
