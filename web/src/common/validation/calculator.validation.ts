import { BigNumber } from "mathjs";
import { parseBigNumberFromString } from "../number/number";

export const checkMinMax = (
  input: string,
  min?: number | BigNumber,
  max?: number | BigNumber
): boolean => {
  const val = parseBigNumberFromString(input);
  if (val.isNaN()) return false;
  if (min !== undefined && val.lessThan(min)) return false;
  if (max !== undefined && val.greaterThan(max)) return false;

  return true;
};
