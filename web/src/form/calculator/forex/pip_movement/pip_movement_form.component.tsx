import React, { useEffect, useRef, useState } from "react";

import { calculateResult, validatePipMovementInput } from "./utils";

import styles from "../forex_calculator_form.module.scss";
import Button from "../../../../component/common/button/button.component";
import Container from "../../../../component/common/container/container.component";
import NumberInput from "../../../../component/common/input/number_input.component";
import {
  ERROR_FIELD_PIP_MOVEMENT,
  PipMovementInputType,
  PipMovementResultType,
} from "./pip_movement.type";
import { convertToLocaleString } from "../../../../common/number/number";
import { useSelector } from "react-redux";
import { selectForexSupportedAssets } from "../../../../store/forex/forex.selector";
import PairSelectBox from "../../../../component/forex/pair_select_box/pair.component";

const DEFAULT_INPUT: PipMovementInputType = {
  currencyPair: "EUR/USD",
  price: "0",
  pipDecimal: "0.0001",
  pipSize: "0",
};

const ForexPipMovementForm = () => {
  const supportedAssets = useSelector(selectForexSupportedAssets);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorField, setErrorField] = useState<ERROR_FIELD_PIP_MOVEMENT | null>(
    null
  );
  const [input, setInput] = useState<PipMovementInputType>(DEFAULT_INPUT);

  const [result, setResult] = useState<PipMovementResultType | null>(null);
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
    const { err, field } = validatePipMovementInput(input);
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
      currencyPair: prev.currencyPair,
      pipDecimal: `${supportedAssets[prev.currencyPair].pip}`,
    }));
    setErrorField(null);
    setResult(null);
  };

  return (
    <form className={styles["form-wrapper"]} onSubmit={handleSubmit}>
      <p className={styles["description"]}>
        This calculator helps you determine the price change based on pip
        movement. Select your currency pair, enter the current price and the
        number of pips, and the calculator will show the resulting price after
        the pip increase or decrease.
      </p>

      <div>
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
                  currencyPair: pair,
                };
              });
            }}
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="price">Price</label>
          <NumberInput
            id="price"
            step={input.pipDecimal}
            preUnit="$"
            isInvalid={errorField === ERROR_FIELD_PIP_MOVEMENT.PRICE}
            minDecimalPlace={2}
            maxDecimalPlace={5}
            value={input.price}
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, price: val }))
            }
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="pip-decimal">Pip in Decimals</label>
          <NumberInput
            id="pip-decimal"
            step={0.0001}
            maxLength={10}
            isInvalid={errorField === ERROR_FIELD_PIP_MOVEMENT.PIP_DECIMAL}
            minDecimalPlace={0}
            maxDecimalPlace={5}
            value={input.pipDecimal}
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, pipDecimal: val }))
            }
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="pip-size">Pip Size</label>
          <NumberInput
            id="pip-size"
            step={1}
            isInvalid={errorField === ERROR_FIELD_PIP_MOVEMENT.PIP_SIZE}
            minDecimalPlace={0}
            maxDecimalPlace={1}
            value={input.pipSize}
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, pipSize: val }))
            }
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
            className={`${styles["result-container"]} ${styles["result-margin"]}`}
          >
            <div className={styles["result-wrapper"]}>
              {result.increasedPrice !== undefined && (
                <div className={styles["row"]}>
                  <div>Increased Price:</div>
                  <div>${convertToLocaleString(result.increasedPrice)}</div>
                </div>
              )}

              <div className={styles["row"]}>
                <div>Decreased Price:</div>
                <div>${convertToLocaleString(result.decreasedPrice)}</div>
              </div>
            </div>
          </Container>
        )}
      </div>
    </form>
  );
};

export default ForexPipMovementForm;
