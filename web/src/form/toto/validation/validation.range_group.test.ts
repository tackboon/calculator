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
  const rangeInfo = getRangeInfo(TOTO_RANGE.THIRTY_FIVE);
  const defaultPools = initDefaultTotoPool(TOTO_RANGE.THIRTY_FIVE);

  it.each([
    {
      input: {
        system: 6,
        includeRangeGroup: true,
        rangeCount10: "",
        rangeCount20: "2-5",
        rangeCount30: "1",
        rangeCount40: "",
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
        rangeCount40: "",
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
        rangeCount10: "",
        rangeCount20: "",
        rangeCount30: "",
        rangeCount40: "6",
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
        "The remaining pool size is not enough for your range group settings.",
      expectedField: ERROR_FIELD_TOTO.RANGE_40,
    },
    {
      input: {
        system: 6,
        includeRangeGroup: true,
        rangeCount10: "0-3",
        rangeCount20: "2-5",
        rangeCount30: "0-1",
        rangeCount40: "",
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
        rangeCount40: "",
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
      expectedField: ERROR_FIELD_TOTO.RANGE_10,
    },
    {
      input: {
        system: 6,
        includeRangeGroup: true,
        rangeCount10: "",
        rangeCount20: "2-6",
        rangeCount30: "",
        rangeCount40: "",
      },
      mustIncludes: "",
      mustExcludes: "11,12,13,14,15,16,17,18,19,20",
      customGroups: "",
      customCount: "",
      odd: "",
      even: "",
      low: "",
      high: "",
      expectedErr:
        "Your range group setting cannot be satisfied after applying your include and exclude settings.",
      expectedField: ERROR_FIELD_TOTO.RANGE_20,
    },
    {
      input: {
        system: 6,
        includeRangeGroup: true,
        rangeCount10: "0-1",
        rangeCount20: "",
        rangeCount30: "0-1",
        rangeCount40: "0-1",
      },
      mustIncludes: "",
      mustExcludes: "11,12,13,14,15,16,17,18,19,20",
      customGroups: "",
      customCount: "",
      odd: "",
      even: "",
      low: "",
      high: "",
      expectedErr:
        "Your range group setting cannot be satisfied after applying your include and exclude settings.",
      expectedField: ERROR_FIELD_TOTO.RANGE_10,
    },
    {
      input: {
        system: 6,
        includeRangeGroup: true,
        rangeCount10: "0",
        rangeCount20: "0",
        rangeCount30: "1",
        rangeCount40: "",
      },
      mustIncludes: "",
      mustExcludes: "",
      customGroups: "",
      customCount: "",
      odd: "",
      even: "5",
      low: "",
      high: "",
      expectedErr:
        "Your range group setting cannot be satisfied after applying odd/even settings.",
      expectedField: ERROR_FIELD_TOTO.RANGE_10,
    },
    {
      input: {
        system: 6,
        includeRangeGroup: true,
        rangeCount10: "0",
        rangeCount20: "0",
        rangeCount30: "1",
        rangeCount40: "",
      },
      mustIncludes: "",
      mustExcludes: "",
      customGroups: "",
      customCount: "",
      odd: "",
      even: "",
      low: "3",
      high: "",
      expectedErr:
        "Your range group setting cannot be satisfied after applying low/high settings.",
      expectedField: ERROR_FIELD_TOTO.RANGE_10,
    },
    {
      input: {
        system: 6,
        includeRangeGroup: true,
        rangeCount10: "0",
        rangeCount20: "0-4",
        rangeCount30: "0",
        rangeCount40: "",
      },
      mustIncludes: "",
      mustExcludes: "17,19",
      customGroups: "",
      customCount: "",
      odd: "6",
      even: "",
      low: "4",
      high: "",
      expectedErr:
        "Your range group setting cannot be satisfied after applying odd/even and low/high settings.",
      expectedField: ERROR_FIELD_TOTO.RANGE_10,
    },
    {
      input: {
        system: 6,
        includeRangeGroup: true,
        rangeCount10: "",
        rangeCount20: "",
        rangeCount30: "3",
        rangeCount40: "",
      },
      mustIncludes: "",
      mustExcludes: "",
      customGroups: "21,22,23,24,25,26,27,28,29",
      customCount: "0",
      odd: "",
      even: "",
      low: "",
      high: "",
      expectedErr:
        "Your range group setting cannot be satisfied after applying your custom group settings.",
      expectedField: ERROR_FIELD_TOTO.RANGE_30,
    },
    {
      input: {
        system: 6,
        includeRangeGroup: true,
        rangeCount10: "0",
        rangeCount20: "0",
        rangeCount30: "3",
        rangeCount40: "",
      },
      mustIncludes: "",
      mustExcludes: "32,34",
      customGroups: "21,22,23,24,25,26,27,28,29",
      customCount: "3",
      odd: "",
      even: "6",
      low: "",
      high: "",
      expectedErr:
        "Your range group setting cannot be satisfied after applying odd/even settings.",
      expectedField: ERROR_FIELD_TOTO.RANGE_10,
    },
  ])(
    "includes: $mustIncludes, excludes: $mustExcludes, customGroups: $customGroups, customCount: $customCount, odd: $odd, even: $even, low: $low, high: $high, range10: $input.rangeCount10, range20: $input.rangeCount20, range30: $input.rangeCount30, range40: $input.rangeCount40",
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
