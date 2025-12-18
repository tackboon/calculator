import { ERROR_FIELD_CUSTOM_GROUP } from "../../../component/toto/custom_group/custom.type";
import { RangeValue, TotoPools, TotoRangeInfo } from "../toto.type";
import { addPoolNum, initTotoPool } from "../utils";
import { validateListInput, validateRangeCountInput } from "./validation";

type CustomGroupInput = {
  customGroups: string;
  customCount: string;
  system: number;
};

export const validateCustomGroup = (
  input: CustomGroupInput,
  rangeInfo: TotoRangeInfo,
  availablePool: TotoPools,
  customPools: TotoPools[],
  customCounts: RangeValue[],
  requiredCount: number
): {
  customPool: TotoPools;
  customCount: RangeValue;
  err: string;
  customField: ERROR_FIELD_CUSTOM_GROUP;
} => {
  // Custom Group Rule
  let customCount: RangeValue = { min: 0, max: 0 };
  const customPool = initTotoPool();
  if (input.customGroups !== "") {
    let totalCustomMinCount = 0;
    let totalCustomMaxCount = 0;
    let totalCustomGroupSize = 0;

    // validate custom group numbers field
    let err = validateListInput(input.customGroups, rangeInfo, (n) => {
      if (!availablePool.allPools.allPools.has(n)) {
        return `Number ${n} in the custom group cannot be in either the include or exclude list.`;
      }

      for (let i = 0; i < customPools.length; i++) {
        if (customPools[i].allPools.allPools.has(n)) {
          return `Number ${n} cannot be in multi custom group.`;
        }

        totalCustomMinCount += customCounts[i].min;
        totalCustomMaxCount += customCounts[i].max;
        totalCustomGroupSize += customPools[i].allPools.allPools.size;
      }

      if (!customPool.allPools.allPools.has(n)) {
        addPoolNum(customPool, n, rangeInfo.low);
      }
      return "";
    });
    if (err !== "") {
      return {
        customPool,
        customCount,
        err,
        customField: ERROR_FIELD_CUSTOM_GROUP.NUMBERS,
      };
    }

    // validate custom group number count field
    const countRes = validateRangeCountInput(input.customCount, input.system);
    if (countRes.err !== "") {
      return {
        customPool,
        customCount,
        err: countRes.err,
        customField: ERROR_FIELD_CUSTOM_GROUP.COUNT,
      };
    }
    customCount = countRes.count;

    // check is count number exceed custom pool size
    if (
      customCount.min + totalCustomMinCount >
      customPool.allPools.allPools.size
    ) {
      return {
        customPool,
        customCount,
        err: `The custom number count cannot exceed the custom group numbers size.`,
        customField: ERROR_FIELD_CUSTOM_GROUP.COUNT,
      };
    }

    // check is count number exceed the available limit
    if (customCount.min + totalCustomMinCount > requiredCount) {
      return {
        customPool,
        customCount,
        err: `The custom number count cannot exceed the remaining available numbers.`,
        customField: ERROR_FIELD_CUSTOM_GROUP.COUNT,
      };
    }

    // Ensure the remaining pool is sufficient for the system size
    if (
      availablePool.allPools.allPools.size -
        customPool.allPools.allPools.size -
        totalCustomGroupSize +
        customCount.max +
        totalCustomMaxCount <
      requiredCount
    ) {
      return {
        customPool,
        customCount,
        err: "Not enough remaining numbers to complete a combination with the selected custom group count.",
        customField: ERROR_FIELD_CUSTOM_GROUP.COUNT,
      };
    }

    // adjust custom count
    customCount.max = Math.min(
      customPool.allPools.allPools.size,
      Math.min(customCount.max, requiredCount)
    );
    customCount.min = Math.max(
      customCount.min,
      input.system -
        (availablePool.allPools.allPools.size -
          customPool.allPools.allPools.size)
    );
  }

  return { customPool, customCount, err: "", customField: 0 };
};
