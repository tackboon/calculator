import { BigNumber } from "mathjs";
import { mathBigNum } from "../../../../common/number/math";
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
  if (!checkMinMax(input.price, 0)) {
    return {
      err: "Please enter a valid price.",
      field: ERROR_FIELD_PRICE_PERCENTAGE.PRICE,
    };
  }

  return { err: "", field: null };
};

export const calculateResult = (
  input: PricePercentageInputType
): PricePercentageResultType => {
  let increasedPriceStr: string | undefined;
  let decreasedPriceStr: string | undefined;

  const price = parseBigNumberFromString(input.price);
  const percentage = parseBigNumberFromString(input.percentage);

  if (mathBigNum.largerEq(percentage, 0)) {
    // increasedPrice = price * (1 + percentage / 100);
    const increasedPrice = mathBigNum.multiply(
      price,
      mathBigNum.add(1, mathBigNum.divide(percentage, 100))
    ) as BigNumber;
    increasedPriceStr = convertToLocaleString(increasedPrice.toString(), 2, 5);

    // decreasedPrice = price * (1 - percentage / 100);
    const decreasedPrice = mathBigNum.multiply(
      price,
      mathBigNum.subtract(1, mathBigNum.divide(percentage, 100))
    ) as BigNumber;
    decreasedPriceStr = convertToLocaleString(decreasedPrice.toString(), 2, 5);
  } else {
    // decreasedPrice = price * (1 + percentage / 100);
    const decreasedPrice = mathBigNum.multiply(
      price,
      mathBigNum.add(1, mathBigNum.divide(percentage, 100))
    ) as BigNumber;
    decreasedPriceStr = convertToLocaleString(decreasedPrice.toString(), 2, 5);
  }

  return {
    increasedPrice: increasedPriceStr,
    decreasedPrice: decreasedPriceStr,
  };
};
