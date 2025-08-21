import React, { useEffect, useRef, useState } from "react";
import { useSpring, animated } from "@react-spring/web";

import { calculateResult, validateProfitLossInput } from "./utils.component";

import styles from "../stock_calculator_form.module.scss";
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
import { mathBigNum } from "../../../../common/number/math";
import Ranger from "../../../../component/common/ranger/ranger.component";
import { convertToLocaleString } from "../../../../common/number/number";

const DEFAULT_INPUT: ProfitLossInputType = {
  entryPrice: "0",
  exitPrice: "0",
  quantity: "0",
  isLong: true,
  includeTradingFee: false,
  estTradingFee: "0",
  minTradingFee: "0",
};

const ProfitLossForm = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [errorField, setErrorField] = useState<ERROR_FIELD_PROFIT_LOSS | null>(
    null
  );
  const [input, setInput] = useState<ProfitLossInputType>(DEFAULT_INPUT);
  const [result, setResult] = useState<ProfitLossResultType | null>(null);
  const [decPrecision, setDecPrecision] = useState(2);
  const resultRef = useRef<HTMLDivElement>(null);

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
      includeTradingFee: prev.includeTradingFee,
    }));
    setErrorField(null);
    setResult(null);
  };

  const animationStyles = useSpring({
    height: input.includeTradingFee ? 200 : 0,
    opacity: input.includeTradingFee ? 1 : 0,
    overflow: "hidden",
  });

  return (
    <form className={styles["form-wrapper"]} onSubmit={handleSubmit}>
      <p className={styles["description"]}>
        This calculator helps you calculate the profit or loss from your trades.
        It takes your entry price, exit price, and quantity of assets to compute
        the total gain or loss along with the percentage change. You can use
        this calculator to evaluate your trades, determine if revenue covers
        costs, or plan for future trades.
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
          <label htmlFor="entry-price">Open Price</label>
          <NumberInput
            id="entry-price"
            preUnit="$"
            isInvalid={errorField === ERROR_FIELD_PROFIT_LOSS.ENTRY_PRICE}
            minDecimalPlace={2}
            maxDecimalPlace={5}
            value={input.entryPrice}
            onChangeHandler={(val) =>
              setInput((prev) => ({
                ...prev,
                entryPrice: val,
              }))
            }
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="quantity">Quantity (Unit)</label>
          <NumberInput
            id="quantity"
            isInvalid={errorField === ERROR_FIELD_PROFIT_LOSS.QUANTITY}
            minDecimalPlace={0}
            maxDecimalPlace={6}
            value={input.quantity}
            onChangeHandler={(val) => {
              setInput((prev) => ({ ...prev, quantity: val }));
            }}
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="exit-price">Close Price</label>
          <NumberInput
            id="exit-price"
            preUnit="$"
            isInvalid={errorField === ERROR_FIELD_PROFIT_LOSS.EXIT_PRICE}
            minDecimalPlace={2}
            maxDecimalPlace={5}
            value={input.exitPrice}
            onChangeHandler={(val) => {
              setInput((prev) => ({ ...prev, exitPrice: val }));
            }}
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
              isCheck={input.includeTradingFee}
              onCheck={() =>
                setInput((prev) => ({
                  ...prev,
                  includeTradingFee: !input.includeTradingFee,
                  estTradingFee: DEFAULT_INPUT.estTradingFee,
                  minTradingFee: DEFAULT_INPUT.minTradingFee,
                }))
              }
            />
            <span>Include Trading Fee</span>
          </div>
        </div>

        <animated.div style={animationStyles}>
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
                <label htmlFor="min-trading-fee">
                  Minimum Trading Fee Per Order
                </label>
                <NumberInput
                  id="min-trading-fee"
                  preUnit="$"
                  isInvalid={
                    errorField === ERROR_FIELD_PROFIT_LOSS.MIN_TRADING_FEE
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
            className={`${styles["result-container"]} ${styles["profit-loss"]}`}
          >
            <div className={`${styles["dec-container"]} ${styles["xm"]}`}>
              <div>Precision:</div>
              <Ranger
                min={0}
                max={5}
                defaultValue={decPrecision}
                onChange={(val) => setDecPrecision(val)}
              />
            </div>

            <div className={styles["result-wrapper"]}>
              <div className={`${styles["dec-container"]} ${styles["xl"]}`}>
                <div>Precision:</div>
                <Ranger
                  min={0}
                  max={5}
                  defaultValue={decPrecision}
                  onChange={(val) => setDecPrecision(val)}
                />
              </div>

              <div className={styles["row"]}>
                <div>Gross Entry Amount:</div>
                <div>
                  $
                  {convertToLocaleString(result.grossEntryAmount, decPrecision)}
                </div>
              </div>

              {result.entryFee !== undefined && (
                <div className={styles["row"]}>
                  <div>Entry Fee:</div>
                  <div>
                    ${convertToLocaleString(result.entryFee, decPrecision)}
                  </div>
                </div>
              )}

              {result.exitFee !== undefined && (
                <div className={styles["row"]}>
                  <div>Closing Fee:</div>
                  <div>
                    ${convertToLocaleString(result.exitFee, decPrecision)}
                  </div>
                </div>
              )}

              <br />
              <div className={styles["row"]}>
                <div>
                  {result.includeTradingFee ? "Gross" : "Total"}{" "}
                  {mathBigNum.largerEq(result.grossGained, 0) ? "Gain" : "Loss"}
                  :
                </div>
                <div>
                  ${convertToLocaleString(result.grossGained, decPrecision)}
                </div>
              </div>

              <div className={styles["row"]}>
                <div>
                  {result.includeTradingFee ? "Gross " : ""}
                  {mathBigNum.largerEq(result.grossGained, 0)
                    ? "Gain"
                    : "Loss"}{" "}
                  (%):
                </div>
                <div
                  className={
                    mathBigNum.largerEq(result.grossGained, 0)
                      ? ""
                      : styles["loss"]
                  }
                >
                  {convertToLocaleString(result.grossPercentage, decPrecision)}%
                </div>
              </div>

              {result.netGained !== undefined && (
                <div className={styles["row"]}>
                  <div>
                    Net{" "}
                    {mathBigNum.largerEq(result.netGained, 0) ? "Gain" : "Loss"}
                    :
                  </div>
                  <div>
                    ${convertToLocaleString(result.netGained, decPrecision)}
                  </div>
                </div>
              )}

              {result.netGained !== undefined &&
                result.netPercentage !== undefined && (
                  <div className={styles["row"]}>
                    <div>
                      Net{" "}
                      {mathBigNum.largerEq(result.netGained, 0)
                        ? "Gain"
                        : "Loss"}{" "}
                      (%):
                    </div>
                    <div
                      className={
                        mathBigNum.largerEq(result.netGained, 0)
                          ? ""
                          : styles["loss"]
                      }
                    >
                      {convertToLocaleString(
                        result.netPercentage,
                        decPrecision
                      )}
                      %
                    </div>
                  </div>
                )}
            </div>
          </Container>
        )}
      </div>
    </form>
  );
};

export default ProfitLossForm;
