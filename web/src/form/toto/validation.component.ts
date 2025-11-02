import { checkMinMax } from "../../common/validation/calculator.validation";
import { ERROR_FIELD_TOTO, RangeValue, TotoInputType } from "./toto.type";
import {
  addPoolNum,
  deletePoolNum,
  extractRangeInput,
  getRangeInfo,
  getTotoPoolsCopy,
  initDefaultTotoPool,
  initTotoPool,
} from "./utils.component";

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

  const rangeInfo = getRangeInfo(input.numberRange);

  // Build initial pool
  const defaultPools = initDefaultTotoPool(input.numberRange);
  const pools = getTotoPoolsCopy(defaultPools);

  // Number Filter Rule
  const mustIncludePool = initTotoPool();
  let requiredCount = input.system;
  if (input.includeNumberFilter) {
    // Validate must includes rule
    const mustIncludeParts = input.mustIncludes.split(",");
    for (const val of mustIncludeParts) {
      if (val === "") {
        continue;
      }

      const n = Number(val);
      if (isNaN(n) || n < rangeInfo.min || n > rangeInfo.max) {
        return {
          err: `Please enter values between ${rangeInfo.min} and ${rangeInfo.max}.`,
          field: ERROR_FIELD_TOTO.MUST_INCLUDES,
        };
      }

      if (!mustIncludePool.allPools.allPools.has(n)) {
        addPoolNum(mustIncludePool, n, rangeInfo.low);
        deletePoolNum(pools, n);
      }
    }
    if (mustIncludePool.allPools.allPools.size > input.system) {
      return {
        err: `You can only include up to ${input.system} numbers.`,
        field: ERROR_FIELD_TOTO.MUST_INCLUDES,
      };
    }
    requiredCount = input.system - mustIncludePool.allPools.allPools.size;

    // validate must excludes field
    const mustExcludeParts = input.mustExcludes.split(",");
    for (const val of mustExcludeParts) {
      if (val === "") {
        continue;
      }

      const n = Number(val);
      if (isNaN(n) || n < rangeInfo.min || n > rangeInfo.max) {
        return {
          err: `Each number must be between ${rangeInfo.min} and ${rangeInfo.max}.`,
          field: ERROR_FIELD_TOTO.MUST_EXCLUDES,
        };
      }
      if (mustIncludePool.allPools.allPools.has(n)) {
        return {
          err: `Number ${n} cannot be in both include and exclude lists.`,
          field: ERROR_FIELD_TOTO.MUST_EXCLUDES,
        };
      }

      if (pools.allPools.allPools.has(n)) {
        deletePoolNum(pools, n);
      }
    }
    if (
      pools.allPools.allPools.size + mustIncludePool.allPools.allPools.size <
      input.system
    ) {
      return {
        err: `You can only exclude up to ${
          rangeInfo.count - input.system
        } numbers.`,
        field: ERROR_FIELD_TOTO.MUST_EXCLUDES,
      };
    }
  }

  // Custom Group Rule
  let minCustomCount = 0;
  let maxCustomCount = 0;
  const customPool = initTotoPool();
  if (input.includeCustomGroup) {
    // Validate custom group numbers
    const customGroupParts = input.customGroups.split(",");
    for (const val of customGroupParts) {
      if (val === "") continue;

      const n = Number(val);
      if (isNaN(n) || n < rangeInfo.min || n > rangeInfo.max) {
        return {
          err: `Please enter values between ${rangeInfo.min} and ${rangeInfo.max}.`,
          field: ERROR_FIELD_TOTO.CUSTOM_GROUPS,
        };
      }

      if (!pools.allPools.allPools.has(n)) {
        return {
          err: `Number ${n} in the custom group cannot be in either the include or exclude list.`,
          field: ERROR_FIELD_TOTO.CUSTOM_GROUPS,
        };
      }

      if (!customPool.allPools.allPools.has(n)) {
        addPoolNum(customPool, n, rangeInfo.low);
      }
    }

    // Validate custom number count
    const customCount = extractRangeInput(input.customCount, input.system);
    if (
      isNaN(customCount.min) ||
      isNaN(customCount.max) ||
      customCount.min < 0 ||
      customCount.max < customCount.min ||
      customCount.min > input.system ||
      customCount.max > input.system
    ) {
      return {
        err: `Please enter a valid custom number count.`,
        field: ERROR_FIELD_TOTO.CUSTOM_COUNT,
      };
    }
    if (customCount.min > customPool.allPools.allPools.size) {
      return {
        err: `The custom number count cannot exceed the number of selected group numbers.`,
        field: ERROR_FIELD_TOTO.CUSTOM_COUNT,
      };
    }
    if (
      customCount.min > input.system - mustIncludePool.allPools.allPools.size ||
      customCount.min > pools.allPools.allPools.size
    ) {
      return {
        err: `The custom number count cannot exceed the remaining available numbers or your system size limit.`,
        field: ERROR_FIELD_TOTO.CUSTOM_COUNT,
      };
    }

    if (
      pools.allPools.allPools.size -
        customPool.allPools.allPools.size +
        customCount.max <
      requiredCount
    ) {
      return {
        err: "Not enough remaining numbers to complete a combination with the selected custom group count.",
        field: ERROR_FIELD_TOTO.CUSTOM_COUNT,
      };
    }

    minCustomCount = customCount.min;
    maxCustomCount = customCount.max;
  }

  // Odd/Even Rule
  let odd: RangeValue;
  let even: RangeValue;
  let requiredOddCount = 0;
  let requiredEvenCount = 0;
  if (input.includeOddEven) {
    odd = extractRangeInput(input.odd, input.system);
    if (
      isNaN(odd.min) ||
      isNaN(odd.max) ||
      odd.min > input.system ||
      odd.max > input.system
    ) {
      return {
        err: `Please enter a valid odd value`,
        field: ERROR_FIELD_TOTO.ODD,
      };
    }

    even = extractRangeInput(input.even, input.system);
    if (
      isNaN(even.min) ||
      isNaN(even.max) ||
      even.min > input.system ||
      even.max > input.system
    ) {
      return {
        err: `Please enter a valid even value`,
        field: ERROR_FIELD_TOTO.EVEN,
      };
    }

    if (
      odd.min + even.min > input.system ||
      odd.max + even.max < input.system
    ) {
      return {
        err: "Please enter a valid odd/even distribution that less than or equal to your system size.",
        field: ERROR_FIELD_TOTO.ODD,
      };
    }

    const isMinOddUpdated = input.system - even.max > odd.min;
    if (isMinOddUpdated) odd.min = input.system - even.max;

    const isMaxOddUpdated = input.system - even.min < odd.max;
    if (isMaxOddUpdated) odd.max = input.system - even.min;

    const isMinEvenUpdated = input.system - odd.max > even.min;
    if (isMinEvenUpdated) even.min = input.system - odd.max;

    const isMaxEvenUpdated = input.system - odd.min < even.max;
    if (isMaxEvenUpdated) even.max = input.system - odd.min;

    if (odd.max < mustIncludePool.allPools.oddPools.size) {
      return {
        err: "Your odd/even setting conflicts with the numbers you've included.",
        field:
          input.odd !== "" && !isMaxOddUpdated
            ? ERROR_FIELD_TOTO.ODD
            : ERROR_FIELD_TOTO.EVEN,
      };
    }

    if (even.max < mustIncludePool.allPools.evenPools.size) {
      return {
        err: "Your odd/even setting conflicts with the numbers you've included.",
        field:
          input.even !== "" && !isMaxEvenUpdated
            ? ERROR_FIELD_TOTO.EVEN
            : ERROR_FIELD_TOTO.ODD,
      };
    }

    requiredOddCount = Math.max(
      0,
      odd.min - mustIncludePool.allPools.oddPools.size
    );
    if (requiredOddCount > pools.allPools.oddPools.size) {
      return {
        err: "Your odd/even setting cannot be satisfied after applying your include and exclude settings.",
        field:
          input.odd !== "" && !isMinOddUpdated
            ? ERROR_FIELD_TOTO.ODD
            : ERROR_FIELD_TOTO.EVEN,
      };
    }

    requiredEvenCount = Math.max(
      0,
      even.min - mustIncludePool.allPools.evenPools.size
    );
    if (requiredEvenCount > pools.allPools.evenPools.size) {
      return {
        err: "Your odd/even setting cannot be satisfied after applying your include and exclude settings.",
        field:
          input.even !== "" && !isMinEvenUpdated
            ? ERROR_FIELD_TOTO.EVEN
            : ERROR_FIELD_TOTO.ODD,
      };
    }

    if (input.includeCustomGroup) {
      if (
        odd.min >
        pools.allPools.oddPools.size -
          customPool.allPools.oddPools.size +
          Math.min(maxCustomCount, customPool.allPools.oddPools.size)
      ) {
        return {
          err: "Your odd/even setting cannot be satisfied after applying your include, exclude, and custom group settings.",
          field:
            input.odd !== "" && !isMinOddUpdated
              ? ERROR_FIELD_TOTO.ODD
              : ERROR_FIELD_TOTO.EVEN,
        };
      }

      if (
        even.min >
        pools.allPools.evenPools.size -
          customPool.allPools.evenPools.size +
          Math.min(maxCustomCount, customPool.allPools.evenPools.size)
      ) {
        return {
          err: "Your odd/even setting cannot be satisfied after applying your include, exclude, and custom group settings.",
          field:
            input.even !== "" && !isMinEvenUpdated
              ? ERROR_FIELD_TOTO.EVEN
              : ERROR_FIELD_TOTO.ODD,
        };
      }

      const minCustomOddCount = Math.max(
        0,
        minCustomCount - customPool.allPools.evenPools.size
      );
      if (
        odd.max - mustIncludePool.allPools.oddPools.size <
        minCustomOddCount
      ) {
        return {
          err: "Your odd/even setting cannot be satisfied after applying your include, exclude, and custom group settings.",
          field:
            input.odd !== "" && !isMaxOddUpdated
              ? ERROR_FIELD_TOTO.ODD
              : ERROR_FIELD_TOTO.EVEN,
        };
      }

      const minCustomEvenCount = Math.max(
        0,
        minCustomCount - customPool.allPools.oddPools.size
      );
      if (
        even.max - mustIncludePool.allPools.evenPools.size <
        minCustomEvenCount
      ) {
        return {
          err: "Your odd/even setting cannot be satisfied after applying your include, exclude, and custom group settings.",
          field:
            input.even !== "" && !isMaxEvenUpdated
              ? ERROR_FIELD_TOTO.EVEN
              : ERROR_FIELD_TOTO.ODD,
        };
      }
    }
  }

  // Low/High Rule
  let low: RangeValue;
  let high: RangeValue;
  let requiredLowCount = 0;
  let requiredHighCount = 0;
  if (input.includeLowHigh) {
    low = extractRangeInput(input.low, input.system);
    if (
      isNaN(low.min) ||
      isNaN(low.max) ||
      low.min > input.system ||
      low.max > input.system
    ) {
      return {
        err: `Please enter a valid low value`,
        field: ERROR_FIELD_TOTO.LOW,
      };
    }

    high = extractRangeInput(input.high, input.system);
    if (
      isNaN(high.min) ||
      isNaN(high.max) ||
      high.min > input.system ||
      high.max > input.system
    ) {
      return {
        err: `Please enter a valid high value`,
        field: ERROR_FIELD_TOTO.HIGH,
      };
    }

    if (
      low.min + high.min > input.system ||
      low.max + high.max < input.system
    ) {
      return {
        err: "Please enter a valid low/high distribution that less than or equal to your system size.",
        field: ERROR_FIELD_TOTO.LOW,
      };
    }

    const isMinLowUpdated = input.system - high.max > low.min;
    if (isMinLowUpdated) low.min = input.system - high.max;

    const isMaxLowUpdated = input.system - high.min < low.max;
    if (isMaxLowUpdated) low.max = input.system - high.min;

    const isMinHighUpdated = input.system - low.max > high.min;
    if (isMinHighUpdated) high.min = input.system - low.max;

    const isMaxHighUpdated = input.system - low.min < high.max;
    if (isMaxHighUpdated) high.max = input.system - low.min;

    if (low.max < mustIncludePool.allPools.lowPools.size) {
      return {
        err: "Your low/high setting conflicts with the numbers you've included.",
        field:
          input.low !== "" && !isMaxLowUpdated
            ? ERROR_FIELD_TOTO.LOW
            : ERROR_FIELD_TOTO.HIGH,
      };
    }

    if (high.max < mustIncludePool.allPools.highPools.size) {
      return {
        err: "Your low/high setting conflicts with the numbers you've included.",
        field:
          input.high !== "" && !isMaxHighUpdated
            ? ERROR_FIELD_TOTO.HIGH
            : ERROR_FIELD_TOTO.LOW,
      };
    }

    requiredLowCount = Math.max(
      0,
      low.min - mustIncludePool.allPools.lowPools.size
    );
    if (requiredLowCount > pools.allPools.lowPools.size) {
      return {
        err: "Your low/high setting cannot be satisfied after applying your include and exclude settings.",
        field:
          input.low !== "" && !isMinLowUpdated
            ? ERROR_FIELD_TOTO.LOW
            : ERROR_FIELD_TOTO.HIGH,
      };
    }

    requiredHighCount = Math.max(
      0,
      high.min - mustIncludePool.allPools.highPools.size
    );
    if (requiredHighCount > pools.allPools.highPools.size) {
      return {
        err: "Your low/high setting cannot be satisfied after applying your include and exclude settings.",
        field:
          input.high !== "" && !isMinHighUpdated
            ? ERROR_FIELD_TOTO.HIGH
            : ERROR_FIELD_TOTO.LOW,
      };
    }

    const minOddLowCount = requiredLowCount + requiredOddCount - requiredCount;
    const minEvenLowCount =
      requiredLowCount + requiredEvenCount - requiredCount;
    if (
      minOddLowCount > pools.allPools.oddLowPools.size ||
      minEvenLowCount > pools.allPools.evenLowPools.size
    ) {
      return {
        err: "Your low/high setting cannot be satisfied after applying your include, exclude, and odd/even settings.",
        field:
          input.low !== "" && !isMinLowUpdated
            ? ERROR_FIELD_TOTO.LOW
            : ERROR_FIELD_TOTO.HIGH,
      };
    }

    const minOddHighCount =
      requiredHighCount + requiredOddCount - requiredCount;
    const minEvenHighCount =
      requiredHighCount + requiredEvenCount - requiredCount;
    if (
      minOddHighCount > pools.allPools.oddHighPools.size ||
      minEvenHighCount > pools.allPools.evenHighPools.size
    ) {
      return {
        err: "Your low/high setting cannot be satisfied after applying your include, exclude, and odd/even settings.",
        field:
          input.high !== "" && !isMinHighUpdated
            ? ERROR_FIELD_TOTO.HIGH
            : ERROR_FIELD_TOTO.LOW,
      };
    }

    if (input.includeCustomGroup) {
      if (
        low.min >
        pools.allPools.lowPools.size -
          customPool.allPools.lowPools.size +
          Math.min(maxCustomCount, customPool.allPools.lowPools.size)
      ) {
        return {
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, and custom group settings.",
          field:
            input.low !== "" && !isMinLowUpdated
              ? ERROR_FIELD_TOTO.LOW
              : ERROR_FIELD_TOTO.HIGH,
        };
      }

      if (
        high.min >
        pools.allPools.highPools.size -
          customPool.allPools.highPools.size +
          Math.min(maxCustomCount, customPool.allPools.highPools.size)
      ) {
        return {
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, and custom group settings.",
          field:
            input.high !== "" && !isMinHighUpdated
              ? ERROR_FIELD_TOTO.HIGH
              : ERROR_FIELD_TOTO.LOW,
        };
      }

      if (
        minOddLowCount >
          pools.allPools.oddLowPools.size -
            customPool.allPools.oddLowPools.size +
            Math.min(maxCustomCount, customPool.allPools.oddLowPools.size) ||
        minEvenLowCount >
          pools.allPools.evenLowPools.size -
            customPool.allPools.evenLowPools.size +
            Math.min(maxCustomCount, customPool.allPools.evenLowPools.size)
      ) {
        return {
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, custom group, and odd/even settings.",
          field:
            input.low !== "" && !isMinLowUpdated
              ? ERROR_FIELD_TOTO.LOW
              : ERROR_FIELD_TOTO.HIGH,
        };
      }

      if (
        minOddHighCount >
          pools.allPools.oddHighPools.size -
            customPool.allPools.oddHighPools.size +
            Math.min(maxCustomCount, customPool.allPools.oddHighPools.size) ||
        minEvenHighCount >
          pools.allPools.evenHighPools.size -
            customPool.allPools.evenHighPools.size +
            Math.min(maxCustomCount, customPool.allPools.evenHighPools.size)
      ) {
        return {
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, custom group, and odd/even settings.",
          field:
            input.high !== "" && !isMinHighUpdated
              ? ERROR_FIELD_TOTO.HIGH
              : ERROR_FIELD_TOTO.LOW,
        };
      }

      const minCustomLowCount = Math.max(
        0,
        minCustomCount - customPool.allPools.highPools.size
      );
      if (
        low.max - mustIncludePool.allPools.lowPools.size <
        minCustomLowCount
      ) {
        return {
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, and custom group settings.",
          field:
            input.low !== "" && !isMaxLowUpdated
              ? ERROR_FIELD_TOTO.LOW
              : ERROR_FIELD_TOTO.HIGH,
        };
      }

      const minCustomHighCount = Math.max(
        0,
        minCustomCount - customPool.allPools.lowPools.size
      );
      if (
        high.max - mustIncludePool.allPools.highPools.size <
        minCustomHighCount
      ) {
        return {
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, and custom group settings.",
          field:
            input.high !== "" && !isMaxHighUpdated
              ? ERROR_FIELD_TOTO.HIGH
              : ERROR_FIELD_TOTO.LOW,
        };
      }

      const skipCount = requiredCount - minCustomCount;
      const minCustomOddLowCount = Math.max(0, minOddLowCount - skipCount);
      const minCustomEvenLowCount = Math.max(0, minEvenLowCount - skipCount);
      if (
        minCustomOddLowCount > customPool.allPools.oddLowPools.size ||
        minCustomEvenLowCount > customPool.allPools.evenLowPools.size
      ) {
        return {
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, custom group, and odd/even settings.",
          field:
            input.low !== "" && !isMinLowUpdated
              ? ERROR_FIELD_TOTO.LOW
              : ERROR_FIELD_TOTO.HIGH,
        };
      }

      const minCustomOddHighCount = Math.max(0, minOddHighCount - skipCount);
      const minCustomEvenHighCount = Math.max(0, minEvenHighCount - skipCount);
      if (
        minCustomOddHighCount > customPool.allPools.oddHighPools.size ||
        minCustomEvenHighCount > customPool.allPools.evenHighPools.size
      ) {
        return {
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, custom group, and odd/even settings.",
          field:
            input.high !== "" && !isMinHighUpdated
              ? ERROR_FIELD_TOTO.HIGH
              : ERROR_FIELD_TOTO.LOW,
        };
      }
    }
  }

  // Range Group Rule
  if (input.includeRangeGroup) {
    let rangeCount10: RangeValue = { min: 0, max: 0 };
    let rangeCount20: RangeValue = { min: 0, max: 0 };
    let rangeCount30: RangeValue = { min: 0, max: 0 };
    let rangeCount40: RangeValue = { min: 0, max: 0 };
    let rangeCount50: RangeValue = { min: 0, max: 0 };
    let rangeCount60: RangeValue = { min: 0, max: 0 };
    let rangeCount70: RangeValue = { min: 0, max: 0 };

    if (rangeInfo.group >= 1) {
      rangeCount10 = extractRangeInput(input.rangeCount10, input.system);
      if (
        isNaN(rangeCount10.min) ||
        isNaN(rangeCount10.max) ||
        rangeCount10.min > input.system ||
        rangeCount10.max > input.system
      ) {
        return {
          err: `Please enter a valid range group value`,
          field: ERROR_FIELD_TOTO.RANGE_10,
        };
      }
    }
    if (rangeInfo.group >= 2) {
      rangeCount20 = extractRangeInput(input.rangeCount20, input.system);
      if (
        isNaN(rangeCount20.min) ||
        isNaN(rangeCount20.max) ||
        rangeCount20.min > input.system ||
        rangeCount20.max > input.system
      ) {
        return {
          err: `Please enter a valid range group value`,
          field: ERROR_FIELD_TOTO.RANGE_20,
        };
      }
    }
    if (rangeInfo.group >= 3) {
      rangeCount30 = extractRangeInput(input.rangeCount30, input.system);
      if (
        isNaN(rangeCount30.min) ||
        isNaN(rangeCount30.max) ||
        rangeCount30.min > input.system ||
        rangeCount30.max > input.system
      ) {
        return {
          err: `Please enter a valid range group value`,
          field: ERROR_FIELD_TOTO.RANGE_30,
        };
      }
    }
    if (rangeInfo.group >= 4) {
      rangeCount40 = extractRangeInput(input.rangeCount40, input.system);
      if (
        isNaN(rangeCount40.min) ||
        isNaN(rangeCount40.max) ||
        rangeCount40.min > input.system ||
        rangeCount40.max > input.system
      ) {
        return {
          err: `Please enter a valid range group value`,
          field: ERROR_FIELD_TOTO.RANGE_40,
        };
      }
    }
    if (rangeInfo.group >= 5) {
      rangeCount50 = extractRangeInput(input.rangeCount50, input.system);
      if (
        isNaN(rangeCount50.min) ||
        isNaN(rangeCount50.max) ||
        rangeCount50.min > input.system ||
        rangeCount50.max > input.system
      ) {
        return {
          err: `Please enter a valid range group value`,
          field: ERROR_FIELD_TOTO.RANGE_50,
        };
      }
    }
    if (rangeInfo.group >= 6) {
      rangeCount60 = extractRangeInput(input.rangeCount60, input.system);
      if (
        isNaN(rangeCount60.min) ||
        isNaN(rangeCount60.max) ||
        rangeCount60.min > input.system ||
        rangeCount60.max > input.system
      ) {
        return {
          err: `Please enter a valid range group value`,
          field: ERROR_FIELD_TOTO.RANGE_60,
        };
      }
    }
    if (rangeInfo.group >= 7) {
      rangeCount70 = extractRangeInput(input.rangeCount70, input.system);
      if (
        isNaN(rangeCount70.min) ||
        isNaN(rangeCount70.max) ||
        rangeCount70.min > input.system ||
        rangeCount70.max > input.system
      ) {
        return {
          err: `Please enter a valid range group value`,
          field: ERROR_FIELD_TOTO.RANGE_70,
        };
      }
    }

    const sumMin =
      rangeCount10.min +
      rangeCount20.min +
      rangeCount30.min +
      rangeCount40.min +
      rangeCount50.min +
      rangeCount60.min +
      rangeCount70.min;
    const sumMax =
      rangeCount10.max +
      rangeCount20.max +
      rangeCount30.max +
      rangeCount40.max +
      rangeCount50.max +
      rangeCount60.max +
      rangeCount70.max;
    if (sumMin > input.system || input.system > sumMax) {
      let field: ERROR_FIELD_TOTO;
      if (input.rangeCount10 !== "") {
        field = ERROR_FIELD_TOTO.RANGE_10;
      } else if (input.rangeCount20 !== "") {
        field = ERROR_FIELD_TOTO.RANGE_20;
      } else if (input.rangeCount30 !== "") {
        field = ERROR_FIELD_TOTO.RANGE_30;
      } else if (input.rangeCount40 !== "") {
        field = ERROR_FIELD_TOTO.RANGE_40;
      } else if (input.rangeCount50 !== "") {
        field = ERROR_FIELD_TOTO.RANGE_50;
      } else if (input.rangeCount60 !== "") {
        field = ERROR_FIELD_TOTO.RANGE_60;
      } else {
        field = ERROR_FIELD_TOTO.RANGE_70;
      }

      return {
        err: "Please enter a valid range group distribution that less than or equal to your system size.",
        field: field,
      };
    }

    let sumWithoutMin10 = sumMin - rangeCount10.min;
    if (input.system - rangeCount10.max > sumWithoutMin10) {
      sumWithoutMin10 = input.system - rangeCount10.max;
    }

    let sumWithoutMax10 = sumMax - rangeCount10.max;
    if (input.system - rangeCount10.min < sumWithoutMax10) {
      sumWithoutMax10 = input.system - rangeCount10.min;
    }

    let sumWithoutMin20 = sumMin - rangeCount20.min;
    if (input.system - rangeCount20.max > sumWithoutMin20) {
      sumWithoutMin20 = input.system - rangeCount20.max;
    }

    let sumWithoutMax20 = sumMax - rangeCount20.max;
    if (input.system - rangeCount20.min < sumWithoutMax20) {
      sumWithoutMax20 = input.system - rangeCount20.min;
    }

    let sumWithoutMin30 = sumMin - rangeCount30.min;
    if (input.system - rangeCount30.max > sumWithoutMin30) {
      sumWithoutMin30 = input.system - rangeCount30.max;
    }

    let sumWithoutMax30 = sumMax - rangeCount30.max;
    if (input.system - rangeCount30.min < sumWithoutMax30) {
      sumWithoutMax30 = input.system - rangeCount30.min;
    }

    let sumWithoutMin40 = sumMin - rangeCount40.min;
    if (input.system - rangeCount40.max > sumWithoutMin40) {
      sumWithoutMin40 = input.system - rangeCount40.max;
    }

    let sumWithoutMax40 = sumMax - rangeCount40.max;
    if (input.system - rangeCount40.min < sumWithoutMax40) {
      sumWithoutMax40 = input.system - rangeCount40.min;
    }

    let sumWithoutMin50 = sumMin - rangeCount50.min;
    if (input.system - rangeCount50.max > sumWithoutMin50) {
      sumWithoutMin50 = input.system - rangeCount50.max;
    }

    let sumWithoutMax50 = sumMax - rangeCount50.max;
    if (input.system - rangeCount50.min < sumWithoutMax50) {
      sumWithoutMax50 = input.system - rangeCount50.min;
    }

    let sumWithoutMin60 = sumMin - rangeCount60.min;
    if (input.system - rangeCount60.max > sumWithoutMin60) {
      sumWithoutMin60 = input.system - rangeCount60.max;
    }

    let sumWithoutMax60 = sumMax - rangeCount60.max;
    if (input.system - rangeCount60.min < sumWithoutMax60) {
      sumWithoutMax60 = input.system - rangeCount60.min;
    }

    let sumWithoutMin70 = sumMin - rangeCount70.min;
    if (input.system - rangeCount70.max > sumWithoutMin70) {
      sumWithoutMin70 = input.system - rangeCount70.max;
    }

    let sumWithoutMax70 = sumMax - rangeCount70.max;
    if (input.system - rangeCount70.min < sumWithoutMax70) {
      sumWithoutMax70 = input.system - rangeCount70.min;
    }

    if (
      rangeCount10.max < mustIncludePool.range10Pools.allPools.size ||
      sumWithoutMax10 <
        mustIncludePool.allPools.allPools.size -
          mustIncludePool.range10Pools.allPools.size
    ) {
      return {
        err: "Your range group setting conflicts with the numbers you've included.",
        field: ERROR_FIELD_TOTO.RANGE_10,
      };
    }

    if (
      rangeCount20.max < mustIncludePool.range20Pools.allPools.size ||
      sumWithoutMax20 <
        mustIncludePool.allPools.allPools.size -
          mustIncludePool.range20Pools.allPools.size
    ) {
      return {
        err: "Your range group setting conflicts with the numbers you've included.",
        field: ERROR_FIELD_TOTO.RANGE_20,
      };
    }

    if (
      rangeCount30.max < mustIncludePool.range30Pools.allPools.size ||
      sumWithoutMax30 <
        mustIncludePool.allPools.allPools.size -
          mustIncludePool.range30Pools.allPools.size
    ) {
      return {
        err: "Your range group setting conflicts with the numbers you've included.",
        field: ERROR_FIELD_TOTO.RANGE_30,
      };
    }

    if (
      rangeCount40.max < mustIncludePool.range40Pools.allPools.size ||
      sumWithoutMax40 <
        mustIncludePool.allPools.allPools.size -
          mustIncludePool.range40Pools.allPools.size
    ) {
      return {
        err: "Your range group setting conflicts with the numbers you've included.",
        field: ERROR_FIELD_TOTO.RANGE_40,
      };
    }

    if (
      rangeCount50.max < mustIncludePool.range50Pools.allPools.size ||
      sumWithoutMax50 <
        mustIncludePool.allPools.allPools.size -
          mustIncludePool.range50Pools.allPools.size
    ) {
      return {
        err: "Your range group setting conflicts with the numbers you've included.",
        field: ERROR_FIELD_TOTO.RANGE_50,
      };
    }

    if (
      rangeCount60.max < mustIncludePool.range60Pools.allPools.size ||
      sumWithoutMax60 <
        mustIncludePool.allPools.allPools.size -
          mustIncludePool.range60Pools.allPools.size
    ) {
      return {
        err: "Your range group setting conflicts with the numbers you've included.",
        field: ERROR_FIELD_TOTO.RANGE_60,
      };
    }

    if (
      rangeCount70.max < mustIncludePool.range70Pools.allPools.size ||
      sumWithoutMax70 <
        mustIncludePool.allPools.allPools.size -
          mustIncludePool.range70Pools.allPools.size
    ) {
      return {
        err: "Your range group setting conflicts with the numbers you've included.",
        field: ERROR_FIELD_TOTO.RANGE_70,
      };
    }

    const requiredMin10Count = Math.max(
      0,
      rangeCount10.min - mustIncludePool.range10Pools.allPools.size
    );
    if (requiredMin10Count > pools.range10Pools.allPools.size) {
      return {
        err: "Your range group setting cannot be satisfied after applying your include and exclude settings.",
        field: ERROR_FIELD_TOTO.RANGE_10,
      };
    }

    const requiredMin20Count = Math.max(
      0,
      rangeCount20.min - mustIncludePool.range20Pools.allPools.size
    );
    if (requiredMin20Count > pools.range20Pools.allPools.size) {
      return {
        err: "Your range group setting cannot be satisfied after applying your include and exclude settings.",
        field: ERROR_FIELD_TOTO.RANGE_20,
      };
    }

    const requiredMin30Count = Math.max(
      0,
      rangeCount30.min - mustIncludePool.range30Pools.allPools.size
    );
    if (requiredMin30Count > pools.range30Pools.allPools.size) {
      return {
        err: "Your range group setting cannot be satisfied after applying your include and exclude settings.",
        field: ERROR_FIELD_TOTO.RANGE_30,
      };
    }

    const requiredMin40Count = Math.max(
      0,
      rangeCount40.min - mustIncludePool.range40Pools.allPools.size
    );
    if (requiredMin40Count > pools.range40Pools.allPools.size) {
      return {
        err: "Your range group setting cannot be satisfied after applying your include and exclude settings.",
        field: ERROR_FIELD_TOTO.RANGE_40,
      };
    }

    const requiredMin50Count = Math.max(
      0,
      rangeCount50.min - mustIncludePool.range50Pools.allPools.size
    );
    if (requiredMin50Count > pools.range50Pools.allPools.size) {
      return {
        err: "Your range group setting cannot be satisfied after applying your include and exclude settings.",
        field: ERROR_FIELD_TOTO.RANGE_50,
      };
    }

    const requiredMin60Count = Math.max(
      0,
      rangeCount60.min - mustIncludePool.range60Pools.allPools.size
    );
    if (requiredMin60Count > pools.range60Pools.allPools.size) {
      return {
        err: "Your range group setting cannot be satisfied after applying your include and exclude settings.",
        field: ERROR_FIELD_TOTO.RANGE_60,
      };
    }

    const requiredMin70Count = Math.max(
      0,
      rangeCount70.min - mustIncludePool.range70Pools.allPools.size
    );
    if (requiredMin70Count > pools.range70Pools.allPools.size) {
      return {
        err: "Your range group setting cannot be satisfied after applying your include and exclude settings.",
        field: ERROR_FIELD_TOTO.RANGE_70,
      };
    }

    const requiredCountWithoutMin10 = Math.max(
      0,
      sumWithoutMin10 -
        (mustIncludePool.allPools.allPools.size -
          mustIncludePool.range10Pools.allPools.size)
    );
    if (
      requiredCountWithoutMin10 >
      pools.allPools.allPools.size - pools.range10Pools.allPools.size
    ) {
      return {
        err: "Your range group setting cannot be satisfied after applying your include and exclude settings.",
        field: ERROR_FIELD_TOTO.RANGE_10,
      };
    }

    const requiredCountWithoutMin20 = Math.max(
      0,
      sumWithoutMin20 -
        (mustIncludePool.allPools.allPools.size -
          mustIncludePool.range20Pools.allPools.size)
    );
    if (
      requiredCountWithoutMin20 >
      pools.allPools.allPools.size - pools.range20Pools.allPools.size
    ) {
      return {
        err: "Your range group setting cannot be satisfied after applying your include and exclude settings.",
        field: ERROR_FIELD_TOTO.RANGE_20,
      };
    }

    const requiredCountWithoutMin30 = Math.max(
      0,
      sumWithoutMin30 -
        (mustIncludePool.allPools.allPools.size -
          mustIncludePool.range30Pools.allPools.size)
    );
    if (
      requiredCountWithoutMin30 >
      pools.allPools.allPools.size - pools.range30Pools.allPools.size
    ) {
      return {
        err: "Your range group setting cannot be satisfied after applying your include and exclude settings.",
        field: ERROR_FIELD_TOTO.RANGE_30,
      };
    }

    const requiredCountWithoutMin40 = Math.max(
      0,
      sumWithoutMin40 -
        (mustIncludePool.allPools.allPools.size -
          mustIncludePool.range40Pools.allPools.size)
    );
    if (
      requiredCountWithoutMin40 >
      pools.allPools.allPools.size - pools.range40Pools.allPools.size
    ) {
      return {
        err: "Your range group setting cannot be satisfied after applying your include and exclude settings.",
        field: ERROR_FIELD_TOTO.RANGE_40,
      };
    }

    const requiredCountWithoutMin50 = Math.max(
      0,
      sumWithoutMin50 -
        (mustIncludePool.allPools.allPools.size -
          mustIncludePool.range50Pools.allPools.size)
    );
    if (
      requiredCountWithoutMin50 >
      pools.allPools.allPools.size - pools.range50Pools.allPools.size
    ) {
      return {
        err: "Your range group setting cannot be satisfied after applying your include and exclude settings.",
        field: ERROR_FIELD_TOTO.RANGE_50,
      };
    }

    const requiredCountWithoutMin60 = Math.max(
      0,
      sumWithoutMin60 -
        (mustIncludePool.allPools.allPools.size -
          mustIncludePool.range60Pools.allPools.size)
    );
    if (
      requiredCountWithoutMin60 >
      pools.allPools.allPools.size - pools.range60Pools.allPools.size
    ) {
      return {
        err: "Your range group setting cannot be satisfied after applying your include and exclude settings.",
        field: ERROR_FIELD_TOTO.RANGE_60,
      };
    }

    const requiredCountWithoutMin70 = Math.max(
      0,
      sumWithoutMin70 -
        (mustIncludePool.allPools.allPools.size -
          mustIncludePool.range70Pools.allPools.size)
    );
    if (
      requiredCountWithoutMin70 >
      pools.allPools.allPools.size - pools.range70Pools.allPools.size
    ) {
      return {
        err: "Your range group setting cannot be satisfied after applying your include and exclude settings.",
        field: ERROR_FIELD_TOTO.RANGE_70,
      };
    }

    // Validate range custom group
    if (input.includeCustomGroup) {
      const minCustomRange10 = Math.max(
        0,
        minCustomCount -
          (customPool.allPools.allPools.size -
            customPool.range10Pools.allPools.size)
      );

      // if (
      //   sumWithoutMax10 >

      // ) {
      //   return {
      //     err: `Your range group setting cannot be satisfied after applying your custom group settings.`,
      //     field: ERROR_FIELD_TOTO.RANGE_10,
      //   };
      // }

      // if (
      //   customCount.min >
      //     input.system - mustIncludePool.allPools.allPools.size ||
      //   customCount.min > pools.allPools.allPools.size
      // ) {
      //   return {
      //     err: `The custom number count cannot exceed the remaining available numbers or your system size limit.`,
      //     field: ERROR_FIELD_TOTO.CUSTOM_COUNT,
      //   };
      // }

      // if (
      //   pools.allPools.allPools.size -
      //     customPool.allPools.allPools.size +
      //     customCount.max <
      //   requiredCount
      // ) {
      //   return {
      //     err: "Not enough remaining numbers to complete a combination with the selected custom group count.",
      //     field: ERROR_FIELD_TOTO.CUSTOM_COUNT,
      //   };
      // }
    }

    // Validate range odd/even
    if (input.includeOddEven) {
    }

    // Validate range low/high
    if (input.includeLowHigh) {
    }
  }

  return { err: "", field: null };
};
