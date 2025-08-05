import { FC, useEffect } from "react";

import styles from "./cross.module.scss";
import NumberInput from "../../common/input/number_input.component";
import { getBaseAndQuote } from "../../../common/forex/forex";
import { useSelector } from "react-redux";
import {
  selectForexCommodityRates,
  selectForexCurrencyRates,
} from "../../../store/forex/forex.selector";

type CrossRateInputProps = {
  accBaseCurrency: string;
  isLoading: boolean;
  pair: string;
  onChange: (currency: string) => void;
};

const CrossRateInput: FC<CrossRateInputProps> = ({
  accBaseCurrency,
  isLoading,
  pair,
  onChange,
}) => {
  const baseCurrencyRate = useSelector(selectForexCurrencyRates);
  const usdCommodityRate = useSelector(selectForexCommodityRates);

  useEffect(() => {
    if (isLoading) return;

    let crossPair = "";
    let crossRateStr = "0";
    let step = 0.0001;

    const { base, quote } = getBaseAndQuote(pair);

    if (accBaseCurrency !== quote && accBaseCurrency !== base) {
      const baseRate = baseCurrencyRate
        ? baseCurrencyRate[prevCurrency].rates[baseQuote.base]
        : 0;
      if (baseRate !== undefined) {
        const pairData = generateCurrencyPair(prevCurrency, baseQuote.base);

        basePair = pairData;
        baseRateStr = `${baseRate}`;
        // baseStep = pairData.stepSize;
      }
    }
  }, []);

  // {input.usdQuotePair !== "" &&
  //                 input.includeTradingFee &&
  //                 input.feeTyp === FeeTyp.COMMISSION_PER_100K &&
  return (
    <div className={styles["exchange-rate-container"]}>
      <div className={styles["exchange-rate-label"]}>
        {input.usdQuotePair + ":"}
      </div>
      <NumberInput
        step={stepSize.usdQuote}
        id="usd-quote-cross-rate"
        minDecimalPlace={2}
        maxDecimalPlace={5}
        isInvalid={
          errorField === ERROR_FIELD_POSITION_SIZE.USD_QUOTE_CROSS_RATE
        }
        value={
          isLoading[FOREX_LOADING_TYPES.GET_CURRENCY_RATE]
            ? "0"
            : input.usdQuoteCrossRate || "0"
        }
        onChangeHandler={(val) =>
          setInput({ ...input, usdQuoteCrossRate: val })
        }
        disabled={isLoading[FOREX_LOADING_TYPES.GET_CURRENCY_RATE]}
      />
    </div>
  );
};

export default CrossRateInput;
