import { checkMinMax } from "../../../common/validation/calculator.validation";
import {
  ERROR_FIELD_TOTO,
  RangeValue,
  TotoInputType,
  TotoRangeInfo,
} from "../toto.type";
import {
  extractRangeInput,
  getRangeInfo,
  getTotoPoolsCopy,
  initDefaultTotoPool,
} from "../utils";
import { validateCustomGroup } from "./validation.custom_group";
import { validateLowHigh } from "./validation.low_high";
import {
  validateIncludeList,
  validateExcludeList,
} from "./validation.number_filter";
import { validateOddEven } from "./validation.odd_even";
import { validateRangeGroup } from "./validation.range_group";

export const validateListInput = (
  listStr: string,
  rangeInfo: TotoRangeInfo,
  fn: (n: number) => string
): string => {
  const parts = listStr.split(",");
  for (const val of parts) {
    if (val === "") continue;

    const n = Number(val);
    if (isNaN(n) || n < rangeInfo.min || n > rangeInfo.max) {
      return `Please enter values between ${rangeInfo.min} and ${rangeInfo.max}.`;
    }

    const err = fn(n);
    if (err !== "") return err;
  }

  return "";
};

export const validateRangeCountInput = (
  countStr: string,
  max: number
): { count: RangeValue; err: string } => {
  const count = extractRangeInput(countStr, max);
  if (
    isNaN(count.min) ||
    isNaN(count.max) ||
    count.min < 0 ||
    count.min > max ||
    count.max > max ||
    count.max < count.min
  ) {
    return { count, err: "Please enter a valid number or range value." };
  }

  return { count, err: "" };
};

export const validateTotoInput = (
  input: TotoInputType
): { err: string; field: ERROR_FIELD_TOTO | null } => {
  // validate count field
  if (!checkMinMax(input.count, { min: 1, max: 100 })) {
    return {
      err: "You can generate between 1 and 100 combinations only.",
      field: ERROR_FIELD_TOTO.COUNT,
    };
  }

  // Get number range info
  const rangeInfo = getRangeInfo(input.numberRange);

  // Build initial pool
  const defaultPools = initDefaultTotoPool(input.numberRange);
  const availablePools = getTotoPoolsCopy(defaultPools);

  // Validate must include numbers
  const includeRes = validateIncludeList(input, rangeInfo, availablePools);
  const { mustIncludePools } = includeRes;
  let { requiredCount, err, field } = includeRes;
  if (err !== "") return { err, field };

  // Validate must exclude numbers
  const excludeRes = validateExcludeList(
    input,
    rangeInfo,
    availablePools,
    mustIncludePools
  );
  ({ err, field } = excludeRes);
  if (err !== "") return { err, field };

  // Validate custom group rule
  const customRes = validateCustomGroup(
    input,
    rangeInfo,
    availablePools,
    requiredCount
  );
  ({ err, field } = customRes);
  if (err !== "") return { err, field };
  const { customPools, customCount } = customRes;

  // Validate odd/even rule
  const oddEvenRes = validateOddEven(
    input,
    availablePools,
    mustIncludePools,
    customPools,
    customCount
  );
  ({ err, field } = oddEvenRes);
  if (err !== "") return { err, field };
  const { requiredOddCount, requiredEvenCount } = oddEvenRes;

  // Validate low/high rule
  const lowHighRes = validateLowHigh(
    input,
    requiredCount,
    availablePools,
    mustIncludePools,
    customPools,
    customCount,
    requiredOddCount,
    requiredEvenCount
  );
  ({ err, field } = lowHighRes);
  if (err !== "") return { err, field };
  const {
    requiredLowCount,
    requiredHighCount,
    requiredOddLowCount,
    requiredOddHighCount,
    requiredEvenLowCount,
    requiredEvenHighCount,
  } = lowHighRes;

  // Range Group Rule
  const rangeRes = validateRangeGroup(
    input,
    rangeInfo,
    availablePools,
    mustIncludePools,
    customPools,
    customCount,
    requiredOddCount,
    requiredEvenCount,
    requiredLowCount,
    requiredHighCount,
    requiredOddLowCount,
    requiredOddHighCount,
    requiredEvenLowCount,
    requiredEvenHighCount
  );
  ({ err, field } = rangeRes);
  if (err !== "") return { err, field };

  return { err: "", field: null };
};
