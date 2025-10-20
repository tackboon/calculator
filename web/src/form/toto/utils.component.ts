import { ERROR_FIELD_TOTO, TotoInputType, TotoResultType } from "./toto.type";

export const validateTotoInput = (
  input: TotoInputType
): { err: string; field: ERROR_FIELD_TOTO | null } => {
  // if (!checkMinMax(input.price, { min: 0, maxOrEqual: QUADRILLION })) {
  //   return {
  //     err: "Please enter a valid price.",
  //     field: ERROR_FIELD_PRICE_PERCENTAGE.PRICE,
  //   };
  // }

  // if (
  //   !checkMinMax(input.percentage, {
  //     minOrEqual: QUADRILLION.negated(),
  //     maxOrEqual: QUADRILLION,
  //   })
  // ) {
  //   return {
  //     err: "Please enter a valid percentage.",
  //     field: ERROR_FIELD_PRICE_PERCENTAGE.PERCENTAGE,
  //   };
  // }

  return { err: "", field: null };
};

export const calculateResult = (input: TotoInputType): TotoResultType => {
  return {
    numbers: [],
  };
};
