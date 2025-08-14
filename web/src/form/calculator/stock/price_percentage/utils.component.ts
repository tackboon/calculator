import { BigNumber } from "mathjs";
import {
  addBig,
  divideBig,
  mathBigNum,
  multiplyBig,
  QUADRILLION,
  subtractBig,
} from "../../../../common/number/math";
import {
  convertToLocaleString,
  parseBigNumberFromString,
} from "../../../../common/number/number";
import { checkMinMax } from "../../../../common/validation/calculator.validation";
import {
  ERROR_FIELD_PRICE_PERCENTAGE,
  PricePercentageInputType,
  PricePercentageResultType,
} from "./price_percentage.type";

export const validatePricePercentageInput = (
  input: PricePercentageInputType
): { err: string; field: ERROR_FIELD_PRICE_PERCENTAGE | null } => {
  if (!checkMinMax(input.price, { min: 0, maxOrEqual: QUADRILLION })) {
    return {
      err: "Please enter a valid price.",
      field: ERROR_FIELD_PRICE_PERCENTAGE.PRICE,
    };
  }

  if (
    !checkMinMax(input.percentage, {
      minOrEqual: QUADRILLION.negated(),
      maxOrEqual: QUADRILLION,
    })
  ) {
    return {
      err: "Please enter a valid percentage.",
      field: ERROR_FIELD_PRICE_PERCENTAGE.PERCENTAGE,
    };
  }

  return { err: "", field: null };
};

export const calculateResult = (
  input: PricePercentageInputType
): PricePercentageResultType => {
  let increasedPrice: BigNumber | undefined;
  let decreasedPrice: BigNumber | undefined;

  const price = parseBigNumberFromString(input.price);
  const percentage = parseBigNumberFromString(input.percentage);

  if (mathBigNum.largerEq(percentage, 0)) {
    // increasedPrice = price * (1 + percentage / 100);
    increasedPrice = multiplyBig(price, addBig(1, divideBig(percentage, 100)));

    // decreasedPrice = price * (1 - percentage / 100);
    decreasedPrice = multiplyBig(
      price,
      subtractBig(1, divideBig(percentage, 100))
    );
  } else {
    // decreasedPrice = price * (1 + percentage / 100);
    decreasedPrice = multiplyBig(price, addBig(1, divideBig(percentage, 100)));
  }

  return {
    increasedPrice:
      increasedPrice !== undefined
        ? convertToLocaleString(increasedPrice.toFixed(2), 2, 5)
        : undefined,
    decreasedPrice:
      decreasedPrice !== undefined
        ? convertToLocaleString(decreasedPrice.toFixed(2), 2, 5)
        : undefined,
  };
};
