import { parseNumberFromString } from "../../../../common/number/number";
import { checkMinMax } from "../../../../common/validation/calculator.validation";
import {
  ERROR_FIELD_PRICE_PERCENTAGE,
  PricePercentageInputType,
  PricePercentageResultType,
} from "./price_percentage_form.component";

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
  let increasedPrice;
  let decreasedPrice;

  const price = parseNumberFromString(input.price);
  const percentage = parseNumberFromString(input.percentage);

  if (percentage >= 0) {
    increasedPrice = price * (1 + percentage / 100);
    decreasedPrice = price * (1 - percentage / 100);
  } else {
    decreasedPrice = price * (1 + percentage / 100);
  }

  return {
    increasedPrice,
    decreasedPrice,
  };
};
