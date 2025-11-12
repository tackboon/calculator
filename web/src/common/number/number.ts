import { BigNumber } from "mathjs";
import { mathBigNum } from "./math";

export function convertToLocaleString(
  input: string | BigNumber | number,
  min = 2,
  max = 5
): string {
  try {
    let num =
      typeof input === "string" || typeof input === "number"
        ? mathBigNum.bignumber(input)
        : input;
    if (num.isNaN() || mathBigNum.equal(num, 0)) return "0";

    num = mathBigNum.round(num, max);
    const s = num.toFixed();
    let [i, dRaw = ""] = s.split(".");

    // Format integer part with commas (en-US)
    i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    if (max === 0) return i;

    let d = dRaw;

    if (dRaw.length <= min) {
      d = dRaw.padEnd(min, "0");
    } else {
      const trimmed = dRaw.replace(/0+$/, "");
      d = trimmed.length < min ? dRaw.slice(0, min) : trimmed;
    }

    return d.length
      ? `${i}.${d}`
      : `${i}${min > 0 ? "." + "0".repeat(min) : ""}`;
  } catch {
    return "";
  }
}

export const parseNumberFromString = (
  str: string,
  locale = "en-US"
): number => {
  if (locale === "de-DE") {
    // German format: 1.234.567,89
    str = str.replace(/[.,]/g, (match) => (match === "," ? "." : ""));
  } else if (locale === "en-US") {
    // US format: 1,234,567.89
    str = str.replace(/,/g, "");
  }

  return parseFloat(str);
};

export const parseBigNumberFromString = (
  str: string,
  locale = "en-US"
): BigNumber => {
  if (locale === "de-DE") {
    // German format: 1.234.567,89
    str = str.replace(/[.,]/g, (match) => (match === "," ? "." : ""));
  } else if (locale === "en-US") {
    // US format: 1,234,567.89
    str = str.replace(/,/g, "");
  }

  let out = mathBigNum.bignumber(0);
  try {
    out = mathBigNum.bignumber(str);
  } catch {}

  return out;
};
