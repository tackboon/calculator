import {
  divideBig,
  mathBigNum,
  multiplyBig,
  QUADRILLION,
} from "../../../../common/number/math";
import { parseBigNumberFromString } from "../../../../common/number/number";
import { checkMinMax } from "../../../../common/validation/calculator.validation";
import {
  ERROR_FIELD_MARGIN,
  MarginInputType,
  MarginResultType,
} from "./margin.type";
import { getBaseAndQuote } from "../../../../common/forex/forex";

export const validateMarginInput = (
  input: MarginInputType
): { err: string; field: ERROR_FIELD_MARGIN | null } => {
  if (
    input.basePair !== "" &&
    !checkMinMax(input.baseCrossRate, { min: 0, maxOrEqual: QUADRILLION })
  ) {
    return {
      err: "Please enter a valid currency rate.",
      field: ERROR_FIELD_MARGIN.BASE_CROSS_RATE,
    };
  }

  if (
    !checkMinMax(input.positionSize, {
      min: 0,
      maxOrEqual: QUADRILLION,
    })
  ) {
    return {
      err: "Please enter a valid position size.",
      field: ERROR_FIELD_MARGIN.POSITION_SIZE,
    };
  }

  return { err: "", field: null };
};

export const calculateResult = (input: MarginInputType): MarginResultType => {
  const positionSize = parseBigNumberFromString(input.positionSize);

  // Get base rate (XXXUSD)
  let baseRate = mathBigNum.bignumber(1);
  if (input.basePair === "") {
    baseRate = mathBigNum.bignumber(1);
  } else {
    const baseRateInfo = getBaseAndQuote(input.basePair);
    const baseCrossRate = parseBigNumberFromString(input.baseCrossRate);
    baseRate =
      baseRateInfo.quote === input.accBaseCurrency
        ? baseCrossRate
        : divideBig(1, baseCrossRate);
  }

  // margin = positionSize * baseRate / leverage
  const margin = multiplyBig(positionSize, divideBig(baseRate, input.leverage));

  return { accBaseCurrency: input.accBaseCurrency, margin };
};
