import { ERROR_FIELD_TOTO, TOTO_RANGE } from "../toto.type";
import { getRangeInfo, getTotoPoolsCopy, initDefaultTotoPool } from "../utils";
import { validateCustomGroup } from "./validation.custom_group";
import { validateLowHigh } from "./validation.low_high";
import {
  validateExcludeList,
  validateIncludeList,
} from "./validation.number_filter";
import { validateOddEven } from "./validation.odd_even";
import { validateRangeGroup } from "./validation.range_group";

describe("validateRangeGroup", () => {
  const rangeInfo = getRangeInfo(TOTO_RANGE.THIRTY);
  const defaultPools = initDefaultTotoPool(TOTO_RANGE.THIRTY);

  it.each([
    {
      input: {
        system: 6,
        includeRangeGroup: true,
        rangeCount10: "",
        rangeCount20: "2-5",
        rangeCount30: "1",
      },
      mustIncludes: "",
      mustExcludes: "",
      customGroups: "",
      customCount: "",
      odd: "",
      even: "",
      low: "",
      high: "",
      expectedErr: "",
      expectedField: 0,
    },
    {
      input: {
        system: 6,
        includeRangeGroup: true,
        rangeCount10: "4",
        rangeCount20: "2-5",
        rangeCount30: "1",
      },
      mustIncludes: "",
      mustExcludes: "",
      customGroups: "",
      customCount: "",
      odd: "",
      even: "",
      low: "",
      high: "",
      expectedErr:
        "Please enter a valid range group distribution that matches your system size.",
      expectedField: ERROR_FIELD_TOTO.RANGE_10,
    },
    {
      input: {
        system: 6,
        includeRangeGroup: true,
        rangeCount10: "0-3",
        rangeCount20: "2-5",
        rangeCount30: "0-1",
      },
      mustIncludes: "22,23",
      mustExcludes: "",
      customGroups: "",
      customCount: "",
      odd: "",
      even: "",
      low: "",
      high: "",
      expectedErr:
        "Your range group setting conflicts with the numbers you've included.",
      expectedField: ERROR_FIELD_TOTO.RANGE_30,
    },
    {
      input: {
        system: 6,
        includeRangeGroup: true,
        rangeCount10: "3",
        rangeCount20: "2-5",
        rangeCount30: "",
      },
      mustIncludes: "22,23",
      mustExcludes: "",
      customGroups: "",
      customCount: "",
      odd: "",
      even: "",
      low: "",
      high: "",
      expectedErr:
        "Your range group setting conflicts with the numbers you've included.",
      expectedField: ERROR_FIELD_TOTO.RANGE_30,
    },
  ])(
    "includes: $mustIncludes, excludes: $mustExcludes, customGroups: $customGroups, customCount: $customCount, odd: $odd, even: $even, low: $low, high: $high, range10: $input.rangeCount10, range20: $input.rangeCount20, range30: $input.rangeCount30, range40: $input.rangeCount40, range50: $input.rangeCount50, range60: $input.rangeCount60, range70: $input.rangeCount70",
    ({
      input,
      mustIncludes,
      mustExcludes,
      customGroups,
      customCount,
      odd,
      even,
      low,
      high,
      expectedErr,
      expectedField,
    }) => {
      const availablePools = getTotoPoolsCopy(defaultPools);
      const includeRes = validateIncludeList(
        { mustIncludes, system: input.system },
        rangeInfo,
        availablePools
      );
      const { mustIncludePools, requiredCount } = includeRes;

      const excludeRes = validateExcludeList(
        { mustExcludes, system: input.system },
        rangeInfo,
        availablePools,
        mustIncludePools
      );

      const customRes = validateCustomGroup(
        {
          customGroups,
          customCount,
          system: input.system,
        },
        rangeInfo,
        availablePools,
        requiredCount
      );

      const oddEvenRes = validateOddEven(
        { includeOddEven: true, odd, even, system: input.system },
        availablePools,
        mustIncludePools,
        customRes.customPools,
        customRes.customCount
      );

      const lowHighRes = validateLowHigh(
        { includeLowHigh: true, low, high, system: input.system },
        requiredCount,
        availablePools,
        mustIncludePools,
        customRes.customPools,
        customRes.customCount,
        oddEvenRes.requiredOddCount,
        oddEvenRes.requiredEvenCount
      );

      const rangeRes = validateRangeGroup(
        {
          ...input,
          rangeCount40: "",
          rangeCount50: "",
          rangeCount60: "",
          rangeCount70: "",
        },
        rangeInfo,
        requiredCount,
        availablePools,
        mustIncludePools,
        customRes.customPools,
        customRes.customCount,
        oddEvenRes.requiredOddCount,
        oddEvenRes.requiredEvenCount,
        lowHighRes.requiredLowCount,
        lowHighRes.requiredHighCount,
        lowHighRes.requiredOddLowCount,
        lowHighRes.requiredOddHighCount,
        lowHighRes.requiredEvenLowCount,
        lowHighRes.requiredEvenHighCount
      );

      expect(includeRes.err).toBe("");
      expect(excludeRes.err).toBe("");
      expect(customRes.err).toBe("");
      expect(oddEvenRes.err).toBe("");
      expect(lowHighRes.err).toBe("");
      expect(rangeRes.err).toBe(expectedErr);
      expect(rangeRes.field).toBe(expectedField);
    }
  );
});
