import { FC } from "react";

import SelectBox from "../../common/select_box/select_box.component";
import { SupportedAsset } from "../../../store/forex/forex.types";

type PairSelectBoxProps = {
  name?: string;
  defaultIndex: number;
  supportedAssets: SupportedAsset;
  onChange: (pair: string) => void;
};

const PairSelectBox: FC<PairSelectBoxProps> = ({
  name,
  defaultIndex,
  supportedAssets,
  onChange,
}) => {
  const assetOptions = Object.entries(supportedAssets).map(([asset]) => asset);

  return (
    <SelectBox
      name={name}
      options={assetOptions}
      defaultIndex={defaultIndex}
      onChangeHandler={(idx) => onChange(assetOptions[idx])}
      isSearchable={true}
    />
  );
};

export default PairSelectBox;
