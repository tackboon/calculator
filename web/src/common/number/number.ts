import { BigNumber } from "mathjs";
import { mathBigNum } from "./math";

export function convertToLocaleString(
  input: string,
  minFractionDigits?: number,
  maxFractionDigits?: number
): string {
  try {
    let num = mathBigNum.bignumber(input);
    if (num.isNaN() || mathBigNum.equal(num, 0)) return "0";

    if (maxFractionDigits !== undefined) {
      num = mathBigNum.round(num, maxFractionDigits);
    }

    // Trim or pad decimal part
    let [intPart, decPart = ""] = num.toString().split(".");
    if (minFractionDigits !== undefined && decPart.length < minFractionDigits) {
      decPart = decPart.padEnd(minFractionDigits, "0");
    }

    // Format integer part with commas (en-US)
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return decPart ? `${intPart}.${decPart}` : intPart;
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

  return mathBigNum.bignumber(str);
};
