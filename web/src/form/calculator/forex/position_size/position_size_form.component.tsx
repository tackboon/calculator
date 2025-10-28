import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useSpring, animated } from "@react-spring/web";

import styles from "../forex_calculator_form.module.scss";
import {
  selectForexCommodityRates,
  selectForexCurrencyRates,
  selectForexIsLoading,
  selectForexSupportedAssets,
  selectForexSupportedCurrencies,
} from "../../../../store/forex/forex.selector";
import NumberInput from "../../../../component/common/input/number_input.component";
import Switch from "../../../../component/common/switch/switch.component";
import SelectBox from "../../../../component/common/select_box/select_box.component";
import Button from "../../../../component/common/button/button.component";
import { getBaseAndQuote } from "../../../../common/forex/forex";
import { FOREX_LOADING_TYPES } from "../../../../store/forex/forex.types";
import Checkbox from "../../../../component/common/checkbox/checkbox.component";
import {
  calculateCrossHeight,
  calculateResult,
  validatePositionSizeInput,
} from "./utils.component";
import {
  ERROR_FIELD_POSITION_SIZE,
  ForexPositionSizeInputType,
  PositionSizeResultType,
} from "./position_size.type";
import LeverageSelectBox from "../../../../component/forex/leverage_select_box/leverage.component";
import CurrencySelectBox from "../../../../component/forex/currency_select_box/currency.component";
import PairSelectBox from "../../../../component/forex/pair_select_box/pair.component";
import useCurrencyRates from "../hook/useCurrencyRates";
import useCommodityRates from "../hook/useCommodityRates";
import CrossRateInput from "../../../../component/forex/cross_rate_input_box/cross.component";
import { FeeTyp, ProfitGoalTyp } from "../forex_calculator_form.type";
import LotTypSelectBox, {
  LotTyp,
} from "../../../../component/forex/lot_typ_input_box/lot_typ.component";
import DefaultSelect from "../../../../component/common/select_box/default_select_box.component";
import Container from "../../../../component/common/container/container.component";
import { convertToLocaleString } from "../../../../common/number/number";
import { convertRatioToString } from "../../../../common/common";
import { absBig, mathBigNum } from "../../../../common/number/math";

const DEFAULT_INPUT: ForexPositionSizeInputType = {
  portfolioCapital: "0",
  maxPortfolioRisk: "0",
  accBaseCurrency: "USD",
  currencyPair: "EUR/USD",
  lotTyp: LotTyp.MICRO_LOT,
  contractSize: "100,000",
  basePair: "",
  baseCrossRate: "1.00",
  quotePair: "",
  quoteCrossRate: "1.00",
  stopPip: "0",
  includeProfitGoal: false,
  profitGoal: "0",
  profitGoalTyp: ProfitGoalTyp.PIP_BASED,
  isLong: true,
  includeTradingFee: false,
  feeTyp: FeeTyp.COMMISSION_PER_LOT,
  estTradingFee: "0",
  swapPerLot: "0",
  period: "0",
  leverage: 100,
  pipDecimal: "0.0001",
  precision: 2,
};

const ForexPositionSizeForm = () => {
  const supportedAssets = useSelector(selectForexSupportedAssets);
  const supportedCurrencies = useSelector(selectForexSupportedCurrencies);
  const currencyRates = useSelector(selectForexCurrencyRates);
  const commodityRates = useSelector(selectForexCommodityRates);
  const isLoading = useSelector(selectForexIsLoading);

  const [errorMessage, setErrorMessage] = useState("");
  const [errorField, setErrorField] =
    useState<ERROR_FIELD_POSITION_SIZE | null>(null);
  const [input, setInput] = useState<ForexPositionSizeInputType>(DEFAULT_INPUT);

  const [result, setResult] = useState<PositionSizeResultType | null>(null);
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

  // Submit handler
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Handle validation
    const { err, field } = validatePositionSizeInput(input);
    setErrorMessage(err);
    setErrorField(field);
    if (err !== "") return;

    // Handle calculation
    setResult(calculateResult(input));
  };

  const handleReset = (e: FormEvent) => {
    e.preventDefault();

    setErrorMessage("");
    setInput((prev) => ({
      ...DEFAULT_INPUT,
      isLong: prev.isLong,
      accBaseCurrency: prev.accBaseCurrency,
      currencyPair: prev.currencyPair,
      includeProfitGoal: prev.includeProfitGoal,
      profitGoalTyp: prev.profitGoalTyp,
      includeTradingFee: prev.includeTradingFee,
      feeTyp: prev.feeTyp,
      leverage: prev.leverage,
      lotTyp: prev.lotTyp,
      basePair: prev.basePair,
      baseCrossRate: prev.baseCrossRate,
      quotePair: prev.quotePair,
      quoteCrossRate: prev.quoteCrossRate,
      pipDecimal: `${supportedAssets[prev.currencyPair].pip}`,
      contractSize: supportedAssets[prev.currencyPair].lot,
      precision: prev.precision,
    }));
    setErrorField(null);
    setResult(null);
  };

  const crossRateStyles = useSpring({
    height: calculateCrossHeight(input),
    opacity: calculateCrossHeight(input) === 0 ? 0 : 1,
    overflow: "hidden",
  });

  const profitGoalStyles = useSpring({
    height: input.includeProfitGoal ? 200 : 0,
    opacity: input.includeProfitGoal ? 1 : 0,
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
    <form
      id="forex-position"
      className={styles["form-wrapper"]}
      onSubmit={handleSubmit}
    >
      <p className={styles["description"]}>
        This calculator helps you determine the optimal trade size based on your
        risk tolerance. It calculates the ideal position size for effective risk
        management and can also estimate the profit target based on your inputs.
      </p>

      <div className={styles["switch-wrapper"]}>
        <Switch
          height={33}
          borderRadius={20}
          childWidth={161}
          names={["Long", "Short"]}
          defaultIndex={0}
          onSwitch={(idx: number) =>
            setInput((prev) => ({ ...prev, isLong: idx === 0 }))
          }
        />
      </div>

      <div>
        <div className={styles["form-group"]}>
          <label htmlFor="portfolio-capital">Portfolio Capital</label>
          <NumberInput
            id="portfolio-capital"
            preUnit="$"
            isInvalid={
              errorField === ERROR_FIELD_POSITION_SIZE.PORTFOLIO_CAPITAL
            }
            minDecimalPlace={2}
            maxDecimalPlace={5}
            value={input.portfolioCapital}
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, portfolioCapital: val }))
            }
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="max-portfolio-risk">Max Portfolio Risk (%)</label>
          <NumberInput
            step={0.1}
            id="max-portfolio-risk"
            minDecimalPlace={2}
            maxDecimalPlace={5}
            postUnit="%"
            isInvalid={
              errorField === ERROR_FIELD_POSITION_SIZE.MAX_PORTFOLIO_RISK
            }
            value={input.maxPortfolioRisk}
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, maxPortfolioRisk: val }))
            }
          />
        </div>

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
                mode="POSITION_SIZE"
                isLoading={
                  isLoading[FOREX_LOADING_TYPES.GET_COMMODITY_RATE] &&
                  isLoading[FOREX_LOADING_TYPES.GET_CURRENCY_RATE]
                }
                isInvalid={
                  errorField === ERROR_FIELD_POSITION_SIZE.BASE_CROSS_RATE
                }
                pair={input.currencyPair}
                currencyRate={currencyRates}
                commodityRate={commodityRates}
                onChange={baseCrossRateOnChange}
              />

              <CrossRateInput
                accBaseCurrency={input.accBaseCurrency}
                crossTyp="QUOTE"
                mode="POSITION_SIZE"
                isLoading={
                  isLoading[FOREX_LOADING_TYPES.GET_COMMODITY_RATE] &&
                  isLoading[FOREX_LOADING_TYPES.GET_CURRENCY_RATE]
                }
                isInvalid={
                  errorField === ERROR_FIELD_POSITION_SIZE.QUOTE_CROSS_RATE
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
          <span className={styles["label"]}>Lot Type</span>
          <LotTypSelectBox
            id="lot-size"
            defaultIndex={LotTyp.MICRO_LOT}
            onChange={(lotTyp) => {
              setInput((prev) => ({
                ...prev,
                lotTyp,
              }));
            }}
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="contract-size">Contract Size (Unit)</label>
          <NumberInput
            id="contract-size"
            step={1}
            isInvalid={errorField === ERROR_FIELD_POSITION_SIZE.CONTRACT_SIZE}
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
            isInvalid={errorField === ERROR_FIELD_POSITION_SIZE.PIP_DECIMAL}
            minDecimalPlace={0}
            maxDecimalPlace={5}
            value={input.pipDecimal}
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, pipDecimal: val }))
            }
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="stop-loss">Stop Loss</label>
          <NumberInput
            id="stop-loss"
            step={1}
            postUnit="PIP"
            isInvalid={errorField === ERROR_FIELD_POSITION_SIZE.STOP_LOSS}
            minDecimalPlace={0}
            maxDecimalPlace={0}
            value={input.stopPip}
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, stopPip: val }))
            }
          />
        </div>

        <div
          className={styles["form-group"]}
          style={{
            marginTop: "2rem",
            marginBottom: input.includeProfitGoal ? "1.5rem" : "0.6rem",
          }}
        >
          <div className={styles["checkbox-wrapper"]}>
            <Checkbox
              id="profit-check"
              isCheck={input.includeProfitGoal}
              onCheck={() =>
                setInput((prev) => ({
                  ...prev,
                  includeProfitGoal: !prev.includeProfitGoal,
                  profitGoal: DEFAULT_INPUT.profitGoal,
                  profitGoalTyp: DEFAULT_INPUT.profitGoalTyp,
                }))
              }
            />
            <span
              className={styles["checkbox-label"]}
              onClick={() =>
                setInput((prev) => ({
                  ...prev,
                  includeProfitGoal: !prev.includeProfitGoal,
                  profitGoal: DEFAULT_INPUT.profitGoal,
                  profitGoalTyp: DEFAULT_INPUT.profitGoalTyp,
                }))
              }
            >
              Include Profit Goal
            </span>
          </div>
        </div>

        <animated.div style={profitGoalStyles}>
          {input.includeProfitGoal && (
            <>
              <div className={styles["form-group"]}>
                <span className={styles["label"]}>Profit Strategy</span>
                <SelectBox
                  id="profit-strategy"
                  options={["Pip-Based", "Portfolio-Based"]}
                  defaultIndex={ProfitGoalTyp.PIP_BASED}
                  onChangeHandler={(idx) => {
                    setInput((prev) => ({
                      ...prev,
                      profitGoalTyp: idx,
                      profitGoal: "0",
                    }));
                    if (
                      errorField === ERROR_FIELD_POSITION_SIZE.PROFIT_TARGET
                    ) {
                      setErrorField(null);
                      setErrorMessage("");
                    }
                  }}
                />
              </div>

              <div className={styles["form-group"]}>
                <label htmlFor="profit-goal">
                  {input.profitGoalTyp === ProfitGoalTyp.PORTFOLIO_BASED
                    ? "Min Portfolio Profit (%)"
                    : "Profit Target"}
                </label>
                <NumberInput
                  id="profit-goal"
                  step={1}
                  postUnit={
                    input.profitGoalTyp === ProfitGoalTyp.PIP_BASED
                      ? "PIP"
                      : "%"
                  }
                  isInvalid={
                    errorField === ERROR_FIELD_POSITION_SIZE.PROFIT_TARGET
                  }
                  minDecimalPlace={
                    input.profitGoalTyp === ProfitGoalTyp.PIP_BASED ? 0 : 2
                  }
                  maxDecimalPlace={
                    input.profitGoalTyp === ProfitGoalTyp.PIP_BASED ? 0 : 5
                  }
                  value={input.profitGoal}
                  onChangeHandler={(val) =>
                    setInput((prev) => ({ ...prev, profitGoal: val }))
                  }
                />
              </div>
            </>
          )}
        </animated.div>

        <div
          className={styles["form-group"]}
          style={{
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
                <span className={styles[".label"]}>Fee Type</span>
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
                      errorField === ERROR_FIELD_POSITION_SIZE.EST_TRADING_FEE
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
                    errorField === ERROR_FIELD_POSITION_SIZE.EST_TRADING_FEE
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
                <label htmlFor="swap-per-lot">
                  Total Swap {input.isLong ? "Long" : "Short"} (
                  {getBaseAndQuote(input.currencyPair).quote})
                </label>

                <NumberInput
                  id="swap-per-lot"
                  step={0.01}
                  preUnit="$"
                  isInvalid={
                    errorField === ERROR_FIELD_POSITION_SIZE.SWAP_PER_LOT
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
                    isInvalid={errorField === ERROR_FIELD_POSITION_SIZE.PERIOD}
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
              className={`${styles["result-container"]} ${styles["position-size"]}`}
            >
              <div className={styles["result-wrapper"]}>
                <div className={styles["row"]}>
                  <div>Stop Loss (pips):</div>
                  <div>{convertToLocaleString(result.stopPip, 0)}</div>
                </div>

                {result.profitPip !== undefined && (
                  <div className={styles["row"]}>
                    <div>Profit (pips):</div>
                    <div>{convertToLocaleString(result.profitPip, 0)}</div>
                  </div>
                )}

                <div className={styles["row"]}>
                  <div>Lot Size:</div>
                  <div>{convertToLocaleString(result.lotSize, 0)}</div>
                </div>

                <div className={styles["row"]}>
                  <div>Position Size:</div>
                  <div>{convertToLocaleString(result.positionSize, 0)}</div>
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

                {result.stopFee !== undefined && (
                  <div className={styles["row"]}>
                    <div>Stop Loss Execution Fee:</div>
                    <div>
                      $
                      {convertToLocaleString(
                        result.stopFee,
                        input.precision,
                        input.precision
                      )}{" "}
                      {result.accBaseCurrency}
                    </div>
                  </div>
                )}

                {result.profitFee !== undefined && (
                  <div className={styles["row"]}>
                    <div>Profit-Taking Fee:</div>
                    <div>
                      $
                      {convertToLocaleString(
                        result.profitFee,
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
                  <div>Margin To Hold:</div>
                  <div>
                    $
                    {convertToLocaleString(
                      result.marginToHold,
                      input.precision,
                      input.precision
                    )}{" "}
                    {result.accBaseCurrency}
                  </div>
                </div>

                <div className={styles["row"]}>
                  <div>Risk Amount:</div>
                  <div>
                    $
                    {convertToLocaleString(
                      result.riskAmount,
                      input.precision,
                      input.precision
                    )}{" "}
                    {result.accBaseCurrency}
                  </div>
                </div>

                <div className={styles["row"]}>
                  <div>Portfolio Risk (%):</div>
                  <div>
                    {convertToLocaleString(
                      result.portfolioRisk,
                      input.precision,
                      input.precision
                    )}
                    %
                  </div>
                </div>

                {result.profitAmount !== undefined && (
                  <div className={styles["row"]}>
                    <div>Potential Profit:</div>
                    <div>
                      $
                      {convertToLocaleString(
                        result.profitAmount,
                        input.precision,
                        input.precision
                      )}{" "}
                      {result.accBaseCurrency}
                    </div>
                  </div>
                )}

                {result.portfolioProfit !== undefined && (
                  <div className={styles["row"]}>
                    <div>Potential Portfolio Return (%):</div>
                    <div>
                      {convertToLocaleString(
                        result.portfolioProfit,
                        input.precision
                      )}
                      %
                    </div>
                  </div>
                )}

                {result.riskRewardRatio && (
                  <>
                    <br />
                    <div className={styles["row"]}>
                      <div>Risk/Reward Ratio:</div>
                      <div>
                        {convertRatioToString(
                          result.riskRewardRatio,
                          input.precision
                        )}
                      </div>
                    </div>
                  </>
                )}

                {result.breakEvenWinRate && (
                  <div className={styles["row"]}>
                    <div>Breakeven Win Rate:</div>
                    <div>
                      {convertToLocaleString(
                        result.breakEvenWinRate,
                        input.precision,
                        input.precision
                      )}
                      %
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

export default ForexPositionSizeForm;
