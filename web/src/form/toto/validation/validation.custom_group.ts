import {
  ERROR_FIELD_TOTO,
  RangeValue,
  TotoPools,
  TotoRangeInfo,
} from "../toto.type";
import { addPoolNum, initTotoPool } from "../utils";
import { validateListInput, validateRangeCountInput } from "./validation";

type CustomGroupInput = {
  includeCustomGroup: boolean;
  customGroups: string;
  customCount: string;
  system: number;
};

export const validateCustomGroup = (
  input: CustomGroupInput,
  rangeInfo: TotoRangeInfo,
  remainingPools: TotoPools,
  remainingCount: number
): {
  customPools: TotoPools;
  customCount: RangeValue;
  err: string;
  field: ERROR_FIELD_TOTO;
} => {
  // Custom Group Rule
  let customCount: RangeValue = { min: 0, max: 0 };
  const customPools = initTotoPool();
  if (input.includeCustomGroup) {
    // validate custom group numbers field
    let err = validateListInput(input.customGroups, rangeInfo, (n) => {
      if (!remainingPools.allPools.allPools.has(n)) {
        return `Number ${n} in the custom group cannot be in either the include or exclude list.`;
      }

      if (!customPools.allPools.allPools.has(n)) {
        addPoolNum(customPools, n, rangeInfo.low);
      }
      return "";
    });
    if (err !== "") {
      return {
        customPools,
        customCount,
        err,
        field: ERROR_FIELD_TOTO.CUSTOM_GROUPS,
      };
    }

    // validate custom group number count field
    const countRes = validateRangeCountInput(input.customCount, input.system);
    if (countRes.err !== "") {
      return {
        customPools,
        customCount,
        err: countRes.err,
        field: ERROR_FIELD_TOTO.CUSTOM_COUNT,
      };
    }
    customCount = countRes.count;

    // check is count number exceed custom pool size
    if (customCount.min > customPools.allPools.allPools.size) {
      return {
        customPools,
        customCount,
        err: `The custom number count cannot exceed the custom group numbers size.`,
        field: ERROR_FIELD_TOTO.CUSTOM_COUNT,
      };
    }

    // check is count number exceed the available limit
    if (customCount.min > remainingCount) {
      return {
        customPools,
        customCount,
        err: `The custom number count cannot exceed the remaining available numbers.`,
        field: ERROR_FIELD_TOTO.CUSTOM_COUNT,
      };
    }

    // make sure the remaining pool is sufficient for the system size
    if (
      remainingPools.allPools.allPools.size -
        customPools.allPools.allPools.size +
        customCount.max <
      remainingCount
    ) {
      return {
        customPools,
        customCount,
        err: "Not enough remaining numbers to complete a combination with the selected custom group count.",
        field: ERROR_FIELD_TOTO.CUSTOM_COUNT,
      };
    }

    // recompute custom count
    customCount.max = Math.min(customCount.max, remainingCount);
    customCount.min = Math.max(
      customCount.min,
      input.system -
        (remainingPools.allPools.allPools.size -
          customPools.allPools.allPools.size)
    );
  }

  return { customPools, customCount, err: "", field: 0 };
};
