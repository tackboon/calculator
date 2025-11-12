import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSpring, animated } from "@react-spring/web";

import {
  calculateCrossHeight,
  calculateResult,
  validateProfitLossInput,
} from "./utils";

import styles from "../forex_calculator_form.module.scss";
import Button from "../../../../component/common/button/button.component";
import Container from "../../../../component/common/container/container.component";
import Switch from "../../../../component/common/switch/switch.component";
import NumberInput from "../../../../component/common/input/number_input.component";
import Checkbox from "../../../../component/common/checkbox/checkbox.component";
import {
  ERROR_FIELD_PROFIT_LOSS,
  ProfitLossInputType,
  ProfitLossResultType,
} from "./profit_loss.type";
import { absBig, mathBigNum } from "../../../../common/number/math";
import DefaultSelect from "../../../../component/common/select_box/default_select_box.component";
import { convertToLocaleString } from "../../../../common/number/number";
import { FeeTyp } from "../forex_calculator_form.type";
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
import CrossRateInput from "../../../../component/forex/cross_rate_input_box/cross.component";
import { FOREX_LOADING_TYPES } from "../../../../store/forex/forex.types";
import SelectBox from "../../../../component/common/select_box/select_box.component";
import { getBaseAndQuote } from "../../../../common/forex/forex";

const DEFAULT_INPUT: ProfitLossInputType = {
  accBaseCurrency: "USD",
  currencyPair: "EUR/USD",
  lotSize: "0",
  contractSize: "100,000",
  basePair: "",
  baseCrossRate: "1.00",
  quotePair: "",
  quoteCrossRate: "1.00",
  entryPrice: "0",
  exitPrice: "0",
  isLong: true,
  includeTradingFee: false,
  feeTyp: FeeTyp.COMMISSION_PER_LOT,
  estTradingFee: "0",
  swapPerLot: "0",
  period: "0",
  pipDecimal: "0.0001",
  precision: 2,
};

const ProfitLossForm = () => {
  const supportedAssets = useSelector(selectForexSupportedAssets);
  const supportedCurrencies = useSelector(selectForexSupportedCurrencies);
  const currencyRates = useSelector(selectForexCurrencyRates);
  const commodityRates = useSelector(selectForexCommodityRates);
  const isLoading = useSelector(selectForexIsLoading);

  const [errorMessage, setErrorMessage] = useState("");
  const [errorField, setErrorField] = useState<ERROR_FIELD_PROFIT_LOSS | null>(
    null
  );
  const [input, setInput] = useState<ProfitLossInputType>(DEFAULT_INPUT);
  const [result, setResult] = useState<ProfitLossResultType | null>(null);
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
    const { err, field } = validateProfitLossInput(input);
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
      isLong: prev.isLong,
      accBaseCurrency: prev.accBaseCurrency,
      currencyPair: prev.currencyPair,
      includeTradingFee: prev.includeTradingFee,
      feeTyp: prev.feeTyp,
      basePair: prev.basePair,
      baseCrossRate: prev.baseCrossRate,
      quotePair: prev.quotePair,
      quoteCrossRate: prev.quoteCrossRate,
      pipDecimal: `${supportedAssets[prev.currencyPair].pip}`,
      contractSize: supportedAssets[prev.currencyPair].lot,
    }));
    setErrorField(null);
    setResult(null);
  };

  const crossRateStyles = useSpring({
    height: calculateCrossHeight(input),
    opacity: calculateCrossHeight(input) === 0 ? 0 : 1,
    overflow: "hidden",
  });

  const tradingFeeStyles = useSpring({
    height: input.includeTradingFee ? 395 : 0,
    opacity: input.includeTradingFee ? 1 : 0,
    overflow: "hidden",
  });

  const baseCrossRateOnChange = useCallback(
    (pair: string, rate: string) =>
      setInput((prev) => ({ ...prev, basePair: pair, baseCrossRate: rate })),
    []
  );

  const quoteCrossRateOnChange = useCallback(
    (pair: string, rate: string) =>
      setInput((prev) => ({ ...prev, quotePair: pair, quoteCrossRate: rate })),
    []
  );

  return (
    <form className={styles["form-wrapper"]} onSubmit={handleSubmit}>
      <p className={styles["description"]}>
        This calculator helps you determine the profit or loss from your forex
        trades. It calculates the total gain or loss in your account currency
        and shows the pip difference between entry and exit prices — allowing
        you to assess trade performance, verify returns, and plan future
        positions effectively.
      </p>

      <div className={styles["switch-wrapper"]}>
        <Switch
          height={33}
          borderRadius={20}
          childWidth={161}
          names={["Long", "Short"]}
          defaultIndex={0}
          onSwitch={(idx: number) => {
            setInput((prev) => ({ ...prev, isLong: idx === 0 }));
          }}
        />
      </div>

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
              <span className={styles["label"]}>Cross Rate</span>

              <CrossRateInput
                accBaseCurrency={input.accBaseCurrency}
                crossTyp="BASE"
                mode="PROFIT_LOSS"
                isLoading={
                  isLoading[FOREX_LOADING_TYPES.GET_COMMODITY_RATE] &&
                  isLoading[FOREX_LOADING_TYPES.GET_CURRENCY_RATE]
                }
                isInvalid={
                  errorField === ERROR_FIELD_PROFIT_LOSS.BASE_CROSS_RATE
                }
                pair={input.currencyPair}
                currencyRate={currencyRates}
                commodityRate={commodityRates}
                includeTradingFee={input.includeTradingFee}
                feeTyp={input.feeTyp}
                onChange={baseCrossRateOnChange}
              />

              <CrossRateInput
                accBaseCurrency={input.accBaseCurrency}
                crossTyp="QUOTE"
                mode="PROFIT_LOSS"
                isLoading={
                  isLoading[FOREX_LOADING_TYPES.GET_COMMODITY_RATE] &&
                  isLoading[FOREX_LOADING_TYPES.GET_CURRENCY_RATE]
                }
                isInvalid={
                  errorField === ERROR_FIELD_PROFIT_LOSS.QUOTE_CROSS_RATE
                }
                pair={input.currencyPair}
                currencyRate={currencyRates}
                commodityRate={commodityRates}
                onChange={quoteCrossRateOnChange}
              />
            </div>
          </div>
        </animated.div>

        <div className={styles["form-group"]}>
          <label htmlFor="lot-size">Lot Size</label>
          <NumberInput
            id="lot-size"
            step={1}
            isInvalid={errorField === ERROR_FIELD_PROFIT_LOSS.LOT_SIZE}
            minDecimalPlace={0}
            maxDecimalPlace={3}
            value={input.lotSize}
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, lotSize: val }))
            }
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="contract-size">Contract Size (Unit)</label>
          <NumberInput
            id="contract-size"
            step={1}
            isInvalid={errorField === ERROR_FIELD_PROFIT_LOSS.CONTRACT_SIZE}
            minDecimalPlace={0}
            maxDecimalPlace={0}
            value={input.contractSize}
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, contractSize: val }))
            }
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="pip-decimal">Pip in Decimals</label>
          <NumberInput
            id="pip-decimal"
            step={0.0001}
            maxLength={10}
            isInvalid={errorField === ERROR_FIELD_PROFIT_LOSS.PIP_DECIMAL}
            minDecimalPlace={0}
            maxDecimalPlace={5}
            value={input.pipDecimal}
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, pipDecimal: val }))
            }
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="open-price">Open Price</label>
          <NumberInput
            id="open-price"
            step={input.pipDecimal}
            preUnit="$"
            isInvalid={errorField === ERROR_FIELD_PROFIT_LOSS.OPEN_PRICE}
            minDecimalPlace={2}
            maxDecimalPlace={5}
            value={input.entryPrice}
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, entryPrice: val }))
            }
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="close-price">Close Price</label>
          <NumberInput
            id="close-price"
            step={input.pipDecimal}
            preUnit="$"
            isInvalid={errorField === ERROR_FIELD_PROFIT_LOSS.EXIT_PRICE}
            minDecimalPlace={2}
            maxDecimalPlace={5}
            value={input.exitPrice}
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, exitPrice: val }))
            }
          />
        </div>

        <div
          className={styles["form-group"]}
          style={{
            marginTop: "2rem",
            marginBottom: input.includeTradingFee ? "1.5rem" : "0.6rem",
          }}
        >
          <div className={styles["checkbox-wrapper"]}>
            <Checkbox
              id="fee-check"
              isCheck={input.includeTradingFee}
              onCheck={() =>
                setInput((prev) => ({
                  ...prev,
                  includeTradingFee: !input.includeTradingFee,
                  feeTyp: DEFAULT_INPUT.feeTyp,
                  estTradingFee: "0",
                  swapFee: "0",
                  period: "0",
                }))
              }
            />
            <span
              className={styles["checkbox-label"]}
              onClick={() =>
                setInput((prev) => ({
                  ...prev,
                  includeTradingFee: !input.includeTradingFee,
                  feeTyp: DEFAULT_INPUT.feeTyp,
                  estTradingFee: "0",
                  swapFee: "0",
                  period: "0",
                }))
              }
            >
              Include Commission Fee
            </span>
          </div>
        </div>

        <animated.div style={tradingFeeStyles}>
          {input.includeTradingFee && (
            <>
              <div className={styles["form-group"]}>
                <span className={styles["label"]}>Fee Type</span>
                <SelectBox
                  id="fee-type"
                  options={[
                    "Commission fee per lot per side",
                    "Commission fee per $100k traded per side",
                  ]}
                  defaultIndex={DEFAULT_INPUT.feeTyp}
                  onChangeHandler={(idx) => {
                    setInput((prev) => ({
                      ...prev,
                      feeTyp: idx,
                      estTradingFee: "0",
                    }));
                    if (
                      errorField === ERROR_FIELD_PROFIT_LOSS.EST_TRADING_FEE
                    ) {
                      setErrorField(null);
                      setErrorMessage("");
                    }
                  }}
                />
              </div>

              <div className={styles["form-group"]}>
                <label htmlFor="estimated-fee">
                  Commission Fee ({input.accBaseCurrency})
                </label>

                <NumberInput
                  id="estimated-fee"
                  step={0.1}
                  preUnit="$"
                  isInvalid={
                    errorField === ERROR_FIELD_PROFIT_LOSS.EST_TRADING_FEE
                  }
                  minDecimalPlace={2}
                  maxDecimalPlace={5}
                  value={input.estTradingFee}
                  onChangeHandler={(val) =>
                    setInput((prev) => ({ ...prev, estTradingFee: val }))
                  }
                />
              </div>

              <div className={styles["form-group"]}>
                <label htmlFor="swap-fee">
                  Total Swap {input.isLong ? "Long" : "Short"} (
                  {getBaseAndQuote(input.currencyPair).quote})
                </label>

                <NumberInput
                  id="swap-fee"
                  step={0.1}
                  preUnit="$"
                  isInvalid={
                    errorField === ERROR_FIELD_PROFIT_LOSS.SWAP_PER_LOT
                  }
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
                <div className={styles["input-with-switch"]}>
                  <NumberInput
                    id="period"
                    isInvalid={errorField === ERROR_FIELD_PROFIT_LOSS.PERIOD}
                    minDecimalPlace={0}
                    maxDecimalPlace={0}
                    value={input.period}
                    onChangeHandler={(val) =>
                      setInput((prev) => ({ ...prev, period: val }))
                    }
                  />
                </div>
              </div>
            </>
          )}
        </animated.div>

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
                defaultIndex={input.precision}
                onChangeHandler={(idx) =>
                  setInput((prev) => {
                    const data = {
                      ...prev,
                      precision: idx,
                    };

                    setResult(calculateResult(data));
                    return data;
                  })
                }
              />
            </div>
            <Container
              className={`${styles["result-container"]} ${styles["profit-loss"]}`}
            >
              <div className={styles["result-wrapper"]}>
                <div className={styles["row"]}>
                  <div>Open Price:</div>
                  <div>${convertToLocaleString(result.entryPrice)}</div>
                </div>

                <div className={styles["row"]}>
                  <div>Close Price:</div>
                  <div>${convertToLocaleString(result.exitPrice)}</div>
                </div>

                <div className={styles["row"]}>
                  <div>Pip Size:</div>
                  <div>{convertToLocaleString(absBig(result.pipSize))} PIP</div>
                </div>

                <div className={styles["row"]}>
                  <div>Position Size:</div>
                  <div>{convertToLocaleString(result.positionSize, 0, 0)}</div>
                </div>

                {result.entryFee !== undefined && (
                  <>
                    <br />
                    <div className={styles["row"]}>
                      <div>Entry Fee:</div>
                      <div>
                        $
                        {convertToLocaleString(
                          result.entryFee,
                          input.precision,
                          input.precision
                        )}{" "}
                        {result.accBaseCurrency}
                      </div>
                    </div>
                  </>
                )}

                {result.exitFee !== undefined && (
                  <div className={styles["row"]}>
                    <div>Closing Fee:</div>
                    <div>
                      $
                      {convertToLocaleString(
                        result.exitFee,
                        input.precision,
                        input.precision
                      )}{" "}
                      {result.accBaseCurrency}
                    </div>
                  </div>
                )}

                {result.swapValue !== undefined && (
                  <div className={styles["row"]}>
                    <div>Swap Value:</div>
                    <div>
                      {mathBigNum.largerEq(result.swapValue, 0) ? "" : "-"}$
                      {convertToLocaleString(
                        absBig(result.swapValue),
                        input.precision,
                        input.precision
                      )}{" "}
                      {result.accBaseCurrency}
                    </div>
                  </div>
                )}

                <br />
                <div className={styles["row"]}>
                  <div>
                    {result.includeTradingFee ? "Gross" : "Total"}{" "}
                    {mathBigNum.largerEq(result.grossGained, 0)
                      ? "Gain"
                      : "Loss"}
                    :
                  </div>
                  <div>
                    {mathBigNum.largerEq(result.grossGained, 0) ? "" : "-"}$
                    {convertToLocaleString(
                      absBig(result.grossGained),
                      input.precision,
                      input.precision
                    )}{" "}
                    {result.accBaseCurrency}
                  </div>
                </div>

                {result.netGained !== undefined && (
                  <div className={styles["row"]}>
                    <div>
                      Net{" "}
                      {mathBigNum.largerEq(result.netGained, 0)
                        ? "Gain"
                        : "Loss"}
                      :
                    </div>
                    <div>
                      {mathBigNum.largerEq(result.netGained, 0) ? "" : "-"}$
                      {convertToLocaleString(
                        absBig(result.netGained),
                        input.precision,
                        input.precision
                      )}{" "}
                      {result.accBaseCurrency}
                    </div>
                  </div>
                )}
              </div>
            </Container>
          </>
        )}
      </div>
    </form>
  );
};

export default ProfitLossForm;
