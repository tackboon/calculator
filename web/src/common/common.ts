import { BigNumber } from "mathjs";
import { mathBigNum } from "./number/math";

export const convertRatioToString = (ratio: BigNumber, precision: number) => {
  let roundedRatio = mathBigNum.round(ratio, precision);
  return `1:${roundedRatio}`;
};
