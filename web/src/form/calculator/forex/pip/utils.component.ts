import {
  divideBig,
  mathBigNum,
  MILLION,
  multiplyBig,
  QUADRILLION,
} from "../../../../common/number/math";
import { parseBigNumberFromString } from "../../../../common/number/number";
import { checkMinMax } from "../../../../common/validation/calculator.validation";
import { ERROR_FIELD_PIP, PipInputType, PipResultType } from "./pip.type";
import { getBaseAndQuote } from "../../../../common/forex/forex";

export const validatePipInput = (
  input: PipInputType
): { err: string; field: ERROR_FIELD_PIP | null } => {
  if (
    input.quotePair !== "" &&
    !checkMinMax(input.quoteCrossRate, { min: 0, maxOrEqual: QUADRILLION })
  ) {
    return {
      err: "Please enter a valid currency rate.",
      field: ERROR_FIELD_PIP.QUOTE_CROSS_RATE,
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
      field: ERROR_FIELD_PIP.POSITION_SIZE,
    };
  }

  if (
    !checkMinMax(input.pipDecimal, {
      minOrEqual: 0,
      maxOrEqual: MILLION,
    })
  ) {
    return {
      err: "Please enter a valid pip decimal.",
      field: ERROR_FIELD_PIP.PIP_DECIMAL,
    };
  }

  return { err: "", field: null };
};

export const calculateResult = (input: PipInputType): PipResultType => {
  const positionSize = parseBigNumberFromString(input.positionSize);
  const pipDecimal = parseBigNumberFromString(input.pipDecimal);

  // Get quote rate (XXXUSD)
  let quoteRate = mathBigNum.bignumber(1);
  if (input.quotePair === "") {
    quoteRate = mathBigNum.bignumber(1);
  } else {
    const quoteRateInfo = getBaseAndQuote(input.quotePair);
    const quoteCrossRate = parseBigNumberFromString(input.quoteCrossRate);
    quoteRate =
      quoteRateInfo.quote === input.accBaseCurrency
        ? quoteCrossRate
        : divideBig(1, quoteCrossRate);
  }

  // pipValue = pipDecimal * positionSize * quoteRate
  const pipValue = multiplyBig(
    pipDecimal,
    multiplyBig(positionSize, quoteRate)
  );

  return { accBaseCurrency: input.accBaseCurrency, pipValue };
};
