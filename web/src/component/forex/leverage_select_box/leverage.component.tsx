import { FC } from "react";

import SelectBox from "../../common/select_box/select_box.component";

type LeverageSelectBoxProps = {
  name?: string;
  defaultIndex: number;
  onChange: (leverage: number) => void;
};

const LeverageSelectBox: FC<LeverageSelectBoxProps> = ({
  name,
  defaultIndex,
  onChange,
}) => {
  const leverages = [
    1, 2, 5, 10, 20, 25, 30, 50, 75, 100, 200, 300, 400, 500, 1000,
  ];
  const leverageOptions = leverages.map((option) => `1:${option}`);

  return (
    <SelectBox
      name={name}
      options={leverageOptions}
      defaultIndex={defaultIndex}
      onChangeHandler={(idx) => onChange(leverages[idx])}
      isSearchable={true}
    />
  );
};

export default LeverageSelectBox;
