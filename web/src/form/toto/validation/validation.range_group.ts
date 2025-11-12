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
  availablePools: TotoPools,
  mustIncludePools: TotoPools,
  customPools: TotoPools,
  customCount: RangeValue,
  requiredOddCount: number,
  requiredEvenCount: number,
  requiredLowCount: number,
  requiredHighCount: number,
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
        field,
      };
    }

    let availableRangeOddCount = 0;
    let availableRangeEvenCount = 0;
    let availableRangeLowCount = 0;
    let availableRangeHighCount = 0;
    let availableRangeOddLowCount = 0;
    let availableRangeOddHighCount = 0;
    let availableRangeEvenLowCount = 0;
    let availableRangeEvenHighCount = 0;
    for (const [idx, rangeValue] of rangeValues.entries()) {
      // calculate sum of min/max without specific group
      const minSumExcludingGroup = Math.max(
        input.system - rangeValue.max,
        minSum - rangeValue.min
      );
      const maxSumExcludingGroup = Math.min(
        input.system - rangeValue.min,
        maxSum - rangeValue.max
      );

      // adjust range value
      rangeValue.min = Math.max(
        rangeValue.min,
        input.system - maxSumExcludingGroup
      );
      rangeValue.max = Math.min(
        rangeValue.max,
        input.system - minSumExcludingGroup
      );
      rangeValues[idx] = rangeValue;

      // Ensure group numbers are enough for must include list
      if (rangeValue.max < mustIncludePools[TotoPoolKeys[idx]].allPools.size) {
        let field = ERROR_FIELD_TOTO.RANGE_10;
        if (rangeCounts[idx] === "") {
          for (let i = 0; i < rangeCounts.length; i++) {
            if (i === idx) continue;

            if (rangeCounts[i] !== "") {
              field += i;
              break;
            }
          }
        } else {
          field = ERROR_FIELD_TOTO.RANGE_10 + idx;
        }

        return {
          err: "Your range group setting conflicts with the numbers you've included.",
          field,
        };
      }

      // Calculate remaining range group numbers required
      const requiredRangeCount = Math.max(
        0,
        rangeValue.min - mustIncludePools[TotoPoolKeys[idx]].allPools.size
      );

      // Ensure remaining pool is enough for the required range group settings
      if (
        requiredRangeCount > availablePools[TotoPoolKeys[idx]].allPools.size
      ) {
        let field = ERROR_FIELD_TOTO.RANGE_10;
        if (rangeCounts[idx] === "") {
          for (let i = 0; i < rangeCounts.length; i++) {
            if (i === idx) continue;

            if (rangeCounts[i] !== "") {
              field += i;
              break;
            }
          }
        } else {
          field = ERROR_FIELD_TOTO.RANGE_10 + idx;
        }

        return {
          err:
            availablePools.allPools.allPools.size < rangeInfo.count
              ? "Your range group setting cannot be satisfied after applying your include and exclude settings."
              : "The remaining pool size is not enough for your range group settings.",
          field,
        };
      }

      // Handle range group + custom group settings
      if (customPools.allPools.allPools.size > 0) {
        // Ensure there are enough available range group numbers left (after applying include, exclude, and custom group filters) to satisfy the remaining range group requirement.
        if (
          requiredRangeCount >
          availablePools[TotoPoolKeys[idx]].allPools.size -
            customPools[TotoPoolKeys[idx]].allPools.size +
            Math.min(
              customCount.max,
              customPools[TotoPoolKeys[idx]].allPools.size
            )
        ) {
          let field = ERROR_FIELD_TOTO.RANGE_10;
          if (rangeCounts[idx] === "") {
            for (let i = 0; i < rangeCounts.length; i++) {
              if (i === idx) continue;

              if (rangeCounts[i] !== "") {
                field += i;
                break;
              }
            }
          } else {
            field = ERROR_FIELD_TOTO.RANGE_10 + idx;
          }

          return {
            err:
              availablePools.allPools.allPools.size < rangeInfo.count
                ? "Your range group setting cannot be satisfied after applying your include, exclude, and custom group settings."
                : "Your range group setting cannot be satisfied after applying your custom group settings.",
            field,
          };
        }

        // Calculate min/max sum of range group in custom settings
        const minCustomRangeCount = Math.max(
          0,
          customCount.min -
            (customPools.allPools.allPools.size -
              customPools[TotoPoolKeys[idx]].allPools.size)
        );

        // Ensure there are enough numbers remaininig in the range group to fulfill the minimum requirement from custom groups.
        if (
          rangeValue.max - mustIncludePools[TotoPoolKeys[idx]].allPools.size <
          minCustomRangeCount
        ) {
          let field = ERROR_FIELD_TOTO.RANGE_10;
          if (rangeCounts[idx] === "") {
            for (let i = 0; i < rangeCounts.length; i++) {
              if (i === idx) continue;

              if (rangeCounts[i] !== "") {
                field += i;
                break;
              }
            }
          } else {
            field = ERROR_FIELD_TOTO.RANGE_10 + idx;
          }

          return {
            err:
              availablePools.allPools.allPools.size < rangeInfo.count
                ? "Your range group setting cannot be satisfied after applying your include, exclude, and custom group settings."
                : "Your range group setting cannot be satisfied after applying your custom group settings.",
            field,
          };
        }

        // Calculate available odd numbers in the range group
        availableRangeOddCount += Math.min(
          rangeValue.max,
          availablePools[TotoPoolKeys[idx]].oddPools.size -
            customPools[TotoPoolKeys[idx]].oddPools.size +
            Math.min(
              customCount.max,
              customPools[TotoPoolKeys[idx]].oddPools.size
            )
        );

        // Calculate available even numbers in the range group
        availableRangeEvenCount += Math.min(
          rangeValue.max,
          availablePools[TotoPoolKeys[idx]].evenPools.size -
            customPools[TotoPoolKeys[idx]].evenPools.size +
            Math.min(
              customCount.max,
              customPools[TotoPoolKeys[idx]].evenPools.size
            )
        );

        // Calculate available low numbers in the range group
        availableRangeLowCount += Math.min(
          rangeValue.max,
          availablePools[TotoPoolKeys[idx]].lowPools.size -
            customPools[TotoPoolKeys[idx]].lowPools.size +
            Math.min(
              customCount.max,
              customPools[TotoPoolKeys[idx]].lowPools.size
            )
        );

        // Calculate available high numbers in the range group
        availableRangeHighCount += Math.min(
          rangeValue.max,
          availablePools[TotoPoolKeys[idx]].highPools.size -
            customPools[TotoPoolKeys[idx]].highPools.size +
            Math.min(
              customCount.max,
              customPools[TotoPoolKeys[idx]].highPools.size
            )
        );

        // Calculate available odd low numbers in the range group
        availableRangeOddLowCount += Math.min(
          rangeValue.max,
          availablePools[TotoPoolKeys[idx]].oddLowPools.size -
            customPools[TotoPoolKeys[idx]].oddLowPools.size +
            Math.min(
              customCount.max,
              customPools[TotoPoolKeys[idx]].oddLowPools.size
            )
        );

        // Calculate available odd high numbers in the range group
        availableRangeOddHighCount += Math.min(
          rangeValue.max,
          availablePools[TotoPoolKeys[idx]].oddHighPools.size -
            customPools[TotoPoolKeys[idx]].oddHighPools.size +
            Math.min(
              customCount.max,
              customPools[TotoPoolKeys[idx]].oddHighPools.size
            )
        );

        // Calculate available even low numbers in the range group
        availableRangeEvenLowCount += Math.min(
          rangeValue.max,
          availablePools[TotoPoolKeys[idx]].evenLowPools.size -
            customPools[TotoPoolKeys[idx]].evenLowPools.size +
            Math.min(
              customCount.max,
              customPools[TotoPoolKeys[idx]].evenLowPools.size
            )
        );

        // Calculate available even high numbers in the range group
        availableRangeEvenHighCount += Math.min(
          rangeValue.max,
          availablePools[TotoPoolKeys[idx]].evenHighPools.size -
            customPools[TotoPoolKeys[idx]].evenHighPools.size +
            Math.min(
              customCount.max,
              customPools[TotoPoolKeys[idx]].evenHighPools.size
            )
        );
      } else {
        // Calculate available odd numbers in the range group
        availableRangeOddCount += Math.min(
          rangeValue.max,
          availablePools[TotoPoolKeys[idx]].oddPools.size
        );

        // Calculate available even numbers in the range group
        availableRangeEvenCount += Math.min(
          rangeValue.max,
          availablePools[TotoPoolKeys[idx]].evenPools.size
        );

        // Calculate available low numbers in the range group
        availableRangeLowCount += Math.min(
          rangeValue.max,
          availablePools[TotoPoolKeys[idx]].lowPools.size
        );

        // Calculate available high numbers in the range group
        availableRangeHighCount += Math.min(
          rangeValue.max,
          availablePools[TotoPoolKeys[idx]].highPools.size
        );

        // Calculate available odd + low numbers in the range group
        availableRangeOddLowCount += Math.min(
          rangeValue.max,
          availablePools[TotoPoolKeys[idx]].oddLowPools.size
        );

        // Calculate available odd + high numbers in the range group
        availableRangeOddHighCount += Math.min(
          rangeValue.max,
          availablePools[TotoPoolKeys[idx]].oddHighPools.size
        );

        // Calculate available even + low numbers in the range group
        availableRangeEvenLowCount += Math.min(
          rangeValue.max,
          availablePools[TotoPoolKeys[idx]].evenLowPools.size
        );

        // Calculate available even + high numbers in the range group
        availableRangeEvenHighCount += Math.min(
          rangeValue.max,
          availablePools[TotoPoolKeys[idx]].evenHighPools.size
        );
      }
    }
    // Ensure remaining pool is enough for the required odd/even + range group settings
    if (
      availableRangeOddCount < requiredOddCount ||
      availableRangeEvenCount < requiredEvenCount
    ) {
      let field = ERROR_FIELD_TOTO.RANGE_10;
      for (let i = 0; i < rangeCounts.length; i++) {
        if (rangeCounts[i] !== "") {
          field += i;
          break;
        }
      }

      return {
        err: "Your range group setting cannot be satisfied after applying odd/even settings.",
        field,
      };
    }

    // Ensure remaining pool is enough for the required low/high + range group settings
    if (
      availableRangeLowCount < requiredLowCount ||
      availableRangeHighCount < requiredHighCount
    ) {
      let field = ERROR_FIELD_TOTO.RANGE_10;
      for (let i = 0; i < rangeCounts.length; i++) {
        if (rangeCounts[i] !== "") {
          field += i;
          break;
        }
      }

      return {
        err: "Your range group setting cannot be satisfied after applying low/high settings.",
        field,
      };
    }

    // Ensure remaining pool is enough for the required odd/even + low/high + range group settings
    if (
      availableRangeOddLowCount < requiredOddLowCount ||
      availableRangeOddHighCount < requiredOddHighCount ||
      availableRangeEvenLowCount < requiredEvenLowCount ||
      availableRangeEvenHighCount < requiredEvenHighCount
    ) {
      let field = ERROR_FIELD_TOTO.RANGE_10;
      for (let i = 0; i < rangeCounts.length; i++) {
        if (rangeCounts[i] !== "") {
          field += i;
          break;
        }
      }

      return {
        err: "Your range group setting cannot be satisfied after applying odd/even and low/high settings.",
        field,
      };
    }
  }

  return { err: "", field: 0 };
};
