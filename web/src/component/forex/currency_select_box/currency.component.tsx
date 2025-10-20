import { FC } from "react";

import SelectBox from "../../common/select_box/select_box.component";
import { SupportedCurrency } from "../../../store/forex/forex.types";

type CurrencySelectBoxProps = {
  id: string;
  defaultIndex: number;
  supportedCurrencies: SupportedCurrency;
  onChange: (currency: string) => void;
};

const CurrencySelectBox: FC<CurrencySelectBoxProps> = ({
  id,
  defaultIndex,
  supportedCurrencies,
  onChange,
}) => {
  const currencyOptions = Object.entries(supportedCurrencies).map(
    ([_, data]) => data.currency
  );
  const currencyNameOptions = Object.entries(supportedCurrencies).map(
    ([_, data]) => {
      return data.currency + " - " + data.currency_name;
    }
  );

  return (
    <SelectBox
      id={id}
      options={currencyNameOptions}
      defaultIndex={defaultIndex}
      onChangeHandler={(idx) => onChange(currencyOptions[idx])}
      isSearchable={true}
    />
  );
};

export default CurrencySelectBox;
