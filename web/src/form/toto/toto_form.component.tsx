import { useEffect, useRef, useState } from "react";

import { calculateResult, validateTotoInput } from "./utils.component";

import styles from "./toto.module.scss";
import { ERROR_FIELD_TOTO, TotoInputType, TotoResultType } from "./toto.type";
import Button from "../../component/common/button/button.component";
import Container from "../../component/common/container/container.component";

const DEFAULT_INPUT: TotoInputType = {
  price: "0",
  percentage: "0",
};

const TotoForm = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [errorField, setErrorField] = useState<ERROR_FIELD_TOTO | null>(null);
  const [input, setInput] = useState<TotoInputType>(DEFAULT_INPUT);

  const [result, setResult] = useState<TotoResultType | null>(null);
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
    const { err, field } = validateTotoInput(input);
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
      <h1>Toto Generator</h1>

      <p className={styles["description"]}>
        This calculator helps you determine how a stock’s price changes with a
        given percentage. Enter the price and percentage, and it will calculate
        both the upward and downward price levels — ideal for setting targets,
        stop-loss points, or analyzing potential market moves.
      </p>

      <div>
        {/* <div className={styles["form-group"]}>
          <label htmlFor="price">Price</label>
          <NumberInput
            id="price"
            preUnit="$"
            isInvalid={errorField === ERROR_FIELD_PRICE_PERCENTAGE.PRICE}
            minDecimalPlace={2}
            maxDecimalPlace={5}
            value={input.price}
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, price: val }))
            }
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="percentage">Percentage</label>
          <NumberInput
            id="percentage"
            postUnit="%"
            minDecimalPlace={2}
            maxDecimalPlace={5}
            isInvalid={errorField === ERROR_FIELD_PRICE_PERCENTAGE.PERCENTAGE}
            value={input.percentage}
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, percentage: val }))
            }
          />
        </div> */}

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
              <div className={styles["row"]}>
                <div>Numbers:</div>
                <div></div>
              </div>
            </div>
          </Container>
        )}
      </div>
    </form>
  );
};

export default TotoForm;
