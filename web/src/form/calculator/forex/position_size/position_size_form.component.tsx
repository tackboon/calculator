import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  calculateProfitHeight,
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
import PipInputBox from "../../../../component/forex/pip_input_box/pip.component";
import { FeeTyp, ProfitGoalTyp } from "../forex_calculator_form.type";
import LotTypSelectBox, {
  LotTyp,
} from "../../../../component/forex/lot_typ_input_box/lot_typ.component";

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
  openPrice: "0",
  stopLoss: "0",
  isStopLossPip: false,
  includeProfitGoal: false,
  profitGoal: "0",
  profitGoalTyp: ProfitGoalTyp.PRICE_BASED,
  isProfitPip: false,
  isLong: true,
  includeTradingFee: false,
  feeTyp: FeeTyp.COMMISSION_PER_LOT,
  estTradingFee: "0",
  swapFee: "0",
  period: "0",
  leverage: 100,
  pipSize: 0.0001,
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
  const [resetSignal, setResetSignal] = useState(false);

  const [result, setResult] = useState<PositionSizeResultType | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Fetch currency rates
  useCurrencyRates(input.accBaseCurrency);

  // Fetch commodity rates
  useCommodityRates();

  // Submit handler
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Handle validation
    const { err, field } = validatePositionSizeInput(input);
    setErrorMessage(err);
    setErrorField(field);
    if (err !== "") return;

    // Handle calculation
    console.log(input);
    calculateResult(input);
    // setResult(calculateResult(input));
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
      pipSize: prev.pipSize,
      precision: prev.precision,
      isStopLossPip: prev.isStopLossPip,
      isProfitPip: prev.isProfitPip,
    }));
    setResetSignal((prev) => !prev);
    setErrorField(null);
    setResult(null);
  };

  const crossRateStyles = useSpring({
    height: calculateCrossHeight(input),
    opacity: input.quotePair === "" ? 0 : 1,
    overflow: "hidden",
  });

  const profitGoalStyles = useSpring({
    height: calculateProfitHeight(input),
    opacity: input.includeProfitGoal ? 1 : 0,
    overflow: "hidden",
  });

  const tradingFeeStyles = useSpring({
    height: input.includeTradingFee ? 395 : 0,
    opacity: input.includeTradingFee ? 1 : 0,
    overflow: "hidden",
  });

  const stopLossOnChange = useCallback(
    (val: string, isPip: boolean) =>
      setInput((prev) => ({ ...prev, stopLoss: val, isStopLossPip: isPip })),
    []
  );

  const profitGoalOnChange = useCallback(
    (val: string, isPip: boolean) =>
      setInput((prev) => ({ ...prev, profitGoal: val, isProfitPip: isPip })),
    []
  );

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
        This calculator helps you to determine the optimal position size and
        stop-loss price for your trades. By inputting parameters such as total
        capital, maximum allowable loss, stop-loss percentage, profit ratio, and
        trade-in price, the calculator computes position size, stop price, and
        profit target for you.
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
          <label htmlFor="acc-base-currency">Account Currency</label>
          <CurrencySelectBox
            name="acc-base-currency"
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
          <label htmlFor="currency-pair">Currency Pair</label>
          <PairSelectBox
            name="currency-pair"
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
              <label>Cross Rate</label>

              <CrossRateInput
                accBaseCurrency={input.accBaseCurrency}
                crossTyp="BASE"
                isLoading={
                  isLoading[FOREX_LOADING_TYPES.GET_COMMODITY_RATE] &&
                  isLoading[FOREX_LOADING_TYPES.GET_CURRENCY_RATE]
                }
                isInvalid={
                  errorField === ERROR_FIELD_POSITION_SIZE.BASE_CROSS_RATE
                }
                pair={input.currencyPair}
                includeTradingFee={input.includeTradingFee}
                feeTyp={input.feeTyp}
                currencyRate={currencyRates}
                commodityRate={commodityRates}
                onChange={baseCrossRateOnChange}
              />

              <CrossRateInput
                accBaseCurrency={input.accBaseCurrency}
                crossTyp="QUOTE"
                isLoading={
                  isLoading[FOREX_LOADING_TYPES.GET_COMMODITY_RATE] &&
                  isLoading[FOREX_LOADING_TYPES.GET_CURRENCY_RATE]
                }
                isInvalid={
                  errorField === ERROR_FIELD_POSITION_SIZE.QUOTE_CROSS_RATE
                }
                pair={input.currencyPair}
                includeTradingFee={input.includeTradingFee}
                feeTyp={input.feeTyp}
                currencyRate={currencyRates}
                commodityRate={commodityRates}
                onChange={quoteCrossRateOnChange}
              />
            </div>
          </div>
        </animated.div>

        <div className={styles["form-group"]}>
          <label htmlFor="leverage">Leverage for Margin</label>
          <LeverageSelectBox
            name="leverage"
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
          <label htmlFor="lot-size">Lot Size</label>
          <LotTypSelectBox
            name="lot-size"
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
          <label htmlFor="open-price">Open Price</label>
          <NumberInput
            id="open-price"
            step={input.pipSize}
            preUnit="$"
            isInvalid={errorField === ERROR_FIELD_POSITION_SIZE.OPEN_PRICE}
            minDecimalPlace={2}
            maxDecimalPlace={5}
            value={input.openPrice}
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, openPrice: val }))
            }
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="stop-loss">Stop Loss</label>
          <PipInputBox
            id="stop-loss"
            defaultIsPip={false}
            defaultValue={DEFAULT_INPUT.stopLoss}
            pipSize={input.pipSize}
            isInvalid={errorField === ERROR_FIELD_POSITION_SIZE.STOP_LOSS}
            hintPrefix="Stop Loss Price: $"
            price={input.openPrice}
            isIncr={!input.isLong}
            resetSignal={resetSignal}
            onChange={stopLossOnChange}
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
            <span>Include Profit Goal</span>
          </div>
        </div>

        <animated.div style={profitGoalStyles}>
          {input.includeProfitGoal && (
            <>
              <div className={styles["form-group"]}>
                <label htmlFor="profit-strategy">Profit Strategy</label>
                <SelectBox
                  name="profit-strategy"
                  options={["Price-Based", "Portfolio-Based"]}
                  defaultIndex={ProfitGoalTyp.PRICE_BASED}
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
                <PipInputBox
                  id="profit-goal"
                  defaultIsPip={false}
                  defaultValue={DEFAULT_INPUT.profitGoal}
                  pipSize={input.pipSize}
                  isInvalid={
                    errorField === ERROR_FIELD_POSITION_SIZE.PROFIT_TARGET
                  }
                  hintPrefix="Profit Goal Price: $"
                  price={input.openPrice}
                  isIncr={input.isLong}
                  resetSignal={resetSignal}
                  onChange={profitGoalOnChange}
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
              isCheck={input.includeTradingFee}
              onCheck={() => {
                setInput((prev) => ({
                  ...prev,
                  includeTradingFee: !input.includeTradingFee,
                  feeTyp: DEFAULT_INPUT.feeTyp,
                  estTradingFee: "0",
                  swapFee: "0",
                  period: "0",
                }));
              }}
            />
            <span>Include Commission Fee</span>
          </div>
        </div>

        <animated.div style={tradingFeeStyles}>
          {input.includeTradingFee && (
            <>
              <div className={styles["form-group"]}>
                <label htmlFor="fee-type">Fee Type</label>
                <SelectBox
                  name="fee-type"
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
                <label htmlFor="swap-fee">
                  Total Swap {input.isLong ? "Long" : "Short"} (
                  {getBaseAndQuote(input.currencyPair).quote})
                </label>

                <NumberInput
                  id="swap-fee"
                  step={0.1}
                  preUnit="$"
                  isInvalid={errorField === ERROR_FIELD_POSITION_SIZE.SWAP_FEE}
                  minDecimalPlace={2}
                  maxDecimalPlace={5}
                  value={input.swapFee}
                  onChangeHandler={(val) =>
                    setInput((prev) => ({ ...prev, swapFee: val }))
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
    </form>
  );
};

export default ForexPositionSizeForm;
