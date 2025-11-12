import { FormEvent, useEffect, useRef, useState } from "react";
import { useSpring, animated } from "@react-spring/web";

import { calculateResult, validatePositionSizeInput } from "./utils";
import {
  convertToLocaleString,
  parseNumberFromString,
} from "../../../../common/number/number";

import styles from "../stock_calculator_form.module.scss";
import Switch from "../../../../component/common/switch/switch.component";
import Button from "../../../../component/common/button/button.component";
import Container from "../../../../component/common/container/container.component";
import NumberInput from "../../../../component/common/input/number_input.component";
import SelectBox from "../../../../component/common/select_box/select_box.component";
import Checkbox from "../../../../component/common/checkbox/checkbox.component";
import {
  ERROR_FIELD_POSITION_SIZE,
  PositionSizeInputType,
  PositionSizeResultType,
  ProfitGoalTyp,
  ProfitGoalUnit,
  StopLossTyp,
  UnitType,
} from "./position_size.type";
import DefaultSelect from "../../../../component/common/select_box/default_select_box.component";
import { convertRatioToString } from "../../../../common/common";

const DEFAULT_INPUT: PositionSizeInputType = {
  portfolioCapital: "0",
  maxPortfolioRisk: "0",
  entryPrice: "0",
  unitType: UnitType.UNIT,
  stopLoss: "0",
  stopLossTyp: StopLossTyp.PERCENT_BASED,
  includeProfitGoal: false,
  profitGoal: "0",
  profitGoalTyp: ProfitGoalTyp.PRICED_BASED,
  profitGoalUnit: ProfitGoalUnit.PERCENT_BASED,
  isLong: true,
  includeTradingFee: false,
  estTradingFee: "0",
  minTradingFee: "0",
  precision: 2,
};

const PositionSizeForm = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [errorField, setErrorField] =
    useState<ERROR_FIELD_POSITION_SIZE | null>(null);
  const [input, setInput] = useState<PositionSizeInputType>(DEFAULT_INPUT);

  const [result, setResult] = useState<PositionSizeResultType | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Scroll to result after it is updated
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [result]);

  // Form submission handler
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
      stopLossTyp: prev.stopLossTyp,
      includeProfitGoal: prev.includeProfitGoal,
      profitGoalTyp: prev.profitGoalTyp,
      profitGoalUnit: prev.profitGoalUnit,
      unitType: prev.unitType,
      includeTradingFee: prev.includeTradingFee,
      precision: prev.precision,
    }));
    setErrorField(null);
    setResult(null);
  };

  const handleSwitch = (idx: number) => {
    setInput((prev) => ({ ...prev, isLong: idx === 0 }));
  };

  const profitGoalStyles = useSpring({
    height: input.includeProfitGoal ? 200 : 0,
    opacity: input.includeProfitGoal ? 1 : 0,
    overflow: "hidden",
  });

  const tradingFeeStyles = useSpring({
    height: input.includeTradingFee ? 200 : 0,
    opacity: input.includeTradingFee ? 1 : 0,
    overflow: "hidden",
  });

  return (
    <form
      id="stock-position"
      className={styles["form-wrapper"]}
      onSubmit={handleSubmit}
    >
      <p className={styles["description"]}>
        This calculator helps you determine the optimal trade size based on your
        risk tolerance. It calculates the ideal position size for effective risk
        management and can also estimate the exit price required to reach your
        desired profit target.
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
          <label htmlFor="entry-price">Open Price</label>
          <NumberInput
            id="entry-price"
            preUnit="$"
            minDecimalPlace={2}
            maxDecimalPlace={5}
            isInvalid={errorField === ERROR_FIELD_POSITION_SIZE.ENTRY_PRICE}
            value={input.entryPrice}
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, entryPrice: val }))
            }
          />
        </div>

        <div className={styles["form-group"]}>
          <span className={styles["label"]}>Unit Type</span>
          <SelectBox
            id="unit-type"
            options={["Fractional Share", "Unit", "Round Lot"]}
            defaultIndex={UnitType.UNIT}
            onChangeHandler={(idx) =>
              setInput((prev) => ({ ...prev, unitType: idx }))
            }
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="stop-loss">Stop Loss</label>
          <div className={styles["input-with-switch"]}>
            <NumberInput
              id="stop-loss"
              preUnit={
                input.stopLossTyp === StopLossTyp.PRICED_BASED ? "$" : ""
              }
              postUnit={
                input.stopLossTyp === StopLossTyp.PERCENT_BASED ? "%" : ""
              }
              isInvalid={errorField === ERROR_FIELD_POSITION_SIZE.STOP_LOSS}
              minDecimalPlace={2}
              maxDecimalPlace={5}
              value={input.stopLoss}
              onChangeHandler={(val) =>
                setInput((prev) => ({ ...prev, stopLoss: val }))
              }
            />
            <Switch
              height={46}
              borderRadius={5}
              names={["$", "%"]}
              defaultIndex={
                input.stopLossTyp === StopLossTyp.PRICED_BASED ? 0 : 1
              }
              childWidth={50}
              onSwitch={(idx: number) => {
                setInput((prev) => ({
                  ...prev,
                  stopLossTyp:
                    idx === 0
                      ? StopLossTyp.PRICED_BASED
                      : StopLossTyp.PERCENT_BASED,
                  stopLoss:
                    prev.stopLoss === "0"
                      ? prev.stopLoss
                      : parseNumberFromString(prev.stopLoss).toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 5,
                          }
                        ),
                }));
              }}
            />
          </div>
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
                  options={["Priced-Based", "Portfolio-Based"]}
                  defaultIndex={ProfitGoalTyp.PRICED_BASED}
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
                  {input.profitGoalTyp === ProfitGoalTyp.PRICED_BASED
                    ? "Profit Target"
                    : "Min Portfolio Profit (%)"}
                </label>
                <div className={styles["input-with-switch"]}>
                  <NumberInput
                    id="profit-goal"
                    step={0.1}
                    preUnit={
                      input.profitGoalUnit === ProfitGoalUnit.PRICED_BASED
                        ? "$"
                        : ""
                    }
                    postUnit={
                      input.profitGoalTyp === ProfitGoalTyp.PRICED_BASED
                        ? input.profitGoalUnit === ProfitGoalUnit.PERCENT_BASED
                          ? "%"
                          : ""
                        : "%"
                    }
                    isInvalid={
                      errorField === ERROR_FIELD_POSITION_SIZE.PROFIT_TARGET
                    }
                    minDecimalPlace={2}
                    maxDecimalPlace={5}
                    value={input.profitGoal}
                    onChangeHandler={(val) =>
                      setInput((prev) => ({ ...prev, profitGoal: val }))
                    }
                  />
                  {input.profitGoalTyp === ProfitGoalTyp.PRICED_BASED && (
                    <Switch
                      height={46}
                      borderRadius={5}
                      names={["$", "%"]}
                      defaultIndex={
                        input.profitGoalUnit === ProfitGoalUnit.PRICED_BASED
                          ? 0
                          : 1
                      }
                      childWidth={50}
                      onSwitch={(idx: number) => {
                        setInput((prev) => ({
                          ...prev,
                          profitGoalUnit:
                            idx === 0
                              ? ProfitGoalUnit.PRICED_BASED
                              : ProfitGoalUnit.PERCENT_BASED,
                          profitGoal:
                            prev.profitGoal === "0"
                              ? prev.profitGoal
                              : parseNumberFromString(
                                  prev.profitGoal
                                ).toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 5,
                                }),
                        }));
                      }}
                    />
                  )}
                </div>
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
                  includeTradingFee: !prev.includeTradingFee,
                  estTradingFee: DEFAULT_INPUT.estTradingFee,
                  minTradingFee: DEFAULT_INPUT.minTradingFee,
                }))
              }
            />
            <span
              className={styles["checkbox-label"]}
              onClick={() =>
                setInput((prev) => ({
                  ...prev,
                  includeTradingFee: !prev.includeTradingFee,
                  estTradingFee: DEFAULT_INPUT.estTradingFee,
                  minTradingFee: DEFAULT_INPUT.minTradingFee,
                }))
              }
            >
              Include Trading Fee
            </span>
          </div>
        </div>

        <animated.div style={tradingFeeStyles}>
          {input.includeTradingFee && (
            <>
              <div className={styles["form-group"]}>
                <label htmlFor="trading-fee">
                  Estimated Trading Fee Per Order
                </label>
                <NumberInput
                  id="trading-fee"
                  postUnit="%"
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
                <label htmlFor="min-trading-fee">
                  Minimum Trading Fee Per Order
                </label>
                <NumberInput
                  id="min-trading-fee"
                  preUnit="$"
                  isInvalid={
                    errorField === ERROR_FIELD_POSITION_SIZE.MIN_TRADING_FEE
                  }
                  minDecimalPlace={2}
                  maxDecimalPlace={5}
                  value={input.minTradingFee}
                  onChangeHandler={(val) =>
                    setInput((prev) => ({ ...prev, minTradingFee: val }))
                  }
                />
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
                  <div>Open Price:</div>
                  <div>${convertToLocaleString(result.entryPrice)}</div>
                </div>

                <div className={styles["row"]}>
                  <div>Stop Price:</div>
                  <div>${convertToLocaleString(result.stopPrice)}</div>
                </div>

                <div className={styles["row"]}>
                  <div>Stop Loss (%):</div>
                  <div>
                    {convertToLocaleString(result.stopPercent, input.precision)}
                    %
                  </div>
                </div>

                {result.profitPrice !== undefined && (
                  <div className={styles["row"]}>
                    <div>Profit Price:</div>
                    <div>${convertToLocaleString(result.profitPrice)}</div>
                  </div>
                )}

                {result.profitPercent !== undefined && (
                  <div className={styles["row"]}>
                    <div>Profit (%):</div>
                    <div>
                      {convertToLocaleString(
                        result.profitPercent,
                        input.precision
                      )}
                      %
                    </div>
                  </div>
                )}

                <div className={styles["row"]}>
                  <div>Quantity:</div>
                  <div>{result.quantity}</div>
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
                        )}
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
                      )}
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
                      )}
                    </div>
                  </div>
                )}

                <br />

                <div className={styles["row"]}>
                  <div>Entry Amount:</div>
                  <div>
                    $
                    {convertToLocaleString(
                      result.entryAmount,
                      input.precision,
                      input.precision
                    )}
                  </div>
                </div>

                {result.grossEntryAmount !== undefined && (
                  <div className={styles["row"]}>
                    <div>Gross Entry Amount:</div>
                    <div>
                      $
                      {convertToLocaleString(
                        result.grossEntryAmount,
                        input.precision,
                        input.precision
                      )}
                    </div>
                  </div>
                )}

                <div className={styles["row"]}>
                  <div>Risk Amount:</div>
                  <div>
                    $
                    {convertToLocaleString(
                      result.riskAmount,
                      input.precision,
                      input.precision
                    )}
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
                      )}
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

export default PositionSizeForm;
