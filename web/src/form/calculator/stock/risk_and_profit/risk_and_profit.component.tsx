import React, { useEffect, useRef, useState } from "react";
import { useSpring, animated } from "@react-spring/web";

import styles from "../stock_calculator_form.module.scss";
import Button from "../../../../component/common/button/button.component";
import Link from "../../../../component/common/link/link.component";
import NumberInput from "../../../../component/common/input/number_input.component";
import OrderList from "../../../../component/stock/order/order_list.component";
import Checkbox from "../../../../component/common/checkbox/checkbox.component";
import { calculateResult, validateRiskAndProfitInput } from "./utils.component";
import Container from "../../../../component/common/container/container.component";
import {
  ERROR_FIELD_RISK_AND_PROFIT,
  RiskAndProfitInputType,
  RiskAndProfitResultType,
} from "./risk_and_profit.type";
import { StockOrderInputType } from "../../../../component/stock/order/order.type";

const DEFAULT_INPUT: RiskAndProfitInputType = {
  portfolioCapital: "0",
  includeTradingFee: false,
  estTradingFee: "0",
  minTradingFee: "0",
};

const RiskAndProfitForm = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [errorField, setErrorField] =
    useState<ERROR_FIELD_RISK_AND_PROFIT | null>(null);
  const [input, setInput] = useState<RiskAndProfitInputType>(DEFAULT_INPUT);

  const [result, setResult] = useState<RiskAndProfitResultType | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const [addOrderSignal, setAddOrderSignal] = useState(0);
  const [resetOrderSignal, setResetOrderSignal] = useState(0);
  const getOrdersRef =
    useRef<() => { orders: StockOrderInputType[]; errorMessage: string }>();

  const signalAddOrder = () => {
    setAddOrderSignal((prev) => ++prev);
  };

  // Scroll to result after it is updated
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [result]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (getOrdersRef.current) {
      const { orders, errorMessage } = getOrdersRef.current();
      setErrorMessage(errorMessage);
      if (errorMessage !== "") return;

      const { err, field } = validateRiskAndProfitInput(input);
      setErrorMessage(err);
      setErrorField(field);
      if (err !== "") return;

      // Handle calculation
      setResult(calculateResult(input, orders));
    }
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage("");
    setInput((prev) => ({
      ...DEFAULT_INPUT,
      includeTradingFee: prev.includeTradingFee,
    }));
    setErrorField(null);
    setResetOrderSignal((state) => state + 1);
    setResult(null);
  };

  const tradingFeeStyles = useSpring({
    height: input.includeTradingFee ? 200 : 0,
    opacity: input.includeTradingFee ? 1 : 0,
    overflow: "hidden",
  });

  return (
    <form className={styles["form-wrapper"]} onSubmit={handleSubmit}>
      <p className={styles["description"]}>
        This calculator helps you to evaluate the total risk and potential
        profit across multiple trades. By entering your orders along with
        stop-loss and profit targets, this calculator provides an overview of
        your portfolio's risk exposure and potential returns. It's a valuable
        tool for managing risk and optimizing your trading strategy.
      </p>

      <div>
        <div className={styles["form-group"]}>
          <label htmlFor="portfolio-capital">Portfolio Capital</label>
          <NumberInput
            id="portfolio-capital"
            preUnit="$"
            isInvalid={
              errorField === ERROR_FIELD_RISK_AND_PROFIT.PORTFOLIO_CAPITAL
            }
            minDecimalPlace={2}
            maxDecimalPlace={5}
            value={input.portfolioCapital}
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, portfolioCapital: val }))
            }
          />
        </div>

        <div className={styles["order-container"]}>
          <OrderList
            addOrderSignal={addOrderSignal}
            minOrderCount={1}
            submitHandler={(getOrders) => {
              getOrdersRef.current = getOrders;
            }}
            resetSignal={resetOrderSignal}
          />
        </div>

        <div className={styles["add-more-order-container"]}>
          <Link className={styles["link"]} onClick={signalAddOrder}>
            Add More Order
          </Link>
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
                    errorField === ERROR_FIELD_RISK_AND_PROFIT.EST_TRADING_FEE
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
                    errorField === ERROR_FIELD_RISK_AND_PROFIT.MIN_TRADING_FEE
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
                <div>Total Entry Amount:</div>
                <div>${result.totalEntryAmount}</div>
              </div>

              <div className={styles["row"]}>
                <div>Total Risk Amount:</div>
                <div>${result.totalRiskAmount}</div>
              </div>

              <div className={styles["row"]}>
                <div>Portfolio Risk (%):</div>
                <div>{result.portfolioRisk}%</div>
              </div>

              {result.hasProfitGoal && (
                <>
                  <div className={styles["row"]}>
                    <div>Total Potential Profit:</div>
                    <div>${result.totalProfitAmount}</div>
                  </div>

                  <div className={styles["row"]}>
                    <div>Potential Portfolio Return (%):</div>
                    <div>{result.portfolioProfit}%</div>
                  </div>
                </>
              )}

              <br />

              <div className={styles["row"]}>
                <div>Total Long Position:</div>
                <div>{result.totalLong}</div>
              </div>

              <div className={styles["row"]}>
                <div>Total Short Position:</div>
                <div>{result.totalShort}</div>
              </div>

              {result.riskRewardRatio && (
                <div className={styles["row"]}>
                  <div>Portfolio Risk/Reward Ratio:</div>
                  <div>{result.riskRewardRatio}</div>
                </div>
              )}

              {result.orders.map((order, idx) => {
                return (
                  <div key={`res-${idx}`}>
                    <br />
                    <div key={`order-result-${idx}`}>
                      <h3>Order #{idx + 1}</h3>

                      <div className={styles["row"]}>
                        <div>Order Type:</div>
                        <div>{order.isLong ? "Long" : "Short"}</div>
                      </div>

                      <div className={styles["row"]}>
                        <div>Open Price:</div>
                        <div>${order.entryPrice}</div>
                      </div>

                      <div className={styles["row"]}>
                        <div>Stop Price:</div>
                        <div>${order.stopLossPrice}</div>
                      </div>

                      <div className={styles["row"]}>
                        <div>Stop Loss (%):</div>
                        <div>{order.stopLossPercent}%</div>
                      </div>

                      {order.profitPrice !== undefined && (
                        <div className={styles["row"]}>
                          <div>Profit Price:</div>
                          <div>${order.profitPrice}</div>
                        </div>
                      )}

                      {order.profitPercent !== undefined && (
                        <div className={styles["row"]}>
                          <div>Profit (%):</div>
                          <div>{order.profitPercent}%</div>
                        </div>
                      )}

                      <div className={styles["row"]}>
                        <div>Quantity:</div>
                        <div>{order.quantity}</div>
                      </div>

                      <br />
                      <div className={styles["row"]}>
                        <div>Risk Amount:</div>
                        <div>{order.riskAmount}</div>
                      </div>

                      {order.profitAmount !== undefined && (
                        <div className={styles["row"]}>
                          <div>Potential Profit:</div>
                          <div>{order.profitAmount}</div>
                        </div>
                      )}

                      {order.riskRewardRatio && (
                        <div className={styles["row"]}>
                          <div>Risk/Reward Ratio:</div>
                          <div>{order.riskRewardRatio}</div>
                        </div>
                      )}

                      {order.entryFee !== undefined && (
                        <>
                          <br />
                          <div className={styles["row"]}>
                            <div>Opening Fee:</div>
                            <div>${order.entryFee}</div>
                          </div>
                        </>
                      )}

                      {order.stopLossFee !== undefined && (
                        <div className={styles["row"]}>
                          <div>Stop Loss Execution Fee:</div>
                          <div>${order.stopLossFee}</div>
                        </div>
                      )}

                      {order.profitFee !== undefined && (
                        <div className={styles["row"]}>
                          <div>Profit-Taking Fee:</div>
                          <div>${order.profitFee}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Container>
        )}
      </div>
    </form>
  );
};

export default RiskAndProfitForm;
