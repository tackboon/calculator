import { FormEvent, useEffect, useRef, useState } from "react";
import { useSpring, animated } from "@react-spring/web";

import { calculateResult, validatePositionSizeInput } from "./utils.component";
import { parseNumberFromString } from "../../../../common/number/number";

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
  UnitType,
} from "./position_size.type";

const DEFAULT_INPUT: PositionSizeInputType = {
  portfolioCapital: "0",
  maxPortfolioRisk: "0",
  entryPrice: "0",
  unitType: UnitType.UNIT,
  stopLoss: "0",
  stopLossTyp: "%",
  includeProfitGoal: false,
  profitGoal: "0",
  profitGoalTyp: ProfitGoalTyp.PRICED_BASED,
  profitGoalUnit: "%",
  isLong: true,
  includeTradingFee: false,
  estTradingFee: "0",
  minTradingFee: "0",
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
    setInput({
      ...DEFAULT_INPUT,
      isLong: input.isLong,
      stopLossTyp: input.stopLossTyp,
      includeProfitGoal: input.includeProfitGoal,
      profitGoalTyp: input.profitGoalTyp,
      profitGoalUnit: input.profitGoalUnit,
      unitType: input.unitType,
      includeTradingFee: input.includeTradingFee,
    });
    setErrorField(null);
    setResult(null);
  };

  const handleSwitch = (idx: number) => {
    setInput({ ...input, isLong: idx === 0 });
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
    <form className={styles["form-wrapper"]} onSubmit={handleSubmit}>
      <p className={styles["description"]}>
        This calculator helps you determine the optimal number of shares to
        trade based on your risk tolerance. Use it to calculate the ideal
        position size for effective risk management. Additionally, you can enter
        a profit target, and the calculator will determine the exit price needed
        to achieve your desired profit.
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
          <label htmlFor="unit-type">Unit Type</label>
          <SelectBox
            name="unit-type"
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
              preUnit={input.stopLossTyp === "$" ? "$" : ""}
              postUnit={input.stopLossTyp === "%" ? "%" : ""}
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
              defaultIndex={input.stopLossTyp === "$" ? 0 : 1}
              childWidth={50}
              onSwitch={(idx: number) => {
                setInput((prev) => ({
                  ...prev,
                  stopLossTyp: idx === 0 ? "$" : "%",
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
                    preUnit={input.profitGoalUnit === "$" ? "$" : ""}
                    postUnit={
                      input.profitGoalTyp === ProfitGoalTyp.PRICED_BASED
                        ? input.profitGoalUnit === "%"
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
                      defaultIndex={input.profitGoalUnit === "$" ? 0 : 1}
                      childWidth={50}
                      onSwitch={(idx: number) => {
                        setInput((prev) => ({
                          ...prev,
                          profitGoalUnit: idx === 0 ? "$" : "%",
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
            <span>Include Trading Fee</span>
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
          <Container
            className={`${styles["result-container"]} ${styles["position-size"]}`}
          >
            <div className={styles["result-wrapper"]}>
              <div className={styles["row"]}>
                <div>Open Price:</div>
                <div>${result.entryPrice}</div>
              </div>

              <div className={styles["row"]}>
                <div>Stop Price:</div>
                <div>${result.stopPrice}</div>
              </div>

              <div className={styles["row"]}>
                <div>Stop Loss (%):</div>
                <div>{result.stopPercent}%</div>
              </div>

              {result.profitPrice !== undefined && (
                <>
                  <div className={styles["row"]}>
                    <div>Profit Price:</div>
                    <div>${result.profitPrice}</div>
                  </div>

                  <div className={styles["row"]}>
                    <div>Profit (%):</div>
                    <div>{result.profitPercent}%</div>
                  </div>
                </>
              )}

              <div className={styles["row"]}>
                <div>Quantity:</div>
                <div>{result.quantity}</div>
              </div>

              <br />

              <div className={styles["row"]}>
                <div>Entry Amount:</div>
                <div>${result.tradingAmount}</div>
              </div>

              <div className={styles["row"]}>
                <div>Risk Amount:</div>
                <div>${result.riskAmount}</div>
              </div>

              <div className={styles["row"]}>
                <div>Portfolio Risk (%):</div>
                <div>{result.portfolioRisk}%</div>
              </div>

              {result.profitAmount !== undefined && (
                <div className={styles["row"]}>
                  <div>Potential Profit:</div>
                  <div>${result.profitAmount}</div>
                </div>
              )}

              {result.portfolioProfit !== undefined && (
                <div className={styles["row"]}>
                  <div>Potential Portfolio Return (%):</div>
                  <div>{result.portfolioProfit}%</div>
                </div>
              )}

              {result.estimatedEntryFee !== undefined && (
                <div className={styles["row"]}>
                  <div>Opening Fee:</div>
                  <div>${result.estimatedEntryFee}</div>
                </div>
              )}

              {result.estimatedStopFee !== undefined && (
                <div className={styles["row"]}>
                  <div>Stop Loss Execution Fee:</div>
                  <div>${result.estimatedStopFee}</div>
                </div>
              )}

              {result.estimatedProfitFee !== undefined && (
                <div className={styles["row"]}>
                  <div>Profit-Taking Fee:</div>
                  <div>${result.estimatedProfitFee}</div>
                </div>
              )}

              {result.riskRewardRatio && (
                <>
                  <br />
                  <div className={styles["row"]}>
                    <div>Risk/Reward Ratio:</div>
                    <div>{result.riskRewardRatio}</div>
                  </div>
                </>
              )}

              {result.breakEvenWinRate && (
                <div className={styles["row"]}>
                  <div>Breakeven Win Rate:</div>
                  <div>{result.breakEvenWinRate}%</div>
                </div>
              )}
            </div>
          </Container>
        )}
      </div>
    </form>
  );
};

export default PositionSizeForm;
