import React, { useEffect, useRef, useState } from "react";

import {
  calculateResult,
  validatePricePercentageInput,
} from "./utils.component";

import styles from "../stock_calculator_form.module.scss";
import Button from "../../../../component/common/button/button.component";
import Container from "../../../../component/common/container/container.component";
import NumberInput from "../../../../component/common/input/number_input.component";

export type PricePercentageInputType = {
  price: string;
  percentage: string;
};

const DEFAULT_INPUT: PricePercentageInputType = {
  price: "0",
  percentage: "0",
};

export enum ERROR_FIELD_PRICE_PERCENTAGE {
  PRICE,
  PERCENTAGE,
}

export type PricePercentageResultType = {
  increasedPrice?: number;
  decreasedPrice?: number;
};

const PricePercentageForm = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [errorField, setErrorField] =
    useState<ERROR_FIELD_PRICE_PERCENTAGE | null>(null);
  const [input, setInput] = useState<PricePercentageInputType>(DEFAULT_INPUT);

  const [result, setResult] = useState<PricePercentageResultType | null>(null);
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
    const { err, field } = validatePricePercentageInput(input);
    setErrorMessage(err);
    setErrorField(field);
    if (err !== "") return;

    // Handle calculation
    setResult(calculateResult(input));
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage("");
    setInput(DEFAULT_INPUT);
    setErrorField(null);
    setResult(null);
  };

  return (
    <form className={styles["form-wrapper"]} onSubmit={handleSubmit}>
      <p className={styles["description"]}>
        This calculator helps you quickly determine the price increase or
        decrease based on a given percentage. Simply enter the stock price and
        percentage, and the calculator will return the price levels for both
        upward and downward movements. This tool is useful for setting price
        targets, stop-loss levels, and evaluating potential price changes.
      </p>

      <div>
        <div className={styles["form-group"]}>
          <label htmlFor="price">Price</label>
          <NumberInput
            id="price"
            preUnit="$"
            isInvalid={errorField === ERROR_FIELD_PRICE_PERCENTAGE.PRICE}
            minDecimalPlace={2}
            maxDecimalPlace={4}
            value={input.price}
            onChangeHandler={(val) => setInput({ ...input, price: val })}
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="percentage">Percentage</label>
          <NumberInput
            id="percentage"
            postUnit="%"
            minDecimalPlace={2}
            maxDecimalPlace={4}
            isInvalid={errorField === ERROR_FIELD_PRICE_PERCENTAGE.PERCENTAGE}
            value={input.percentage}
            onChangeHandler={(val) => setInput({ ...input, percentage: val })}
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
          <Container
            className={`${styles["result-container"]} ${styles["price-percentage"]}`}
          >
            <div className={styles["result-wrapper"]}>
              {result.increasedPrice !== undefined && (
                <div className={styles["row"]}>
                  <div>Increased Price:</div>
                  <div>
                    $
                    {result.increasedPrice.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    })}
                  </div>
                </div>
              )}

              {result.decreasedPrice !== undefined && (
                <div className={styles["row"]}>
                  <div>Decreased Price:</div>
                  <div>
                    $
                    {result.decreasedPrice.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    })}
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

export default PricePercentageForm;
