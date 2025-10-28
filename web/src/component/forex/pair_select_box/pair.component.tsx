import { FC } from "react";

import SelectBox from "../../common/select_box/select_box.component";
import { SupportedAsset } from "../../../store/forex/forex.types";

type PairSelectBoxProps = {
  id: string;
  defaultIndex: number;
  supportedAssets: SupportedAsset;
  onChange: (pair: string) => void;
};

const PairSelectBox: FC<PairSelectBoxProps> = ({
  id,
  defaultIndex,
  supportedAssets,
  onChange,
}) => {
  const assetOptions = Object.entries(supportedAssets).map(([asset]) => asset);

  return (
    <SelectBox
      id={id}
      options={assetOptions}
      defaultIndex={defaultIndex}
      onChangeHandler={(idx) => onChange(assetOptions[idx])}
      isSearchable={true}
    />
  );
};

export default PairSelectBox;
