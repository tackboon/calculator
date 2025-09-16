import { BigNumber } from "mathjs";
import { divideBig, mathBigNum } from "./number/math";

export const convertRatioToString = (ratio: BigNumber, precision: number) => {
  let roundedRatio = mathBigNum.round(ratio, precision);

  let ratioStr = "1:1";
  if (mathBigNum.largerEq(roundedRatio, 1)) {
    ratioStr = `${roundedRatio}:1`;
  } else {
    ratio = divideBig(1, ratio);
    roundedRatio = mathBigNum.round(ratio, precision);
    ratioStr = `1:${roundedRatio}`;
  }

  return ratioStr;
};
