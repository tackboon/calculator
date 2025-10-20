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
import { divideBig, multiplyBig } from "../../../common/number/math";
import { convertToLocaleString } from "../../../common/number/number";
import { FeeTyp } from "../../../form/calculator/forex/forex_calculator_form.type";

type CrossRateInputProps = {
  accBaseCurrency: string;
  crossTyp: "BASE" | "QUOTE";
  isLoading: boolean;
  pair: string;
  currencyRate: CurrencyRateMap;
  commodityRate: CommodityRateMap;
  isInvalid: boolean;
  mode?: "DEFAULT" | "POSITION_SIZE" | "PROFIT_LOSS";
  includeTradingFee?: boolean;
  feeTyp?: FeeTyp;
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
  mode = "DEFAULT",
  includeTradingFee = false,
  feeTyp = FeeTyp.COMMISSION_PER_LOT,
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
    if (
      isLoading ||
      (mode === "DEFAULT" &&
        ((crossTyp === "BASE" && accBaseCurrency === base) ||
          (crossTyp === "QUOTE" && accBaseCurrency === quote))) ||
      ((mode === "POSITION_SIZE" || mode === "PROFIT_LOSS") &&
        (accBaseCurrency === quote || accBaseCurrency === base))
    ) {
      setCrossPair(tempCrossPair);
      setCrossRate(tempCrossRateStr);
      setStep(tempStep);
      onChange(tempCrossPair, tempCrossRateStr);
      return;
    }

    if (crossTyp === "BASE") {
      // Handling base cross pair

      // Hide base cross pair if its not a commission_per_100k fee type
      if (
        mode === "PROFIT_LOSS" &&
        (!includeTradingFee || feeTyp !== FeeTyp.COMMISSION_PER_100K)
      ) {
        setCrossPair(tempCrossPair);
        setCrossRate(tempCrossRateStr);
        setStep(tempStep);
        onChange(tempCrossPair, tempCrossRateStr);
        return;
      }

      // Determining cross pair
      tempCrossPair = generateCurrencyPair(accBaseCurrency, base);
      if (!Object.hasOwn(supportedAssets, tempCrossPair)) {
        tempCrossPair = generateCurrencyPair(base, accBaseCurrency);
      }

      // Getting pip size for cross pair
      if (Object.hasOwn(supportedAssets, tempCrossPair)) {
        tempStep = supportedAssets[tempCrossPair].pip;
      }

      if (isCommodity) {
        // Getting cross rate for commodity pair
        if (commodityRate && Object.hasOwn(commodityRate, base)) {
          const tempCommodityRate = commodityRate[base].price;
          if (accBaseCurrency === "USD") {
            tempCrossRateStr = convertToLocaleString(tempCommodityRate, 2, 5);
          } else if (currencyRate) {
            const tempRate = currencyRate["USD"].rates[accBaseCurrency];
            tempCrossRateStr = convertToLocaleString(
              multiplyBig(tempCommodityRate, tempRate),
              2,
              5
            );
          }
        }
      } else {
        // Getting cross rate for currency pair
        if (currencyRate && Object.hasOwn(currencyRate, accBaseCurrency)) {
          const tempBaseRate = currencyRate[accBaseCurrency].rates[base];
          const basePairInfo = getBaseAndQuote(tempCrossPair);
          if (basePairInfo.base === accBaseCurrency) {
            tempCrossRateStr = convertToLocaleString(tempBaseRate, 2, 5);
          } else {
            tempCrossRateStr = convertToLocaleString(
              divideBig(1, tempBaseRate),
              2,
              5
            );
          }
        }
      }
    } else {
      // Handling quote cross pair
      // Determining cross pair
      tempCrossPair = generateCurrencyPair(accBaseCurrency, quote);
      if (!Object.hasOwn(supportedAssets, tempCrossPair)) {
        tempCrossPair = generateCurrencyPair(quote, accBaseCurrency);
      }

      // Getting pip size for cross pair
      if (Object.hasOwn(supportedAssets, tempCrossPair)) {
        tempStep = supportedAssets[tempCrossPair].pip;
      }

      // Getting cross rate for currency pair
      if (currencyRate && Object.hasOwn(currencyRate, accBaseCurrency)) {
        const tempQuoteRate = currencyRate[accBaseCurrency].rates[quote];
        const quotePairInfo = getBaseAndQuote(tempCrossPair);
        if (quotePairInfo.base === accBaseCurrency) {
          tempCrossRateStr = convertToLocaleString(tempQuoteRate, 2, 5);
        } else {
          tempCrossRateStr = convertToLocaleString(
            divideBig(1, tempQuoteRate),
            2,
            5
          );
        }
      }
    }

    setCrossPair(tempCrossPair);
    setCrossRate(tempCrossRateStr);
    setStep(tempStep);
    onChange(tempCrossPair, tempCrossRateStr);
  }, [
    accBaseCurrency,
    commodityRate,
    isLoading,
    crossTyp,
    currencyRate,
    pair,
    mode,
    includeTradingFee,
    feeTyp,
    onChange,
  ]);

  return (
    <>
      {crossPair !== "" && (
        <>
          <div className={styles["exchange-rate-label"]}>{crossPair + ":"}</div>
          <NumberInput
            className={styles["exchange-rate-container"]}
            step={step}
            id={crossTyp === "BASE" ? "base-cross-rate" : "quote-cross-rate"}
            minDecimalPlace={2}
            maxDecimalPlace={5}
            isInvalid={isInvalid}
            value={crossRate}
            onChangeHandler={(val) => {
              setCrossRate(val);
              onChange(crossPair, val);
            }}
            disabled={isLoading}
          />
        </>
      )}
    </>
  );
};

export default CrossRateInput;
