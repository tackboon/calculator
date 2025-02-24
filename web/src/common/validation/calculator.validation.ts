import { parseNumberFromString } from "../number/number";

export const checkMinMax = (
  input: string,
  min?: number,
  max?: number
): boolean => {
  const val = parseNumberFromString(input);
  if (isNaN(val)) return false;
  if (min !== undefined && val < min) return false;
  if (max !== undefined && val > max) return false;

  return true;
};
