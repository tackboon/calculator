import React, { useCallback, useEffect, useRef, useState } from "react";

import { calculateResult, validateSwapInput } from "./utils";

import styles from "../forex_calculator_form.module.scss";
import Button from "../../../../component/common/button/button.component";
import Container from "../../../../component/common/container/container.component";
import NumberInput from "../../../../component/common/input/number_input.component";
import { ERROR_FIELD_SWAP, SwapInputType, SwapResultType } from "./swap.type";
import DefaultSelect from "../../../../component/common/select_box/default_select_box.component";
import { convertToLocaleString } from "../../../../common/number/number";
import { useSelector } from "react-redux";
import {
  selectForexCommodityRates,
  selectForexCurrencyRates,
  selectForexIsLoading,
  selectForexSupportedAssets,
  selectForexSupportedCurrencies,
} from "../../../../store/forex/forex.selector";
import useCurrencyRates from "../hook/useCurrencyRates";
import useCommodityRates from "../hook/useCommodityRates";
import { useSpring, animated } from "@react-spring/web";
import CurrencySelectBox from "../../../../component/forex/currency_select_box/currency.component";
import PairSelectBox from "../../../../component/forex/pair_select_box/pair.component";
import CrossRateInput from "../../../../component/forex/cross_rate_input_box/cross.component";
import { FOREX_LOADING_TYPES } from "../../../../store/forex/forex.types";
import { absBig, mathBigNum } from "../../../../common/number/math";

const DEFAULT_INPUT: SwapInputType = {
  accBaseCurrency: "USD",
  currencyPair: "EUR/USD",
  quotePair: "",
  quoteCrossRate: "1.00",
  positionSize: "100,000",
  pipDecimal: "0.0001",
  swapPerLot: "0",
  period: "0",
};

const ForexSwapForm = () => {
  const supportedAssets = useSelector(selectForexSupportedAssets);
  const supportedCurrencies = useSelector(selectForexSupportedCurrencies);
  const currencyRates = useSelector(selectForexCurrencyRates);
  const commodityRates = useSelector(selectForexCommodityRates);
  const isLoading = useSelector(selectForexIsLoading);

  const [errorMessage, setErrorMessage] = useState("");
  const [errorField, setErrorField] = useState<ERROR_FIELD_SWAP | null>(null);
  const [input, setInput] = useState<SwapInputType>(DEFAULT_INPUT);

  const [result, setResult] = useState<SwapResultType | null>(null);
  const [decPrecision, setDecPrecision] = useState(2);
  const resultRef = useRef<HTMLDivElement>(null);

  // Fetch currency rates
  useCurrencyRates(input.accBaseCurrency);

  // Fetch commodity rates
  useCommodityRates();

  // Scroll to result after it is updated
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [result]);

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Handle validation
    const { err, field } = validateSwapInput(input);
    setErrorMessage(err);
    setErrorField(field);
    if (err !== "") return;

    // Handle calculation
    setResult(calculateResult(input));
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage("");
    setInput((prev) => ({
      ...DEFAULT_INPUT,
      accBaseCurrency: prev.accBaseCurrency,
      currencyPair: prev.currencyPair,
      quotePair: prev.quotePair,
      quoteCrossRate: prev.quoteCrossRate,
      pipDecimal: `${supportedAssets[prev.currencyPair].pip}`,
      positionSize: `${supportedAssets[prev.currencyPair].lot}`,
    }));
    setErrorField(null);
    setResult(null);
  };

  const crossRateStyles = useSpring({
    height: input.quotePair === "" ? 0 : 135,
    opacity: input.quotePair === "" ? 0 : 1,
    overflow: "hidden",
  });

  const quoteCrossRateOnChange = useCallback(
    (pair: string, rate: string) =>
      setInput((prev) => ({ ...prev, quotePair: pair, quoteCrossRate: rate })),
    []
  );

  return (
    <form className={styles["form-wrapper"]} onSubmit={handleSubmit}>
      <p className={styles["description"]}>
        This calculator helps you determine the swap value for your forex
        trades. It calculates the interest earned or paid for holding a position
        overnight based on the swap rate, position size, and holding period.
      </p>

      <div>
        <div className={styles["form-group"]}>
          <span className={styles["label"]}>Account Currency</span>
          <CurrencySelectBox
            id="acc-base-currency"
            defaultIndex={9}
            supportedCurrencies={supportedCurrencies}
            onChange={(currency) => {
              setInput((prev) => ({
                ...prev,
                accBaseCurrency: currency,
              }));
            }}
          />
        </div>

        <div className={styles["form-group"]}>
          <span className={styles["label"]}>Currency Pair</span>
          <PairSelectBox
            id="currency-pair"
            defaultIndex={23}
            supportedAssets={supportedAssets}
            onChange={(pair) => {
              setInput((prev) => {
                const pairInfo = supportedAssets[pair];
                return {
                  ...prev,
                  pipDecimal: `${pairInfo.pip}`,
                  positionSize: `${pairInfo.lot}`,
                  currencyPair: pair,
                };
              });
            }}
          />
        </div>

        <animated.div style={crossRateStyles}>
          <div className={styles["form-group"]}>
            <div className={styles["cross-rate-container"]}>
              <span className={styles["label"]}>Currency Rate</span>

              <CrossRateInput
                accBaseCurrency={input.accBaseCurrency}
                crossTyp="QUOTE"
                isLoading={
                  isLoading[FOREX_LOADING_TYPES.GET_COMMODITY_RATE] &&
                  isLoading[FOREX_LOADING_TYPES.GET_CURRENCY_RATE]
                }
                isInvalid={errorField === ERROR_FIELD_SWAP.QUOTE_CROSS_RATE}
                pair={input.currencyPair}
                currencyRate={currencyRates}
                commodityRate={commodityRates}
                onChange={quoteCrossRateOnChange}
              />
            </div>
          </div>
        </animated.div>

        <div className={styles["form-group"]}>
          <label htmlFor="position-size">Position Size (Unit)</label>
          <NumberInput
            id="position-size"
            step={1}
            isInvalid={errorField === ERROR_FIELD_SWAP.POSITION_SIZE}
            minDecimalPlace={0}
            maxDecimalPlace={0}
            value={input.positionSize}
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, positionSize: val }))
            }
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="pip-decimal">Pip in Decimals</label>
          <NumberInput
            id="pip-decimal"
            step={0.0001}
            isInvalid={errorField === ERROR_FIELD_SWAP.PIP_DECIMAL}
            minDecimalPlace={0}
            maxDecimalPlace={5}
            value={input.pipDecimal}
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, pipDecimal: val }))
            }
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="swap-per-lot">Swap (per lot)</label>
          <NumberInput
            id="swap-per-lot"
            step={0.01}
            isInvalid={errorField === ERROR_FIELD_SWAP.SWAP_PER_LOT}
            minDecimalPlace={2}
            maxDecimalPlace={5}
            value={input.swapPerLot}
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, swapPerLot: val }))
            }
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="period">Period in Days</label>
          <NumberInput
            id="period"
            step={1}
            isInvalid={errorField === ERROR_FIELD_SWAP.PERIOD}
            minDecimalPlace={0}
            maxDecimalPlace={0}
            value={input.period}
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, period: val }))
            }
          />
        </div>

        <p className={styles["error"]}>{errorMessage}</p>
      </div>

      <div className={styles["form-btn"]}>
        <Button
          className={styles["reset-btn"]}
          type="reset"
          tabIndex={-1}
          onClick={handleReset}
        >
          Reset
        </Button>
        <Button className={styles["submit-btn"]} type="submit">
          Calculate
        </Button>
      </div>

      <div ref={resultRef}>
        {result && (
          <>
            <div className={styles["precision-container"]}>
              <label htmlFor="precision">Precision:</label>
              <DefaultSelect
                className={styles["select"]}
                id="precision"
                options={["0", "1", "2", "3", "4", "5"]}
                defaultIndex={decPrecision}
                onChangeHandler={(idx) => setDecPrecision(idx)}
              />
            </div>
            <Container
              className={`${styles["result-container"]} ${styles["price-percentage"]}`}
            >
              <div className={styles["result-wrapper"]}>
                <div className={styles["row"]}>
                  <div>Swap Value:</div>
                  <div>
                    {mathBigNum.largerEq(result.swapValue, 0) ? "" : "-"}$
                    {convertToLocaleString(
                      absBig(result.swapValue),
                      decPrecision,
                      decPrecision
                    )}{" "}
                    {result.accBaseCurrency}
                  </div>
                </div>
              </div>
            </Container>
          </>
        )}
      </div>
    </form>
  );
};

export default ForexSwapForm;
