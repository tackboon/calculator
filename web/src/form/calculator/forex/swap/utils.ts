import {
  divideBig,
  mathBigNum,
  MILLION,
  multiplyBig,
  QUADRILLION,
} from "../../../../common/number/math";
import { parseBigNumberFromString } from "../../../../common/number/number";
import { checkMinMax } from "../../../../common/validation/calculator.validation";
import { ERROR_FIELD_SWAP, SwapInputType, SwapResultType } from "./swap.type";
import { getBaseAndQuote } from "../../../../common/forex/forex";

export const validateSwapInput = (
  input: SwapInputType
): { err: string; field: ERROR_FIELD_SWAP | null } => {
  if (
    input.quotePair !== "" &&
    !checkMinMax(input.quoteCrossRate, { min: 0, maxOrEqual: QUADRILLION })
  ) {
    return {
      err: "Please enter a valid currency rate.",
      field: ERROR_FIELD_SWAP.QUOTE_CROSS_RATE,
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
      field: ERROR_FIELD_SWAP.POSITION_SIZE,
    };
  }

  if (
    !checkMinMax(input.pipDecimal, {
      minOrEqual: 0,
      max: 100000,
    })
  ) {
    return {
      err: "Please enter a valid pip decimal.",
      field: ERROR_FIELD_SWAP.PIP_DECIMAL,
    };
  }

  if (
    !checkMinMax(input.swapPerLot, {
      minOrEqual: QUADRILLION.negated(),
      maxOrEqual: QUADRILLION,
    })
  ) {
    return {
      err: "Please enter a valid swap value.",
      field: ERROR_FIELD_SWAP.SWAP_PER_LOT,
    };
  }

  if (
    !checkMinMax(input.period, {
      min: 0,
      maxOrEqual: MILLION,
    })
  ) {
    return {
      err: "Please enter a valid period.",
      field: ERROR_FIELD_SWAP.PERIOD,
    };
  }

  return { err: "", field: null };
};

export const calculateResult = (input: SwapInputType): SwapResultType => {
  const positionSize = parseBigNumberFromString(input.positionSize);
  const pipDecimal = parseBigNumberFromString(input.pipDecimal);
  const swapFee = parseBigNumberFromString(input.swapPerLot);
  const period = parseBigNumberFromString(input.period);

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

  // swap = period * swapFee * pipValue / 10
  const swapValue = multiplyBig(
    period,
    multiplyBig(swapFee, divideBig(pipValue, 10))
  );

  return {
    accBaseCurrency: input.accBaseCurrency,
    swapValue,
  };
};
