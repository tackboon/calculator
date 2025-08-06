import { FC, useEffect, useState } from "react";

import styles from "./cross.module.scss";
import NumberInput from "../../common/input/number_input.component";
import {
  generateCurrencyPair,
  getBaseAndQuote,
} from "../../../common/forex/forex";
import {
  CommodityRateMap,
  CurrencyRateMap,
  supportedAssets,
} from "../../../store/forex/forex.types";
import { divideBig, mathBigNum } from "../../../common/number/math";

type CrossRateInputProps = {
  accBaseCurrency: string;
  crossTyp: "BASE" | "QUOTE";
  isLoading: boolean;
  pair: string;
  currencyRate: CurrencyRateMap;
  commodityRate: CommodityRateMap;
  isInvalid: boolean;
  onChange: (pair: string, rate: string) => void;
};

const CrossRateInput: FC<CrossRateInputProps> = ({
  accBaseCurrency,
  crossTyp,
  isLoading,
  pair,
  currencyRate,
  commodityRate,
  isInvalid,
  onChange,
}) => {
  const [crossPair, setCrossPair] = useState("");
  const [crossRate, setCrossRate] = useState("0");
  const [step, setStep] = useState(0.0001);

  useEffect(() => {
    if (isLoading) return;

    let tempCrossPair = "";
    let tempCrossRateStr = "0";
    let tempStep = 0.0001;

    const { base, quote, isCommodity } = getBaseAndQuote(pair);

    if (accBaseCurrency === quote || accBaseCurrency === base) return;

    if (crossTyp === "BASE") {
      tempCrossPair = generateCurrencyPair(accBaseCurrency, base);
      let isBaseFirst = false;
      if (!(tempCrossPair in supportedAssets)) {
        tempCrossPair = generateCurrencyPair(base, accBaseCurrency);
        isBaseFirst = true;
      }
      if (tempCrossPair in supportedAssets) {
        tempStep = supportedAssets[tempCrossPair].pip;
      }

      if (isCommodity) {
        if (commodityRate && commodityRate[base]) {
          const rate = commodityRate[base];
          let usdToAccRate = 1;
          if (quote !== "USD") {
            if (currencyRate && currencyRate["USD"]) {
              usdToAccRate = currencyRate["USD"].rates[accBaseCurrency];
            } else {
              usdToAccRate = 0;
            }
          }

          tempCrossRateStr = `${rate.price * usdToAccRate}`;
        }
      } else {
        if (currencyRate && currencyRate[accBaseCurrency]) {
          const accToBase = currencyRate[accBaseCurrency].rates[base];
          let tempCrossRate = isBaseFirst
            ? mathBigNum.bignumber(accToBase)
            : divideBig(1, accToBase);

          tempCrossRate = mathBigNum.round(tempCrossRate, 5);
          tempCrossRateStr = `${tempCrossRate}`;
        }
      }
    } else {
      tempCrossPair = generateCurrencyPair(accBaseCurrency, quote);
      let isQuoteFirst = false;
      if (!(tempCrossPair in supportedAssets)) {
        tempCrossPair = generateCurrencyPair(quote, accBaseCurrency);
        isQuoteFirst = true;
      }
      if (tempCrossPair in supportedAssets) {
        tempStep = supportedAssets[tempCrossPair].pip;
      }

      if (currencyRate && currencyRate[accBaseCurrency]) {
        const accToQuote = currencyRate[accBaseCurrency].rates[quote];
        let tempCrossRate = isQuoteFirst
          ? mathBigNum.bignumber(accToQuote)
          : divideBig(1, accToQuote);

        tempCrossRate = mathBigNum.round(tempCrossRate, 5);
        tempCrossRateStr = `${tempCrossRate}`;
      }
    }

    setCrossPair(tempCrossPair);
    setCrossRate(tempCrossRateStr);
    setStep(tempStep);
  }, [accBaseCurrency, commodityRate, isLoading, crossTyp, currencyRate, pair]);

  useEffect(() => {
    
  }, [])

  return (
    crossPair !== "" && (
      <div className={styles["exchange-rate-container"]}>
        <div className={styles["exchange-rate-label"]}>{crossPair + ":"}</div>
        <NumberInput
          step={step}
          id="usd-quote-cross-rate"
          minDecimalPlace={2}
          maxDecimalPlace={5}
          isInvalid={isInvalid}
          value={crossRate}
          onChangeHandler={(val) => setCrossRate(val)}
          disabled={isLoading}
        />
      </div>
    )
  );
};

export default CrossRateInput;
