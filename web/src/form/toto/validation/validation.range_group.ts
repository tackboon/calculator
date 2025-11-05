import {
  ERROR_FIELD_TOTO,
  RangeValue,
  TotoPoolKeys,
  TotoPools,
  TotoRangeInfo,
} from "../toto.type";
import { validateRangeCountInput } from "./validation";

type RangeInput = {
  system: number;
  includeRangeGroup: boolean;
  rangeCount10: string;
  rangeCount20: string;
  rangeCount30: string;
  rangeCount40: string;
  rangeCount50: string;
  rangeCount60: string;
  rangeCount70: string;
};

export const validateRangeGroup = (
  input: RangeInput,
  rangeInfo: TotoRangeInfo,
  requiredCount: number,
  availablePools: TotoPools,
  mustIncludePools: TotoPools,
  customPools: TotoPools,
  customCount: RangeValue,
  requiredOddCount: number,
  requiredEvenCount: number,
  requiredLowCount: number,
  requriedHighCount: number,
  requiredOddLowCount: number,
  requiredOddHighCount: number,
  requiredEvenLowCount: number,
  requiredEvenHighCount: number
): { err: string; field: ERROR_FIELD_TOTO } => {
  if (input.includeRangeGroup) {
    const rangeCounts = [
      input.rangeCount10,
      input.rangeCount20,
      input.rangeCount30,
      input.rangeCount40,
      input.rangeCount50,
      input.rangeCount60,
      input.rangeCount70,
    ];
    const rangeValues: RangeValue[] = [];
    let minSum = 0;
    let maxSum = 0;

    for (let i = 0; i < rangeInfo.group; i++) {
      // validate range group fields
      const { count, err } = validateRangeCountInput(
        rangeCounts[i],
        input.system
      );
      if (err !== "") return { err, field: ERROR_FIELD_TOTO.RANGE_10 + i };

      rangeValues.push(count);

      // calculate sum of min/max
      minSum += count.min;
      maxSum += count.max;
    }

    // validate range group distribution
    if (minSum > input.system || maxSum < input.system) {
      let field = ERROR_FIELD_TOTO.RANGE_10;
      for (let i = 0; i < rangeCounts.length; i++) {
        if (rangeCounts[i] !== "") {
          field += i;
          break;
        }
      }

      return {
        err: "Please enter a valid range group distribution that matches your system size.",
        field: field,
      };
    }

    const minSumExcludingGroups: number[] = [];
    const maxSumExcludiingGroups: number[] = [];
    for (const [idx, rangeValue] of rangeValues.entries()) {
      // calculate sum of min/max without specific group
      const minSumExcludingGroup = minSum - rangeValue.min;
      const maxSumExcludingGroup = maxSum - rangeValue.max;

      minSumExcludingGroups.push(minSumExcludingGroup);
      maxSumExcludiingGroups.push(maxSumExcludingGroup);

      // Ensure group numbers are enough for must include list
      if (rangeValue.max < mustIncludePools[TotoPoolKeys[idx]].allPools.size) {
        return {
          err: "Your range group setting conflicts with the numbers you've included.",
          field: ERROR_FIELD_TOTO.RANGE_10 + idx,
        };
      }
    }
  }

  return { err: "", field: 0 };
};
