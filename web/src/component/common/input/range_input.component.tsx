import { FC, InputHTMLAttributes, useLayoutEffect, useRef } from "react";

import styles from "./input.module.scss";

type RangeInputProps = {
  isInvalid?: boolean;
  maxChars?: number;
  onChangeHandler?: (value: string) => void;
} & InputHTMLAttributes<HTMLInputElement>;

const RangeInput: FC<RangeInputProps> = ({
  isInvalid,
  maxChars = 40,
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
    let value = e.target.value;

    // Allow empty string
    if (value === "") {
      e.target.value = "";
      if (onChangeHandler) onChangeHandler("");
      if (onChange) onChange(e);
      return;
    }

    // Sanitize input
    const parts = value.split("-");
    const nums = parts.map((val) => (val === "" ? NaN : Number(val)));

    if (nums.length === 1 && !isNaN(nums[0])) {
      value = `${nums[0]}`;
    } else if (nums.length === 2) {
      if (!isNaN(nums[0]) && !isNaN(nums[1])) {
        if (nums[0] === nums[1]) {
          value = `${nums[0]}`;
        } else if (nums[0] > nums[1]) {
          value = `${nums[0]}`;
        } else {
          value = `${nums[0]}-${nums[1]}`;
        }
      } else if (isNaN(nums[1])) {
        value = `${nums[0]}`;
      } else {
        value = `${nums[1]}`;
      }
    } else {
      value = "";
    }

    e.target.value = value;
    if (onChangeHandler) onChangeHandler(e.target.value);
    if (onChange) onChange(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const prevCursorPos = e.target.selectionStart ?? 0;

    // Allow digits and '-' only
    let val = e.target.value.replace(/[^0-9-]/g, "");

    // Keep only the first '-'
    const firstDashIndex = val.indexOf("-");
    if (firstDashIndex !== -1) {
      // Remove all other '-' beyond the first one
      val =
        val.slice(0, firstDashIndex + 1) +
        val.slice(firstDashIndex + 1).replace(/-/g, "");
    }

    // Remove overflow characters
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

export default RangeInput;
