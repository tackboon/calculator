import React, { useEffect, useRef, useState } from "react";
import { useSpring, animated } from "@react-spring/web";

import { StockOrderInputType } from "../../../../component/order/stock/order.component";

import styles from "../stock_calculator_form.module.scss";
import Button from "../../../../component/common/button/button.component";
import Link from "../../../../component/common/link/link.component";
import NumberInput from "../../../../component/common/input/number_input.component";
import OrderList from "../../../../component/order/stock/order_list.component";
import Checkbox from "../../../../component/common/checkbox/checkbox.component";
import { calculateResult, validateRiskAndProfitInput } from "./utils.component";
import Container from "../../../../component/common/container/container.component";

export type RiskAndProfitInputType = {
  portfolioCapital: string;
  includeTradingFee: boolean;
  estTradingFee: string;
  minTradingFee: string;
};

const DEFAULT_INPUT: RiskAndProfitInputType = {
  portfolioCapital: "0",
  includeTradingFee: false,
  estTradingFee: "0",
  minTradingFee: "0",
};

export enum ERROR_FIELD_RISK_AND_PROFIT {
  PORTFOLIO_CAPITAL,
  EST_TRADING_FEE,
  MIN_TRADING_FEE,
}

export type OrderResultType = {
  isLong: boolean;
  entryAmount: number;
  entryPrice: number;
  stopLossPrice: number;
  stopLossPercent: number;
  profitPrice?: number;
  profitPercent?: number;
  riskAmount: number;
  profitAmount?: number;
  entryFee?: number;
  stopLossFee?: number;
  profitFee?: number;
  portfolioRisk: number;
  portfolioProfit?: number;
  riskRewardRatio?: string;
  quantity: number;
};

export type RiskAndProfitResultType = {
  totalEntryAmount: number;
  totalRiskAmount: number;
  totalProfitAmount: number;
  portfolioRisk: number;
  portfolioProfit?: number;
  riskRewardRatio?: string;
  includeTradingFee: boolean;
  orders: OrderResultType[];
  totalShort: number;
  totalLong: number;
  hasProfitGoal: boolean;
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
    setInput({
      ...DEFAULT_INPUT,
      includeTradingFee: input.includeTradingFee,
    });
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
            maxDecimalPlace={4}
            value={input.portfolioCapital}
            onChangeHandler={(val) =>
              setInput({ ...input, portfolioCapital: val })
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
                setInput({
                  ...input,
                  includeTradingFee: !input.includeTradingFee,
                  estTradingFee: DEFAULT_INPUT.estTradingFee,
                  minTradingFee: DEFAULT_INPUT.minTradingFee,
                })
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
                  maxDecimalPlace={4}
                  value={input.estTradingFee}
                  onChangeHandler={(val) =>
                    setInput({ ...input, estTradingFee: val })
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
                  maxDecimalPlace={4}
                  value={input.minTradingFee}
                  onChangeHandler={(val) =>
                    setInput({ ...input, minTradingFee: val })
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
                <div>
                  $
                  {result.totalEntryAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })}
                </div>
              </div>

              <div className={styles["row"]}>
                <div>Total Risk Amount:</div>
                <div>
                  $
                  {result.totalRiskAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })}
                </div>
              </div>

              <div className={styles["row"]}>
                <div>Portfolio Risk (%):</div>
                <div>
                  {result.portfolioRisk.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })}
                  %
                </div>
              </div>

              {result.hasProfitGoal && (
                <>
                  <div className={styles["row"]}>
                    <div>Total Potential Profit:</div>
                    <div>
                      $
                      {result.totalProfitAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}
                    </div>
                  </div>

                  <div className={styles["row"]}>
                    <div>Potential Portfolio Return (%):</div>
                    <div>
                      {result.portfolioRisk.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}
                      %
                    </div>
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
                  <>
                    <br />
                    <div key={`order-result-${idx}`}>
                      <h3>Order #{idx + 1}</h3>

                      <div className={styles["row"]}>
                        <div>Order Type:</div>
                        <div>{order.isLong ? "Long" : "Short"}</div>
                      </div>

                      <div className={styles["row"]}>
                        <div>Open Price:</div>
                        <div>
                          $
                          {order.entryPrice.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 4,
                          })}
                        </div>
                      </div>

                      <div className={styles["row"]}>
                        <div>Stop Price:</div>
                        <div>
                          $
                          {order.stopLossPrice.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 4,
                          })}
                        </div>
                      </div>

                      <div className={styles["row"]}>
                        <div>Stop Loss (%):</div>
                        <div>
                          {order.stopLossPercent.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 4,
                          })}
                          %
                        </div>
                      </div>

                      {order.profitPrice !== undefined && (
                        <div className={styles["row"]}>
                          <div>Profit Price:</div>
                          <div>
                            $
                            {order.profitPrice.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 4,
                            })}
                          </div>
                        </div>
                      )}

                      {order.profitPercent !== undefined && (
                        <div className={styles["row"]}>
                          <div>Profit (%):</div>
                          <div>
                            {order.profitPercent.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 4,
                            })}
                            %
                          </div>
                        </div>
                      )}

                      <div className={styles["row"]}>
                        <div>Quantity:</div>
                        <div>{order.quantity}</div>
                      </div>

                      {order.entryFee !== undefined && (
                        <>
                          <br />
                          <div className={styles["row"]}>
                            <div>Opening Fee:</div>
                            <div>
                              $
                              {order.entryFee.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 4,
                              })}
                            </div>
                          </div>
                        </>
                      )}

                      {order.stopLossFee !== undefined && (
                        <div className={styles["row"]}>
                          <div>Stop Loss Execution Fee:</div>
                          <div>
                            $
                            {order.stopLossFee.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 4,
                            })}
                          </div>
                        </div>
                      )}

                      {order.profitFee !== undefined && (
                        <div className={styles["row"]}>
                          <div>Profit-Taking Fee:</div>
                          <div>
                            $
                            {order.profitFee.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 4,
                            })}
                          </div>
                        </div>
                      )}

                      {order.riskRewardRatio && (
                        <div className={styles["row"]}>
                          <div>Risk/Reward Ratio:</div>
                          <div>{order.riskRewardRatio}</div>
                        </div>
                      )}
                    </div>
                  </>
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
