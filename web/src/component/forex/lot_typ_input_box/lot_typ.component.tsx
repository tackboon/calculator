import { FC } from "react";

import SelectBox from "../../common/select_box/select_box.component";

export enum LotTyp {
  STANDARD_LOT,
  MINI_LOT,
  MICRO_LOT,
  NANO_LOT,
}

type LotTypSelectBoxProps = {
  id: string;
  defaultIndex: number;
  onChange: (lotTyp: LotTyp) => void;
};

const LotTypSelectBox: FC<LotTypSelectBoxProps> = ({
  id,
  defaultIndex,
  onChange,
}) => {
  const lotTypOptions = ["Standard Lot", "Mini Lot", "Micro Lot", "Nano Lot"];

  return (
    <SelectBox
      id={id}
      options={lotTypOptions}
      defaultIndex={defaultIndex}
      onChangeHandler={(idx) => onChange(idx)}
      isSearchable={false}
    />
  );
};

export default LotTypSelectBox;
