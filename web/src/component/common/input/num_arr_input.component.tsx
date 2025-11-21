import { FC, InputHTMLAttributes, useLayoutEffect, useRef } from "react";

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
  const caretPosRef = useRef(0);

  useLayoutEffect(() => {
    if (!inputRef.current) return;

    const pos = caretPosRef.current;
    inputRef.current.setSelectionRange(pos, pos);
  });

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Remove leading or trailing commas
    let value = e.target.value.replace(/\s+/g, "").replace(/^,|,$/g, "");

    // Prevent consecutive commas (",,")
    value = value.replace(/,+/g, ",");

    // Allow empty string
    if (value === "") {
      e.target.value = "";
      if (onChangeHandler) onChangeHandler("");
      if (onChange) onChange(e);
      return;
    }

    e.target.value = value;

    if (onChangeHandler) onChangeHandler(e.target.value);
    if (onChange) onChange(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const prevCursorPos = e.target.selectionStart ?? 0;

    // Keep only digits and commas
    let val = e.target.value.replace(/[^0-9,]/g, "");

    // Remvoe overflow characters
    if (val.length > maxChars) val = val.slice(0, maxChars);

    // Count removed chars
    const diff = e.target.value.length - val.length;
    caretPosRef.current = prevCursorPos - diff;

    if (onChangeHandler) onChangeHandler(val);
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
