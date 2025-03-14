import React, { FC, InputHTMLAttributes, useRef } from "react";
import { evaluate } from "mathjs";

import styles from "./input.module.scss";
import { parseNumberFromString } from "../../../common/number/number";

type NumberInputProps = {
  preUnit?: string;
  postUnit?: string;
  isInvalid?: boolean;
  minDecimalPlace: number;
  maxDecimalPlace: number;
  onChangeHandler?: (value: string) => void;
} & InputHTMLAttributes<HTMLInputElement>;

const evalInput = (
  input: string,
  minDecimalPlace: number,
  maxDecimalPlace: number
): string => {
  if (input === "") return "0";

  try {
    const res = evaluate(input.replace(/,/g, ""));
    if (res) {
      let numVal = parseFloat(res);
      if (isNaN(numVal)) return res;

      const rounded = numVal.toLocaleString("en-US", {
        minimumFractionDigits: minDecimalPlace,
        maximumFractionDigits: maxDecimalPlace,
      });
      return parseFloat(rounded) === 0 ? "0" : rounded;
    } else if (res === 0) {
      return "0";
    }
  } catch {}

  return input;
};

const NumberInput: FC<NumberInputProps> = ({
  preUnit,
  postUnit,
  isInvalid,
  minDecimalPlace,
  maxDecimalPlace,
  value,
  step = 1,
  className,
  onChangeHandler,
  onChange,
  onBlur,
  onKeyDown,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select(); // Select all content on focus
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow digits, arithmetic operators (+, -, *, /, (, )) and decimal points
    e.target.value = e.target.value.replace(/[^0-9+\-*/().,]/g, "");
    if (onChangeHandler) onChangeHandler(e.target.value);
    if (onChange) onChange(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.value = evalInput(
      e.target.value,
      minDecimalPlace,
      maxDecimalPlace
    );
    if (onChangeHandler) onChangeHandler(e.target.value);
    if (onBlur) onBlur(e);
  };

  const handleIncrement = (isIncr: boolean, shouldEvalInput: boolean) => {
    if (!inputRef || !inputRef.current) return;

    let inputVal = "";
    if (shouldEvalInput) {
      inputVal = evalInput(
        inputRef.current.value,
        minDecimalPlace,
        maxDecimalPlace
      );
    } else {
      inputVal = inputRef.current.value;
    }

    let numVal = parseNumberFromString(inputVal);
    if (isNaN(numVal)) return;

    if (step) {
      // Ensure step is a number
      const stepValue = typeof step === "string" ? parseFloat(step) : step;
      if (isNaN(stepValue) && stepValue === 0) return;

      numVal = isIncr ? (numVal += stepValue) : (numVal -= stepValue);
    }

    // Apply rounding if decimalPlace is defined
    const rounded = numVal.toLocaleString("en-US", {
      minimumFractionDigits: minDecimalPlace,
      maximumFractionDigits: maxDecimalPlace,
    });
    inputVal = parseFloat(rounded) === 0 ? "0" : rounded;

    inputRef.current.value = inputVal;
    if (onChangeHandler) onChangeHandler(inputVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    try {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        handleIncrement(e.key === "ArrowUp", true);
      } else if (e.key === "Enter") {
        e.preventDefault();

        // Blur the input to remove focus after pressing Enter
        (e.target as HTMLInputElement).blur();

        // Delay of 0 to ensure form submission in the next event loop tick and
        // trigger after onBlur completes
        setTimeout(() => {
          if (!inputRef || !inputRef.current) return;

          const form = inputRef.current.closest("form");
          if (form) {
            e.preventDefault();

            form.dispatchEvent(
              new Event("submit", { bubbles: true, cancelable: true })
            );
          }
        }, 0);
      }
    } finally {
      if (onKeyDown) onKeyDown(e);
    }
  };

  return (
    <div
      className={`${styles["input-container"]} ${styles["number"]} ${className}`}
    >
      {preUnit && value && value.toString().length > 0 && (
        <span className={styles["pre-unit"]}>{preUnit}</span>
      )}
      {postUnit && value && value.toString().length > 0 && (
        <span className={styles["post-unit"]}>{postUnit}</span>
      )}
      <input
        ref={inputRef}
        className={`${styles["input"]} ${styles["arrows"]} ${
          preUnit && value && value.toString().length > 0
            ? styles["pre-unit-input"]
            : ""
        } ${
          postUnit && value && value.toString().length > 0
            ? styles["post-unit-input"]
            : ""
        }`}
        type="text"
        style={isInvalid ? { border: "1px solid red" } : {}}
        autoComplete="off"
        value={value}
        onFocus={handleFocus}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        {...props}
      />
      <div
        className={`${styles["arrow-buttons"]} ${
          postUnit && value && value.toString().length > 0
            ? styles["post-unit-input"]
            : ""
        }`}
      >
        <span
          onClick={() => handleIncrement(true, false)}
          className={styles["arrow-up"]}
        >
          ▲
        </span>
        <span
          onClick={() => handleIncrement(false, false)}
          className={styles["arrow-down"]}
        >
          ▼
        </span>
      </div>
    </div>
  );
};

export default NumberInput;
