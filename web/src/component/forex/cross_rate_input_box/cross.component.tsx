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
import { FeeTyp } from "../../../form/calculator/forex/forex_calculator_form.type";

type CrossRateInputProps = {
  accBaseCurrency: string;
  crossTyp: "BASE" | "QUOTE";
  isLoading: boolean;
  pair: string;
  includeTradingFee: boolean;
  feeTyp: FeeTyp;
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
  includeTradingFee,
  feeTyp,
  currencyRate,
  commodityRate,
  isInvalid,
  onChange,
}) => {
  const [crossPair, setCrossPair] = useState("");
  const [crossRate, setCrossRate] = useState("1.00");
  const [step, setStep] = useState(0.0001);

  useEffect(() => {
    let tempCrossPair = "";
    let tempCrossRateStr = "1.00";
    let tempStep = 0.0001;

    // Extract info from currency pair
    const { base, quote, isCommodity } = getBaseAndQuote(pair);

    // Update default step size for commodity pair
    if (isCommodity) tempStep = 0.01;

    // Hide cross pair on loading or currency pair contains account base currency
    if (isLoading || accBaseCurrency === quote || accBaseCurrency === base) {
      setCrossPair(tempCrossPair);
      setCrossRate(tempCrossRateStr);
      setStep(tempStep);
      return;
    }

    if (crossTyp === "BASE") {
      if (!includeTradingFee || feeTyp === FeeTyp.COMMISSION_PER_100K) {
        setCrossPair(tempCrossPair);
        setCrossRate(tempCrossRateStr);
        setStep(tempStep);
        return;
      }

      tempCrossPair = generateCurrencyPair(accBaseCurrency, base);
      if (Object.hasOwn(supportedAssets, tempCrossPair)) {
        setCrossPair(tempCrossPair);
      } else {
        tempCrossPair = generateCurrencyPair(base, accBaseCurrency);
        setCrossPair(tempCrossPair);
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

  return (
    <>
      {crossPair !== "" && (
        <>
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
        </>
      )}
    </>
  );
};

export default CrossRateInput;
