import { ERROR_FIELD_TOTO, TOTO_RANGE } from "../toto.type";
import { getRangeInfo, getTotoPoolsCopy, initDefaultTotoPool } from "../utils";
import { validateCustomGroup } from "./validation.custom_group";
import { validateLowHigh } from "./validation.low_high";
import {
  validateExcludeList,
  validateIncludeList,
} from "./validation.number_filter";
import { validateOddEven } from "./validation.odd_even";

describe("validateLowHigh", () => {
  const rangeInfo = getRangeInfo(TOTO_RANGE.THIRTY);
  const defaultPools = initDefaultTotoPool(TOTO_RANGE.THIRTY);

  it.each([
    {
      input: {
        includeLowHigh: true,
        low: "1-4",
        high: "3-4",
        system: 6,
      },
      mustIncludes: "5,6,7,20,21,22",
      mustExcludes: "1,30",
      customGroups: "29,28,27,4,3,2,10",
      customCount: "0",
      odd: "",
      even: "",
      expectedLow: { min: 2, max: 3 },
      expectedHigh: { min: 3, max: 4 },
      expectedRequiredCount: {
        low: 0,
        high: 0,
        oddLow: 0,
        oddHigh: 0,
        evenLow: 0,
        evenHigh: 0,
      },
      expectedErr: "",
      expectedField: 0,
    },
    {
      input: {
        includeLowHigh: true,
        low: "3-6",
        high: "4",
        system: 6,
      },
      mustIncludes: "",
      mustExcludes: "",
      customGroups: "",
      customCount: "",
      odd: "",
      even: "",
      expectedLow: { min: 3, max: 6 },
      expectedHigh: { min: 4, max: 4 },
      expectedRequiredCount: {
        low: 0,
        high: 0,
        oddLow: 0,
        oddHigh: 0,
        evenLow: 0,
        evenHigh: 0,
      },
      expectedErr:
        "Please enter a valid low/high distribution that matches your system size.",
      expectedField: ERROR_FIELD_TOTO.LOW,
    },
    {
      input: {
        includeLowHigh: true,
        low: "",
        high: "0-2",
        system: 6,
      },
      mustIncludes: "15,16,17,18",
      mustExcludes: "",
      customGroups: "",
      customCount: "",
      odd: "",
      even: "",
      expectedLow: { min: 4, max: 6 },
      expectedHigh: { min: 0, max: 2 },
      expectedRequiredCount: {
        low: 0,
        high: 0,
        oddLow: 0,
        oddHigh: 0,
        evenLow: 0,
        evenHigh: 0,
      },
      expectedErr:
        "Your low/high setting conflicts with the numbers you've included.",
      expectedField: ERROR_FIELD_TOTO.HIGH,
    },
    {
      input: {
        includeLowHigh: true,
        low: "",
        high: "6",
        system: 6,
      },
      mustIncludes: "",
      mustExcludes: "16,17,18,19,20,21,22,23,24,25",
      customGroups: "",
      customCount: "",
      odd: "",
      even: "",
      expectedLow: { min: 0, max: 0 },
      expectedHigh: { min: 6, max: 6 },
      expectedRequiredCount: {
        low: 0,
        high: 6,
        oddLow: 0,
        oddHigh: 0,
        evenLow: 0,
        evenHigh: 0,
      },
      expectedErr:
        "Your low/high setting cannot be satisfied after applying your include and exclude settings.",
      expectedField: ERROR_FIELD_TOTO.HIGH,
    },
    {
      input: {
        includeLowHigh: true,
        low: "3",
        high: "",
        system: 6,
      },
      mustIncludes: "1,30",
      mustExcludes: "3,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,24",
      customGroups: "",
      customCount: "",
      odd: "5",
      even: "",
      expectedLow: { min: 3, max: 3 },
      expectedHigh: { min: 3, max: 3 },
      expectedRequiredCount: {
        low: 2,
        high: 2,
        oddLow: 2,
        oddHigh: 2,
        evenLow: 0,
        evenHigh: 0,
      },
      expectedErr:
        "Your low/high setting cannot be satisfied after applying your include, exclude, and odd/even settings.",
      expectedField: ERROR_FIELD_TOTO.LOW,
    },
    {
      input: {
        includeLowHigh: true,
        low: "1-6",
        high: "",
        system: 6,
      },
      mustIncludes: "",
      mustExcludes: "3,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24",
      customGroups: "1,2,4",
      customCount: "0",
      odd: "",
      even: "",
      expectedLow: { min: 1, max: 6 },
      expectedHigh: { min: 0, max: 5 },
      expectedRequiredCount: {
        low: 1,
        high: 0,
        oddLow: 0,
        oddHigh: 0,
        evenLow: 0,
        evenHigh: 0,
      },
      expectedErr:
        "Your low/high setting cannot be satisfied after applying your include, exclude, and custom group settings.",
      expectedField: ERROR_FIELD_TOTO.LOW,
    },
    {
      input: {
        includeLowHigh: true,
        low: "2",
        high: "",
        system: 6,
      },
      mustIncludes: "",
      mustExcludes: "6,7,8,9,10,11,12,13,14,15,16,17,18,19,21,23,25",
      customGroups: "2,4,20",
      customCount: "1",
      odd: "",
      even: "6",
      expectedLow: { min: 2, max: 2 },
      expectedHigh: { min: 4, max: 4 },
      expectedRequiredCount: {
        low: 2,
        high: 4,
        oddLow: 0,
        oddHigh: 0,
        evenLow: 2,
        evenHigh: 4,
      },
      expectedErr:
        "Your low/high setting cannot be satisfied after applying your include, exclude, custom group, and odd/even settings.",
      expectedField: ERROR_FIELD_TOTO.LOW,
    },
    {
      input: {
        includeLowHigh: true,
        low: "3",
        high: "",
        system: 6,
      },
      mustIncludes: "6,7,8",
      mustExcludes: "",
      customGroups: "1,2,3,4,5",
      customCount: "3",
      odd: "",
      even: "",
      expectedLow: { min: 3, max: 3 },
      expectedHigh: { min: 3, max: 3 },
      expectedRequiredCount: {
        low: 0,
        high: 3,
        oddLow: 0,
        oddHigh: 0,
        evenLow: 0,
        evenHigh: 0,
      },
      expectedErr:
        "Your low/high setting cannot be satisfied after applying your include, exclude, and custom group settings.",
      expectedField: ERROR_FIELD_TOTO.LOW,
    },
    {
      input: {
        includeLowHigh: true,
        low: "3",
        high: "",
        system: 6,
      },
      mustIncludes: "16,18,20",
      mustExcludes: "",
      customGroups: "25,26,27,28,29,30",
      customCount: "3",
      odd: "",
      even: "3",
      expectedLow: { min: 3, max: 3 },
      expectedHigh: { min: 3, max: 3 },
      expectedRequiredCount: {
        low: 3,
        high: 0,
        oddLow: 3,
        oddHigh: 0,
        evenLow: 0,
        evenHigh: 0,
      },
      expectedErr:
        "Your low/high setting cannot be satisfied after applying your include, exclude, and custom group settings.",
      expectedField: ERROR_FIELD_TOTO.LOW,
    },
  ])(
    "includes: $mustIncludes, excludes: $mustExcludes, customGroups: $customGroups, customCount: $customCount, odd: $odd, even: $even, low: $input.low, high: $input.high",
    ({
      input,
      mustIncludes,
      mustExcludes,
      customGroups,
      customCount,
      odd,
      even,
      expectedLow,
      expectedHigh,
      expectedRequiredCount,
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
        input,
        requiredCount,
        availablePools,
        mustIncludePools,
        customRes.customPools,
        customRes.customCount,
        oddEvenRes.requiredOddCount,
        oddEvenRes.requiredEvenCount
      );

      expect(lowHighRes.low.min).toBe(expectedLow.min);
      expect(lowHighRes.low.max).toBe(expectedLow.max);
      expect(lowHighRes.high.min).toBe(expectedHigh.min);
      expect(lowHighRes.high.max).toBe(expectedHigh.max);
      expect(lowHighRes.requiredLowCount).toBe(expectedRequiredCount.low);
      expect(lowHighRes.requiredHighCount).toBe(expectedRequiredCount.high);
      expect(lowHighRes.requiredOddLowCount).toBe(expectedRequiredCount.oddLow);
      expect(lowHighRes.requiredOddHighCount).toBe(
        expectedRequiredCount.oddHigh
      );
      expect(lowHighRes.requiredEvenLowCount).toBe(
        expectedRequiredCount.evenLow
      );
      expect(lowHighRes.requiredEvenHighCount).toBe(
        expectedRequiredCount.evenHigh
      );
      expect(includeRes.err).toBe("");
      expect(excludeRes.err).toBe("");
      expect(customRes.err).toBe("");
      expect(oddEvenRes.err).toBe("");
      expect(lowHighRes.err).toBe(expectedErr);
      expect(lowHighRes.field).toBe(expectedField);
    }
  );
});
