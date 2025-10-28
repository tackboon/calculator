import { FC, InputHTMLAttributes, useRef } from "react";

import styles from "./input.module.scss";

type NumArrInputProps = {
  isInvalid?: boolean;
  maxChars?: number;
  onChangeHandler?: (value: string) => void;
} & InputHTMLAttributes<HTMLInputElement>;

const NumArrInput: FC<NumArrInputProps> = ({
  isInvalid,
  maxChars = 300,
  value,
  className,
  onChangeHandler,
  onChange,
  onBlur,
  onKeyDown,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Remove leading or trailing commas
    let value = e.target.value.replace(/\s+/g, "").replace(/^,|,$/g, "");

    // Allow empty string
    if (value === "") {
      e.target.value = "";
      if (onChangeHandler) onChangeHandler("");
      if (onChange) onChange(e);
      return;
    }

    // Check comma-separated numbers pattern
    const validPattern = /^(\d{1,2})(,\d{1,2})*$/; // e.g. "1,2,3,10"
    if (!validPattern.test(value)) {
      // Reset if invalid
      e.target.value = "";
    } else {
      e.target.value = value;
    }

    if (onChangeHandler) onChangeHandler(e.target.value);
    if (onChange) onChange(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val.length > maxChars) val = val.slice(0, maxChars);

    e.target.value = val;
    if (onChangeHandler) onChangeHandler(e.target.value);
    if (onChange) onChange(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    try {
      if (e.key === "Enter") {
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
    <div className={`${styles["input-container"]} ${className}`}>
      <input
        ref={inputRef}
        className={styles["input"]}
        type="text"
        style={isInvalid ? { border: "1px solid red" } : {}}
        autoComplete="off"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        {...props}
      />
    </div>
  );
};

export default NumArrInput;
