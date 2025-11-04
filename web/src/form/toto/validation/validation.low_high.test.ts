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
      const { mustIncludePools, requiredCount } = validateIncludeList(
        { mustIncludes, system: input.system },
        rangeInfo,
        availablePools
      );

      validateExcludeList(
        { mustExcludes, system: input.system },
        rangeInfo,
        availablePools,
        mustIncludePools
      );

      const customRes = validateCustomGroup(
        {
          includeCustomGroup: true,
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
      expect(lowHighRes.err).toBe(expectedErr);
      expect(lowHighRes.field).toBe(expectedField);
    }
  );
});
