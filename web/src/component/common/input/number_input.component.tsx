import React, { FC, InputHTMLAttributes, useLayoutEffect, useRef } from "react";

import styles from "./input.module.scss";
import {
  convertToLocaleString,
  parseBigNumberFromString,
} from "../../../common/number/number";
import { mathBigNum } from "../../../common/number/math";
import { BigNumber } from "mathjs";

type NumberInputProps = {
  preUnit?: string;
  postUnit?: string;
  isInvalid?: boolean;
  maxChars?: number;
  allowPlusMinus?: boolean;
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
    // Fix multiple dot entries (1.2.34 => 1.234)
    input = input.replace(/(\d*\.\d*)\./g, "$1");

    // Evaluate equation
    const res = mathBigNum.evaluate(input.replace(/,/g, "")) as BigNumber;
    if (res) {
      return convertToLocaleString(res, minDecimalPlace, maxDecimalPlace);
    } else if (res === 0) {
      return "0";
    }
  } catch (err) {
    return "0";
  }

  return input;
};

const NumberInput: FC<NumberInputProps> = ({
  preUnit,
  postUnit,
  isInvalid,
  maxChars = 40,
  allowPlusMinus = true,
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
  const caretPosRef = useRef(0);

  useLayoutEffect(() => {
    if (!inputRef.current) return;

    const pos = caretPosRef.current;
    inputRef.current.setSelectionRange(pos, pos);
  });

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Fix multiple dot entries (1.2.34 => 1.234)
    e.target.value = e.target.value.replace(/,/g, "");

    // Select all content on focus
    e.target.select();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const prevCursorPos = e.target.selectionStart ?? 0;

    // Allow digits, arithmetic operators (+, -, *, /, (, )) and decimal points
    let val = allowPlusMinus
      ? e.target.value.replace(/[^0-9+\-*/().,]/g, "")
      : e.target.value.replace(/[^0-9.,]/g, "");

    // Remove overflow characters
    if (val.length > maxChars) val = val.slice(0, maxChars);

    // Count removed chars
    const diff = e.target.value.length - val.length;
    caretPosRef.current = prevCursorPos - diff;

    if (onChangeHandler) onChangeHandler(val);
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
    if (inputVal === "") return;

    if (step) {
      // Ensure step is a number
      let stepValue = typeof step === "string" ? parseFloat(step) : step;
      if (isNaN(stepValue) && stepValue === 0) return;

      if (!isIncr) stepValue = stepValue * -1;
      inputVal = mathBigNum
        .add(
          parseBigNumberFromString(inputVal),
          mathBigNum.bignumber(stepValue)
        )
        .toFixed();
    }

    // Apply rounding if decimalPlace is defined
    inputVal = convertToLocaleString(
      inputVal,
      minDecimalPlace,
      maxDecimalPlace
    );

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
