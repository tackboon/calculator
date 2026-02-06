import { checkMinMax } from "../../common/validation/calculator.validation";
import { ERROR_FIELD_CUSTOM_GROUP } from "../../component/toto/custom_group/custom.type";
import {
  ERROR_FIELD_TOTO,
  RangeValue,
  TotoInputType,
  TotoRangeInfo,
} from "./toto.type";
import { extractRangeInput, getRangeInfo } from "./utils";

const validateListInput = (
  listStr: string,
  rangeInfo: TotoRangeInfo,
  fn: (n: number) => string,
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

const validateRangeCountInput = (
  countStr: string,
  min: number,
  max: number,
): { count: RangeValue; err: string } => {
  const { value, isValid } = extractRangeInput(countStr, min, max);
  if (!isValid) {
    return { count: value, err: "Please enter a valid number or range value." };
  }
  return { count: value, err: "" };
};

export const validateTotoInput = (
  input: TotoInputType,
): {
  err: string;
  field: ERROR_FIELD_TOTO | null;
  customFields: (ERROR_FIELD_CUSTOM_GROUP | null)[];
} => {
  const customFields: (ERROR_FIELD_CUSTOM_GROUP | null)[] = [];
  for (let i = 0; i < input.customGroups.length; i++) {
    customFields.push(null);
  }

  // Validate count field
  if (!checkMinMax(input.count, { min: 1, max: 100 })) {
    return {
      err: "You can generate between 1 and 100 combinations only.",
      field: ERROR_FIELD_TOTO.COUNT,
      customFields,
    };
  }

  // Get number range info
  const rangeInfo = getRangeInfo(input.numberRange);
  const pool = new Set<number>();

  // Validate must include list
  if (input.mustIncludes !== "") {
    let err = validateListInput(input.mustIncludes, rangeInfo, (n) => {
      if (!pool.has(n)) pool.add(n);
      return "";
    });
    if (err !== "")
      return {
        err,
        field: ERROR_FIELD_TOTO.MUST_INCLUDES,
        customFields,
      };
    if (pool.size > input.system)
      return {
        err: `You can only include up to ${input.system} numbers.`,
        field: ERROR_FIELD_TOTO.MUST_INCLUDES,
        customFields,
      };
  }

  // Validate must exclude list
  if (input.mustExcludes !== "") {
    const tempPool = new Set<number>();
    const err = validateListInput(input.mustExcludes, rangeInfo, (n) => {
      if (pool.has(n) && !tempPool.has(n)) {
        return `Number ${n} cannot be in both include and exclude lists.`;
      }
      if (!tempPool.has(n)) {
        tempPool.add(n);
        pool.add(n);
      }
      return "";
    });
    if (err !== "")
      return { err, field: ERROR_FIELD_TOTO.MUST_EXCLUDES, customFields };
  }

  // Validate custom groups
  for (let i = 0; i < input.customGroups.length; i++) {
    const tempPool = new Set<number>();

    // Validate custom group numbers field
    let err = validateListInput(
      input.customGroups[i].numbers,
      rangeInfo,
      (n) => {
        if (pool.has(n) && !tempPool.has(n)) {
          return `Number ${n} in the custom group cannot be in either the include list, exclude list or other custom group.`;
        }

        if (!tempPool.has(n)) {
          pool.add(n);
          tempPool.add(n);
        }

        return "";
      },
    );
    if (err !== "") {
      customFields[i] = ERROR_FIELD_CUSTOM_GROUP.NUMBERS;
      return {
        err,
        field: 0,
        customFields,
      };
    }

    // Validate custom group count field
    const countRes = validateRangeCountInput(
      input.customGroups[i].count,
      0,
      input.system,
    );
    if (countRes.err !== "") {
      customFields[i] = ERROR_FIELD_CUSTOM_GROUP.COUNT;
      return {
        err: countRes.err,
        field: 0,
        customFields,
      };
    }
  }

  if (input.includeOddEven) {
    // Validate odd number count field
    const oddRes = validateRangeCountInput(input.odd, 0, input.system);
    if (oddRes.err !== "") {
      return {
        err: oddRes.err,
        field: ERROR_FIELD_TOTO.ODD,
        customFields,
      };
    }

    // Validate even number count field
    const evenRes = validateRangeCountInput(input.even, 0, input.system);
    if (evenRes.err !== "") {
      return {
        err: evenRes.err,
        field: ERROR_FIELD_TOTO.EVEN,
        customFields,
      };
    }
  }

  if (input.includeLowHigh) {
    // Validate low number count field
    const lowRes = validateRangeCountInput(input.low, 0, input.system);
    if (lowRes.err !== "") {
      return {
        err: lowRes.err,
        field: ERROR_FIELD_TOTO.LOW,
        customFields,
      };
    }

    // Validate high number count field
    const highRes = validateRangeCountInput(input.high, 0, input.system);
    if (highRes.err !== "") {
      return {
        err: highRes.err,
        field: ERROR_FIELD_TOTO.HIGH,
        customFields,
      };
    }
  }

  if (input.includeRangeGroup) {
    for (let i = 0; i < rangeInfo.group; i++) {
      // Validate range group fields
      const rangeCounts = [
        input.rangeCount10,
        input.rangeCount20,
        input.rangeCount30,
        input.rangeCount40,
        input.rangeCount50,
        input.rangeCount60,
        input.rangeCount70,
      ];
      const { err } = validateRangeCountInput(rangeCounts[i], 0, input.system);
      if (err !== "")
        return { err, field: ERROR_FIELD_TOTO.RANGE_10 + i, customFields };
    }
  }

  if (input.includeConsecutive) {
    // Validate max consecutive length field
    const consecutiveLengthRes = validateRangeCountInput(
      input.maxConsecutiveLength,
      1,
      input.system,
    );
    if (consecutiveLengthRes.err !== "") {
      return {
        err: consecutiveLengthRes.err,
        field: ERROR_FIELD_TOTO.MAX_CONSECUTIVE_LENGTH,
        customFields,
      };
    }

    // Validate max consecutive group field
    const consecutiveGroupRes = validateRangeCountInput(
      input.maxConsecutiveGroup,
      0,
      Math.floor(input.system / 2),
    );
    if (consecutiveGroupRes.err !== "") {
      return {
        err: consecutiveGroupRes.err,
        field: ERROR_FIELD_TOTO.MAX_CONSECUTIVE_GROUP,
        customFields,
      };
    }
  }

  return { err: "", field: null, customFields };
};
