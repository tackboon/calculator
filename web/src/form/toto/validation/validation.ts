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
  const { odd, even, requiredOddCount, requiredEvenCount } = oddEvenRes;

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
    low,
    high,
    requiredLowCount,
    requiredHighCount,
    requiredOddLowCount,
    requiredOddHighCount,
    requiredEvenLowCount,
    requiredEvenHighCount,
  } = lowHighRes;

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
