import { FC } from "react";

import SelectBox from "../../common/select_box/select_box.component";

type LeverageSelectBoxProps = {
  id: string;
  defaultIndex: number;
  onChange: (leverage: number) => void;
};

const LeverageSelectBox: FC<LeverageSelectBoxProps> = ({
  id,
  defaultIndex,
  onChange,
}) => {
  const leverages = [
    1, 2, 5, 10, 20, 25, 30, 50, 75, 100, 200, 300, 400, 500, 1000,
  ];
  const leverageOptions = leverages.map((option) => `1:${option}`);

  return (
    <SelectBox
      id={id}
      options={leverageOptions}
      defaultIndex={defaultIndex}
      onChangeHandler={(idx) => onChange(leverages[idx])}
      isSearchable={false}
    />
  );
};

export default LeverageSelectBox;
