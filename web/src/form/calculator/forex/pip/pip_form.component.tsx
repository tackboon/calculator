import React, { useCallback, useEffect, useRef, useState } from "react";

import { calculateResult, validatePipInput } from "./utils.component";

import styles from "../forex_calculator_form.module.scss";
import Button from "../../../../component/common/button/button.component";
import Container from "../../../../component/common/container/container.component";
import NumberInput from "../../../../component/common/input/number_input.component";
import { ERROR_FIELD_PIP, PipInputType, PipResultType } from "./pip.type";
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
import CurrencySelectBox from "../../../../component/forex/currency_select_box/currency.component";
import PairSelectBox from "../../../../component/forex/pair_select_box/pair.component";
import { useSpring, animated } from "@react-spring/web";
import CrossRateInput from "../../../../component/forex/cross_rate_input_box/cross.component";
import { FOREX_LOADING_TYPES } from "../../../../store/forex/forex.types";

const DEFAULT_INPUT: PipInputType = {
  accBaseCurrency: "USD",
  currencyPair: "EUR/USD",
  quotePair: "",
  quoteCrossRate: "1.00",
  positionSize: "100,000",
  pipDecimal: "0.0001",
};

const ForexPipForm = () => {
  const supportedAssets = useSelector(selectForexSupportedAssets);
  const supportedCurrencies = useSelector(selectForexSupportedCurrencies);
  const currencyRates = useSelector(selectForexCurrencyRates);
  const commodityRates = useSelector(selectForexCommodityRates);
  const isLoading = useSelector(selectForexIsLoading);

  const [errorMessage, setErrorMessage] = useState("");
  const [errorField, setErrorField] = useState<ERROR_FIELD_PIP | null>(null);
  const [input, setInput] = useState<PipInputType>(DEFAULT_INPUT);

  const [result, setResult] = useState<PipResultType | null>(null);
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
    const { err, field } = validatePipInput(input);
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
        This calculator helps you quickly determine the price increase or
        decrease based on a given percentage. Simply enter the stock price and
        percentage, and the calculator will return the price levels for both
        upward and downward movements. This tool is useful for setting price
        targets, stop-loss levels, and evaluating potential price changes.
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
                  pipSize: `${pairInfo.pip}`,
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
                isInvalid={errorField === ERROR_FIELD_PIP.QUOTE_CROSS_RATE}
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
            isInvalid={errorField === ERROR_FIELD_PIP.POSITION_SIZE}
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
            maxLength={10}
            isInvalid={errorField === ERROR_FIELD_PIP.PIP_DECIMAL}
            minDecimalPlace={0}
            maxDecimalPlace={5}
            value={input.pipDecimal}
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, pipDecimal: val }))
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
            <Container className={`${styles["result-container"]}`}>
              <div className={styles["result-wrapper"]}>
                <div className={styles["row"]}>
                  <div>Pip Value:</div>
                  <div>
                    $
                    {convertToLocaleString(
                      result.pipValue,
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

export default ForexPipForm;
