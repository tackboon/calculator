import { bignumber, BigNumber } from "mathjs";
import { parseBigNumberFromString } from "../number/number";

export const checkMinMax = (
  input: string,
  option: {
    min?: number | BigNumber;
    max?: number | BigNumber;
    minOrEqual?: number | BigNumber;
    maxOrEqual?: number | BigNumber;
  }
): boolean => {
  const val = parseBigNumberFromString(input);
  if (val.isNaN()) return false;
  if (option.min !== undefined && val.lessThan(option.min)) return false;
  if (option.max !== undefined && val.greaterThan(option.max)) return false;
  if (
    option.minOrEqual !== undefined &&
    val.lessThanOrEqualTo(option.minOrEqual)
  )
    return false;
      if (
    option.maxOrEqual !== undefined &&
    val.greaterThanOrEqualTo(option.maxOrEqual)
  )
    return false;

  return true;
};
