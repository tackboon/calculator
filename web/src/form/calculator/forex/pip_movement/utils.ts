import {
  addBig,
  divideBig,
  mathBigNum,
  MILLION,
  multiplyBig,
  QUADRILLION,
  subtractBig,
} from "../../../../common/number/math";
import { parseBigNumberFromString } from "../../../../common/number/number";
import { checkMinMax } from "../../../../common/validation/calculator.validation";
import {
  ERROR_FIELD_PIP_MOVEMENT,
  PipMovementInputType,
  PipMovementResultType,
} from "./pip_movement.type";
import { getBaseAndQuote } from "../../../../common/forex/forex";
import { BigNumber } from "mathjs";

export const validatePipMovementInput = (
  input: PipMovementInputType
): { err: string; field: ERROR_FIELD_PIP_MOVEMENT | null } => {
  if (
    !checkMinMax(input.price, {
      min: 0,
      maxOrEqual: QUADRILLION,
    })
  ) {
    return {
      err: "Please enter a valid price.",
      field: ERROR_FIELD_PIP_MOVEMENT.PRICE,
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
      field: ERROR_FIELD_PIP_MOVEMENT.PIP_DECIMAL,
    };
  }

  if (
    !checkMinMax(input.pipSize, {
      minOrEqual: QUADRILLION.negated(),
      maxOrEqual: QUADRILLION,
    })
  ) {
    return {
      err: "Please enter a valid pip size.",
      field: ERROR_FIELD_PIP_MOVEMENT.PIP_SIZE,
    };
  }

  return { err: "", field: null };
};

export const calculateResult = (
  input: PipMovementInputType
): PipMovementResultType => {
  const price = parseBigNumberFromString(input.price);
  const pipDecimal = parseBigNumberFromString(input.pipDecimal);
  const pipSize = parseBigNumberFromString(input.pipSize);

  // pipMove = pipDecimal * pipSize
  const pipMove = multiplyBig(pipDecimal, pipSize);

  let increasedPrice: BigNumber | undefined;
  let decreasedPrice: BigNumber;
  if (mathBigNum.largerEq(pipSize, 0)) {
    increasedPrice = addBig(price, pipMove);
    decreasedPrice = subtractBig(price, pipMove);
  } else {
    decreasedPrice = addBig(price, pipMove);
  }

  return { increasedPrice, decreasedPrice };
};
