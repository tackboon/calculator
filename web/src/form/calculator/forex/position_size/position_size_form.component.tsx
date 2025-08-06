import { FormEvent, useEffect, useRef, useState } from "react";
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
import {
  generateCurrencyPair,
  getBaseAndQuote,
} from "../../../../common/forex/forex";
import { FOREX_LOADING_TYPES } from "../../../../store/forex/forex.types";
import { parseNumberFromString } from "../../../../common/number/number";
import Checkbox from "../../../../component/common/checkbox/checkbox.component";
import {
  calculateCrossHeight,
  calculateResult,
  validatePositionSizeInput,
} from "./utils.component";
import {
  ERROR_FIELD_POSITION_SIZE,
  FeeTyp,
  ForexPositionSizeInputType,
  PositionSizeResultType,
  ProfitGoalTyp,
  StopLossTyp,
} from "./position_size.type";
import LeverageSelectBox from "../../../../component/forex/leverage_select_box/leverage.component";
import CurrencySelectBox from "../../../../component/forex/currency_select_box/currency.component";
import PairSelectBox from "../../../../component/forex/pair_select_box/pair.component";
import useCurrencyRates from "../hook/useCurrencyRates";
import useCommodityRates from "../hook/useCommodityRates";

const DEFAULT_INPUT: ForexPositionSizeInputType = {
  portfolioCapital: "0",
  maxPortfolioRisk: "0",
  accBaseCurrency: "USD",
  currencyPair: "EUR/USD",
  contractSize: "100,000",
  usdAccPair: "",
  usdAccCrossRate: "1.00",
  usdBasePair: "",
  usdBaseCrossRate: "1.00",
  usdQuotePair: "",
  usdQuoteCrossRate: "1.00",
  basePair: "",
  baseCrossRate: "1.00",
  quotePair: "",
  quoteCrossRate: "1.00",
  openPrice: "0",
  stopLoss: "0",
  stopLossTyp: StopLossTyp.PRICE_BASED,
  includeProfitGoal: false,
  profitGoal: "0",
  profitGoalTyp: ProfitGoalTyp.PRICE_BASED,
  isLong: true,
  includeTradingFee: false,
  feeTyp: FeeTyp.COMMISSION_PER_LOT,
  estTradingFee: "0",
  swapFee: "0",
  leverage: 100,
  pipSize: 0.0001,
};

const ForexPositionSizeForm = () => {
  const dispatch = useDispatch();
  const supportedAssets = useSelector(selectForexSupportedAssets);
  const supportedCurrencies = useSelector(selectForexSupportedCurrencies);
  const baseCurrencyRate = useSelector(selectForexCurrencyRates);
  const usdCommodityRate = useSelector(selectForexCommodityRates);
  const isLoading = useSelector(selectForexIsLoading);

  const [errorMessage, setErrorMessage] = useState("");
  const [errorField, setErrorField] =
    useState<ERROR_FIELD_POSITION_SIZE | null>(null);
  const [input, setInput] = useState<ForexPositionSizeInputType>(DEFAULT_INPUT);
  const [baseQuote, setBaseQuote] = useState({ base: "EUR", quote: "USD" });
  const [stepSize, setStepSize] = useState({
    usdAcc: 0.0001,
    usdBase: 0.0001,
    usdQuote: 0.0001,
    base: 0.0001,
    quote: 0.0001,
  });
  const [stopPrice, setStopPrice] = useState("");
  const [profitGoalPrice, setProfitGoalPrice] = useState("");

  const [result, setResult] = useState<PositionSizeResultType | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Get currency rates
  const prevCurrency = useCurrencyRates(input.accBaseCurrency);

  // Get commodity rates
  useCommodityRates();

  const handleSwitch = (idx: number) => {
    setInput({ ...input, isLong: idx === 0 });
  };

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
    setInput({
      ...DEFAULT_INPUT,
      isLong: input.isLong,
      accBaseCurrency: input.accBaseCurrency,
      currencyPair: input.currencyPair,
      includeProfitGoal: input.includeProfitGoal,
      profitGoalTyp: input.profitGoalTyp,
      includeTradingFee: input.includeTradingFee,
      feeTyp: input.feeTyp,
      leverage: input.leverage,
      usdAccPair: input.usdAccPair,
      usdAccCrossRate: input.usdAccCrossRate,
      usdQuotePair: input.usdQuotePair,
      usdQuoteCrossRate: input.usdQuoteCrossRate,
      basePair: input.basePair,
      baseCrossRate: input.baseCrossRate,
      quotePair: input.quotePair,
      quoteCrossRate: input.quoteCrossRate,
    });
    setErrorField(null);
    setResult(null);
  };

  const crossRateStyles = useSpring({
    height: calculateCrossHeight(input),
    opacity: input.quotePair === "" ? 0 : 1,
    overflow: "hidden",
  });

  const profitGoalStyles = useSpring({
    height: input.includeProfitGoal ? 220 : 0,
    opacity: input.includeProfitGoal ? 1 : 0,
    overflow: "hidden",
  });

  const tradingFeeStyles = useSpring({
    height: input.includeTradingFee ? 300 : 0,
    opacity: input.includeTradingFee ? 1 : 0,
    overflow: "hidden",
  });

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
          onSwitch={handleSwitch}
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
              setInput({ ...input, portfolioCapital: val })
            }
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="max-portfolio-risk">Max Portfolio Risk (%)</label>
          <NumberInput
            step="0.1"
            id="max-portfolio-risk"
            minDecimalPlace={2}
            maxDecimalPlace={5}
            postUnit="%"
            isInvalid={
              errorField === ERROR_FIELD_POSITION_SIZE.MAX_PORTFOLIO_RISK
            }
            value={input.maxPortfolioRisk}
            onChangeHandler={(val) =>
              setInput({ ...input, maxPortfolioRisk: val })
            }
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="acc-base-currency">Account Currency</label>
          <CurrencySelectBox
            name="acc-base-currency"
            defaultIndex={29}
            supportedCurrencies={supportedCurrencies}
            onChange={(currency) => {
              setInput({
                ...input,
                accBaseCurrency: currency,
              });
            }}
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="currency-pair">Currency Pair</label>
          <PairSelectBox
            name="currency-pair"
            defaultIndex={24}
            supportedAssets={supportedAssets}
            onChange={(pair) => {
              setInput(() => {
                setBaseQuote(getBaseAndQuote(pair));
                const pairInfo = supportedAssets[pair];

                return {
                  ...input,
                  pipSize: pairInfo.pip,
                  contractSize: pairInfo.lot,
                  currencyPair: pair,
                  stopLossTyp:
                    pairInfo.pip === 0
                      ? StopLossTyp.PRICE_BASED
                      : input.stopLossTyp,
                  profitGoalTyp:
                    input.profitGoalTyp === ProfitGoalTyp.PORTFOLIO_BASED
                      ? input.profitGoalTyp
                      : pairInfo.pip === 0
                      ? ProfitGoalTyp.PRICE_BASED
                      : input.profitGoalTyp,
                };
              });
            }}
          />
        </div>

        <animated.div style={crossRateStyles}>
          {input.quotePair !== "" && (
            <div className={styles["form-group"]}>
              <label>Cross Rate</label>
              <div className={styles["cross-rate-container"]}>
                {input.usdBasePair !== "" && (
                  <div className={styles["exchange-rate-container"]}>
                    <div className={styles["exchange-rate-label"]}>
                      {input.usdBasePair + ":"}
                    </div>
                    <NumberInput
                      step={stepSize.usdBase}
                      id="usd-base-cross-rate"
                      minDecimalPlace={2}
                      maxDecimalPlace={5}
                      isInvalid={
                        errorField ===
                        ERROR_FIELD_POSITION_SIZE.USD_BASE_CROSS_RATE
                      }
                      value={
                        isLoading[FOREX_LOADING_TYPES.GET_COMMODITY_RATE]
                          ? "0"
                          : input.usdBaseCrossRate || "0"
                      }
                      onChangeHandler={(val) =>
                        setInput({ ...input, usdBaseCrossRate: val })
                      }
                      disabled={
                        isLoading[FOREX_LOADING_TYPES.GET_COMMODITY_RATE]
                      }
                    />
                  </div>
                )}

                {input.usdAccPair !== "" &&
                  ((input.includeTradingFee &&
                    input.feeTyp === FeeTyp.COMMISSION_PER_100K) ||
                    input.usdBasePair !== "") && (
                    <div className={styles["exchange-rate-container"]}>
                      <div className={styles["exchange-rate-label"]}>
                        {input.usdAccPair + ":"}
                      </div>
                      <NumberInput
                        step={stepSize.usdAcc}
                        id="usd-acc-cross-rate"
                        minDecimalPlace={2}
                        maxDecimalPlace={5}
                        isInvalid={
                          errorField ===
                          ERROR_FIELD_POSITION_SIZE.USD_ACC_CROSS_RATE
                        }
                        value={
                          isLoading[FOREX_LOADING_TYPES.GET_CURRENCY_RATE]
                            ? "0"
                            : input.usdAccCrossRate || "0"
                        }
                        onChangeHandler={(val) =>
                          setInput({ ...input, usdAccCrossRate: val })
                        }
                        disabled={
                          isLoading[FOREX_LOADING_TYPES.GET_CURRENCY_RATE]
                        }
                      />
                    </div>
                  )}

                {input.usdQuotePair !== "" &&
                  input.includeTradingFee &&
                  input.feeTyp === FeeTyp.COMMISSION_PER_100K && (
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
                          errorField ===
                          ERROR_FIELD_POSITION_SIZE.USD_QUOTE_CROSS_RATE
                        }
                        value={
                          isLoading[FOREX_LOADING_TYPES.GET_CURRENCY_RATE]
                            ? "0"
                            : input.usdQuoteCrossRate || "0"
                        }
                        onChangeHandler={(val) =>
                          setInput({ ...input, usdQuoteCrossRate: val })
                        }
                        disabled={
                          isLoading[FOREX_LOADING_TYPES.GET_CURRENCY_RATE]
                        }
                      />
                    </div>
                  )}

                {input.basePair !== "" && (
                  <div className={styles["exchange-rate-container"]}>
                    <div className={styles["exchange-rate-label"]}>
                      {input.basePair + ":"}
                    </div>
                    <NumberInput
                      step={stepSize.base}
                      id="base-cross-rate"
                      minDecimalPlace={2}
                      maxDecimalPlace={5}
                      isInvalid={
                        errorField === ERROR_FIELD_POSITION_SIZE.BASE_CROSS_RATE
                      }
                      value={
                        isLoading[FOREX_LOADING_TYPES.GET_CURRENCY_RATE]
                          ? "0"
                          : input.baseCrossRate || "0"
                      }
                      onChangeHandler={(val) =>
                        setInput({ ...input, baseCrossRate: val })
                      }
                      disabled={
                        isLoading[FOREX_LOADING_TYPES.GET_CURRENCY_RATE]
                      }
                    />
                  </div>
                )}

                {input.quotePair !== "" && (
                  <div className={styles["exchange-rate-container"]}>
                    <div className={styles["exchange-rate-label"]}>
                      {input.quotePair + ":"}
                    </div>
                    <NumberInput
                      step={stepSize.quote}
                      id="quote-cross-rate"
                      minDecimalPlace={2}
                      maxDecimalPlace={5}
                      isInvalid={
                        errorField ===
                        ERROR_FIELD_POSITION_SIZE.QUOTE_CROSS_RATE
                      }
                      value={
                        isLoading[FOREX_LOADING_TYPES.GET_CURRENCY_RATE]
                          ? "0"
                          : input.quoteCrossRate || "0"
                      }
                      onChangeHandler={(val) =>
                        setInput({ ...input, quoteCrossRate: val })
                      }
                      disabled={
                        isLoading[FOREX_LOADING_TYPES.GET_CURRENCY_RATE]
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </animated.div>

        <div className={styles["form-group"]}>
          <label htmlFor="leverage">Leverage for Margin</label>
          <LeverageSelectBox
            name="leverage"
            defaultIndex={9}
            onChange={(leverage) => {
              setInput(() => {
                return {
                  ...input,
                  leverage,
                };
              });
            }}
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="contract-size">
            Contract Size ({baseQuote.base[0] === "X" ? "Ounce" : "Unit"})
          </label>
          <NumberInput
            id="contract-size"
            step={1}
            isInvalid={errorField === ERROR_FIELD_POSITION_SIZE.CONTRACT_SIZE}
            minDecimalPlace={0}
            maxDecimalPlace={0}
            value={input.contractSize}
            onChangeHandler={(val) => setInput({ ...input, contractSize: val })}
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="open-price">Open Price</label>
          <NumberInput
            id="open-price"
            step={supportedAssets[input.currencyPair].pip}
            preUnit="$"
            isInvalid={errorField === ERROR_FIELD_POSITION_SIZE.OPEN_PRICE}
            minDecimalPlace={2}
            maxDecimalPlace={5}
            value={input.openPrice}
            onChangeHandler={(val) => setInput({ ...input, openPrice: val })}
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="stop-loss">Stop Loss</label>
          <div className={styles["input-with-switch"]}>
            <NumberInput
              id="stop-loss"
              preUnit={input.stopLossTyp === StopLossTyp.PRICE_BASED ? "$" : ""}
              postUnit={
                input.stopLossTyp === StopLossTyp.PIP_BASED ? "PIP" : ""
              }
              isInvalid={errorField === ERROR_FIELD_POSITION_SIZE.STOP_LOSS}
              minDecimalPlace={2}
              maxDecimalPlace={5}
              value={input.stopLoss}
              onChangeHandler={(val) => setInput({ ...input, stopLoss: val })}
            />
            {input.pipSize > 0 && (
              <Switch
                height={46}
                borderRadius={5}
                names={["$", "PIP"]}
                defaultIndex={
                  input.stopLossTyp === StopLossTyp.PRICE_BASED ? 0 : 1
                }
                childWidth={50}
                onSwitch={(idx: number) => {
                  setInput({
                    ...input,
                    stopLossTyp:
                      idx === 0
                        ? StopLossTyp.PRICE_BASED
                        : StopLossTyp.PIP_BASED,
                  });
                }}
              />
            )}
          </div>
          {stopPrice && (
            <p className={styles["hint"]}>Stop Loss Price: $ {stopPrice}</p>
          )}
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
                setInput({
                  ...input,
                  includeProfitGoal: !input.includeProfitGoal,
                  profitGoal: DEFAULT_INPUT.profitGoal,
                  profitGoalTyp: DEFAULT_INPUT.profitGoalTyp,
                })
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
                    setInput({ ...input, profitGoalTyp: idx, profitGoal: "0" });
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
                <div className={styles["input-with-switch"]}>
                  <NumberInput
                    id="profit-goal"
                    step={1}
                    preUnit={
                      input.profitGoalTyp === ProfitGoalTyp.PRICE_BASED
                        ? "$"
                        : ""
                    }
                    postUnit={
                      input.profitGoalTyp === ProfitGoalTyp.PORTFOLIO_BASED
                        ? "%"
                        : input.profitGoalTyp === ProfitGoalTyp.PIP_BASED
                        ? "PIP"
                        : ""
                    }
                    isInvalid={
                      errorField === ERROR_FIELD_POSITION_SIZE.PROFIT_TARGET
                    }
                    minDecimalPlace={2}
                    maxDecimalPlace={5}
                    value={input.profitGoal}
                    onChangeHandler={(val) =>
                      setInput({ ...input, profitGoal: val })
                    }
                  />
                  {input.profitGoalTyp !== ProfitGoalTyp.PORTFOLIO_BASED &&
                    input.pipSize > 0 && (
                      <Switch
                        height={46}
                        borderRadius={5}
                        names={["$", "PIP"]}
                        defaultIndex={
                          input.profitGoalTyp === ProfitGoalTyp.PRICE_BASED
                            ? 0
                            : 1
                        }
                        childWidth={50}
                        onSwitch={(idx: number) => {
                          setInput({
                            ...input,
                            profitGoalTyp:
                              idx === 0
                                ? ProfitGoalTyp.PRICE_BASED
                                : ProfitGoalTyp.PIP_BASED,
                          });
                        }}
                      />
                    )}
                </div>
                {profitGoalPrice && (
                  <p className={styles["hint"]}>
                    Profit Goal Price: $ {profitGoalPrice}
                  </p>
                )}
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
                setInput({
                  ...input,
                  includeTradingFee: !input.includeTradingFee,
                  feeTyp: DEFAULT_INPUT.feeTyp,
                  estTradingFee: "0",
                  swapFee: "0",
                });
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
                    setInput({ ...input, feeTyp: idx, estTradingFee: "0" });
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
                <div className={styles["input-with-switch"]}>
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
                      setInput({ ...input, estTradingFee: val })
                    }
                  />
                </div>
              </div>

              <div className={styles["form-group"]}>
                <label htmlFor="estimated-fee">
                  Total Swap {input.isLong ? "Long" : "Short"} (
                  {baseQuote.quote})
                </label>
                <div className={styles["input-with-switch"]}>
                  <NumberInput
                    id="swap-fee"
                    step={0.1}
                    preUnit="$"
                    minDecimalPlace={2}
                    maxDecimalPlace={5}
                    value={input.swapFee}
                    onChangeHandler={(val) =>
                      setInput({ ...input, swapFee: val })
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
