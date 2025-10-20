import { useCallback, useEffect, useRef, useState } from "react";

import { calculateResult, validateMarginInput } from "./utils.component";

import styles from "../forex_calculator_form.module.scss";
import Button from "../../../../component/common/button/button.component";
import Container from "../../../../component/common/container/container.component";
import {
  ERROR_FIELD_MARGIN,
  MarginInputType,
  MarginResultType,
} from "./margin.type";
import DefaultSelect from "../../../../component/common/select_box/default_select_box.component";
import { convertToLocaleString } from "../../../../common/number/number";
import { useSpring, animated } from "@react-spring/web";
import useCurrencyRates from "../hook/useCurrencyRates";
import useCommodityRates from "../hook/useCommodityRates";
import CurrencySelectBox from "../../../../component/forex/currency_select_box/currency.component";
import { useSelector } from "react-redux";
import {
  selectForexCommodityRates,
  selectForexCurrencyRates,
  selectForexIsLoading,
  selectForexSupportedAssets,
  selectForexSupportedCurrencies,
} from "../../../../store/forex/forex.selector";
import LeverageSelectBox from "../../../../component/forex/leverage_select_box/leverage.component";
import CrossRateInput from "../../../../component/forex/cross_rate_input_box/cross.component";
import { FOREX_LOADING_TYPES } from "../../../../store/forex/forex.types";
import NumberInput from "../../../../component/common/input/number_input.component";
import PairSelectBox from "../../../../component/forex/pair_select_box/pair.component";

const DEFAULT_INPUT: MarginInputType = {
  accBaseCurrency: "USD",
  currencyPair: "EUR/USD",
  basePair: "",
  baseCrossRate: "1.00",
  positionSize: "100,000",
  leverage: 100,
};

const ForexMarginForm = () => {
  const supportedAssets = useSelector(selectForexSupportedAssets);
  const supportedCurrencies = useSelector(selectForexSupportedCurrencies);
  const currencyRates = useSelector(selectForexCurrencyRates);
  const commodityRates = useSelector(selectForexCommodityRates);
  const isLoading = useSelector(selectForexIsLoading);

  const [errorMessage, setErrorMessage] = useState("");
  const [errorField, setErrorField] = useState<ERROR_FIELD_MARGIN | null>(null);
  const [input, setInput] = useState<MarginInputType>(DEFAULT_INPUT);

  const [result, setResult] = useState<MarginResultType | null>(null);
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
    const { err, field } = validateMarginInput(input);
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
      basePair: prev.basePair,
      baseCrossRate: prev.baseCrossRate,
      leverage: prev.leverage,
    }));
    setErrorField(null);
    setResult(null);
  };

  const crossRateStyles = useSpring({
    height: input.basePair === "" ? 0 : 135,
    opacity: input.basePair === "" ? 0 : 1,
    overflow: "hidden",
  });

  const baseCrossRateOnChange = useCallback(
    (pair: string, rate: string) =>
      setInput((prev) => ({ ...prev, basePair: pair, baseCrossRate: rate })),
    []
  );

  return (
    <form className={styles["form-wrapper"]} onSubmit={handleSubmit}>
      <p className={styles["description"]}>
        This calculator helps you determine the margin required to open and hold
        a forex position. It calculates the amount of capital needed based on
        your leverage, position size, currency pair, and account currency.
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
                  pipSize: pairInfo.pip,
                  contractSize: pairInfo.lot,
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
                crossTyp="BASE"
                isLoading={
                  isLoading[FOREX_LOADING_TYPES.GET_COMMODITY_RATE] &&
                  isLoading[FOREX_LOADING_TYPES.GET_CURRENCY_RATE]
                }
                isInvalid={errorField === ERROR_FIELD_MARGIN.BASE_CROSS_RATE}
                pair={input.currencyPair}
                currencyRate={currencyRates}
                commodityRate={commodityRates}
                onChange={baseCrossRateOnChange}
              />
            </div>
          </div>
        </animated.div>

        <div className={styles["form-group"]}>
          <span className={styles["label"]}>Leverage for Margin</span>
          <LeverageSelectBox
            id="leverage"
            defaultIndex={9}
            onChange={(leverage) => {
              setInput((prev) => ({
                ...prev,
                leverage,
              }));
            }}
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="position-size">Position Size (Unit)</label>
          <NumberInput
            id="position-size"
            step={1}
            isInvalid={errorField === ERROR_FIELD_MARGIN.POSITION_SIZE}
            minDecimalPlace={0}
            maxDecimalPlace={0}
            value={input.positionSize}
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, positionSize: val }))
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
                  <div>Margin To Hold:</div>
                  <div>
                    $
                    {convertToLocaleString(
                      result.margin,
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

export default ForexMarginForm;
