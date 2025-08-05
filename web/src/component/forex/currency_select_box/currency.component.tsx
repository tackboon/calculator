import { FC } from "react";

import SelectBox from "../../common/select_box/select_box.component";
import { SupportedCurrency } from "../../../store/forex/forex.types";

type CurrencySelectBoxProps = {
  name?: string;
  defaultIndex: number;
  supportedCurrencies: SupportedCurrency;
  onChange: (currency: string) => void;
};

const CurrencySelectBox: FC<CurrencySelectBoxProps> = ({
  name,
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
      name={name}
      options={currencyNameOptions}
      defaultIndex={defaultIndex}
      onChangeHandler={(idx) => onChange(currencyOptions[idx])}
      isSearchable={true}
    />
  );
};

export default CurrencySelectBox;
