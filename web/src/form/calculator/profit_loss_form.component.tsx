import React, { useState } from "react";

import styles from "./calculator_form.module.scss";
import Button from "../../component/button/button.component";
import Input from "../../component/input/input.component";
import { ValidatePrice } from "../../common/validation/calculator.validation";
import Container from "../../component/container/container.component";
import Toggle from "../../component/toggle/toggle.component";

type InputType = {
  tradeInPrice: string;
  tradeOutPrice: string;
  quantity: string;
  isLong: boolean;
};

type ResultType = {
  totalGained: number;
  percentage: number;
};

const ProfitLossForm = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [input, setInput] = useState<InputType>({
    tradeInPrice: "",
    tradeOutPrice: "",
    quantity: "",
    isLong: true,
  });
  const [result, setResult] = useState<ResultType | null>(null);

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Handle validation
    const tradeInValue = ValidatePrice("Trade in price", input.tradeInPrice, 4);
    if (tradeInValue.errorMessage !== "") {
      setErrorMessage(tradeInValue.errorMessage);
      return;
    }

    const quantityValue = ValidatePrice("Quantity", input.quantity, 0);
    if (quantityValue.errorMessage !== "") {
      setErrorMessage(quantityValue.errorMessage);
      return;
    }

    const tradeOutValue = ValidatePrice(
      "Trade out price",
      input.tradeOutPrice,
      4
    );
    if (tradeOutValue.errorMessage !== "") {
      setErrorMessage(tradeOutValue.errorMessage);
      return;
    }

    setInput({
      tradeInPrice: tradeInValue.formattedValue,
      quantity: quantityValue.formattedValue,
      tradeOutPrice: tradeOutValue.formattedValue,
      isLong: input.isLong,
    });
    setErrorMessage("");

    // Parse inputs
    const tradeInPrice = parseFloat(input.tradeInPrice);
    const tradeOutPrice = parseFloat(input.tradeOutPrice);
    const quantity = parseInt(input.quantity, 10);

    // Handle calculation
    const diff = input.isLong
      ? tradeOutPrice - tradeInPrice
      : tradeInPrice - tradeOutPrice;
    const gainOrLoss = diff * quantity;
    const percentage = (diff / tradeInPrice) * 100;

    setResult({
      totalGained: gainOrLoss,
      percentage: percentage,
    });
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage("");
    setInput({
      tradeInPrice: "",
      tradeOutPrice: "",
      quantity: "",
      isLong: input.isLong,
    });
    setResult(null);
  };

  const handleToggle = (state: boolean) => {
    setInput({ ...input, isLong: state });
  };

  return (
    <form className={styles["form-wrapper"]} onSubmit={handleSubmit}>
      <p className={styles["description"]}>
        This calculator helps you calculate the profit or loss from your trades.
        It takes your trade-in price, trade-out price, and quantity of assets
        and computes the total gain or loss along with the percentage change.
      </p>

      <div className={styles["toggle-wrapper"]}>
        <Toggle
          onTitle="Long"
          offTitle="Short"
          defaultState
          onToggle={handleToggle}
        />
      </div>

      <div>
        <div className={styles["form-group"]}>
          <label htmlFor="trade-in">Trade in Price</label>
          <Input
            type="number"
            id="trade-in"
            placeholder="Enter your trade in price"
            value={input.tradeInPrice}
            onChange={(e) =>
              setInput({ ...input, tradeInPrice: e.target.value })
            }
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="quantity">Quantity</label>
          <Input
            type="number"
            id="quantity"
            placeholder="Enter your stock quantity"
            value={input.quantity}
            onChange={(e) => setInput({ ...input, quantity: e.target.value })}
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="trade-out">Trade out Price</label>
          <Input
            type="number"
            id="trade-out"
            placeholder="Enter your trade out price"
            value={input.tradeOutPrice}
            onChange={(e) =>
              setInput({ ...input, tradeOutPrice: e.target.value })
            }
          />
        </div>

        <p className={styles["error"]}>{errorMessage}</p>
      </div>

      <div className={styles["form-btn"]}>
        <Button
          className={styles["reset-btn"]}
          type="reset"
          onClick={handleReset}
        >
          Reset
        </Button>
        <Button className={styles["submit-btn"]} type="submit">
          Calculate
        </Button>
      </div>

      {result && (
        <Container className={styles["result"]}>
          <p className={result.totalGained >= 0 ? "" : styles["loss"]}>
            Total {result.totalGained >= 0 ? "Gain" : "Loss"}: $
            {Math.abs(result.totalGained).toFixed(4)}
          </p>
          <p>
            {result.totalGained >= 0 ? "Gain" : "Loss"} Percentage:{" "}
            <span className={result.totalGained >= 0 ? "" : styles["loss"]}>
              {Math.abs(result.percentage).toFixed(2)}%
            </span>
          </p>
        </Container>
      )}
    </form>
  );
};

export default ProfitLossForm;
