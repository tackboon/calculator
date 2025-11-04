import { ERROR_FIELD_TOTO, TOTO_RANGE } from "../toto.type";
import { getRangeInfo, getTotoPoolsCopy, initDefaultTotoPool } from "../utils";
import { validateCustomGroup } from "./validation.custom_group";
import {
  validateExcludeList,
  validateIncludeList,
} from "./validation.number_filter";
import { validateOddEven } from "./validation.odd_even";

describe("validateCustomGroup", () => {
  const rangeInfo = getRangeInfo(TOTO_RANGE.THIRTY);
  const defaultPools = initDefaultTotoPool(TOTO_RANGE.THIRTY);

  it.each([
    {
      input: {
        includeOddEven: true,
        odd: "",
        even: "",
        system: 6,
      },
      mustIncludes: "1",
      mustExcludes:
        "11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30",
      customGroups: "2,3,4",
      customCount: "2",
      expectedMinOdd: 0,
      expectedMaxOdd: 6,
      expectedMinEven: 0,
      expectedMaxEven: 6,
      expectedRemainingOddCount: 0,
      expectedRemainingEvenCount: 0,
      expectedErr: "",
      expectedField: 0,
    },
    {
      input: {
        includeOddEven: true,
        odd: "2-6",
        even: "5-6",
        system: 6,
      },
      mustIncludes: "",
      mustExcludes: "",
      customGroups: "",
      customCount: "",
      expectedMinOdd: 2,
      expectedMaxOdd: 6,
      expectedMinEven: 5,
      expectedMaxEven: 6,
      expectedRemainingOddCount: 0,
      expectedRemainingEvenCount: 0,
      expectedErr:
        "Please enter a valid odd/even distribution that matches your system size.",
      expectedField: ERROR_FIELD_TOTO.ODD,
    },
    {
      input: {
        includeOddEven: true,
        odd: "0-3",
        even: "1-2",
        system: 6,
      },
      mustIncludes: "",
      mustExcludes: "",
      customGroups: "",
      customCount: "",
      expectedMinOdd: 0,
      expectedMaxOdd: 3,
      expectedMinEven: 1,
      expectedMaxEven: 2,
      expectedRemainingOddCount: 0,
      expectedRemainingEvenCount: 0,
      expectedErr:
        "Please enter a valid odd/even distribution that matches your system size.",
      expectedField: ERROR_FIELD_TOTO.ODD,
    },
    {
      input: {
        includeOddEven: true,
        odd: "0-3",
        even: "0-6",
        system: 6,
      },
      mustIncludes: "1,3,5,7",
      mustExcludes: "",
      customGroups: "",
      customCount: "",
      expectedMinOdd: 0,
      expectedMaxOdd: 3,
      expectedMinEven: 3,
      expectedMaxEven: 6,
      expectedRemainingOddCount: 0,
      expectedRemainingEvenCount: 0,
      expectedErr:
        "Your odd/even setting conflicts with the numbers you've included.",
      expectedField: ERROR_FIELD_TOTO.ODD,
    },
    {
      input: {
        includeOddEven: true,
        odd: "5",
        even: "",
        system: 6,
      },
      mustIncludes: "1,3,5,7",
      mustExcludes:
        "11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30",
      customGroups: "9,10",
      customCount: "0",
      expectedMinOdd: 5,
      expectedMaxOdd: 5,
      expectedMinEven: 1,
      expectedMaxEven: 1,
      expectedRemainingOddCount: 1,
      expectedRemainingEvenCount: 1,
      expectedErr:
        "Your odd/even setting cannot be satisfied after applying your include, exclude, and custom group settings.",
      expectedField: ERROR_FIELD_TOTO.ODD,
    },
    {
      input: {
        includeOddEven: true,
        odd: "5",
        even: "",
        system: 6,
      },
      mustIncludes: "1,3,5,7",
      mustExcludes:
        "11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30",
      customGroups: "9,10",
      customCount: "1",
      expectedMinOdd: 5,
      expectedMaxOdd: 5,
      expectedMinEven: 1,
      expectedMaxEven: 1,
      expectedRemainingOddCount: 1,
      expectedRemainingEvenCount: 1,
      expectedErr: "",
      expectedField: 0,
    },
    {
      input: {
        includeOddEven: true,
        odd: "",
        even: "1",
        system: 6,
      },
      mustIncludes: "1,3,5,7",
      mustExcludes:
        "9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30",
      customGroups: "",
      customCount: "",
      expectedMinOdd: 5,
      expectedMaxOdd: 5,
      expectedMinEven: 1,
      expectedMaxEven: 1,
      expectedRemainingOddCount: 1,
      expectedRemainingEvenCount: 1,
      expectedErr:
        "Your odd/even setting cannot be satisfied after applying your include and exclude settings.",
      expectedField: ERROR_FIELD_TOTO.EVEN,
    },
    {
      input: {
        includeOddEven: true,
        odd: "0-2",
        even: "",
        system: 6,
      },
      mustIncludes: "",
      mustExcludes:
        "10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30",
      customGroups: "1,3,5",
      customCount: "3",
      expectedMinOdd: 0,
      expectedMaxOdd: 2,
      expectedMinEven: 4,
      expectedMaxEven: 6,
      expectedRemainingOddCount: 0,
      expectedRemainingEvenCount: 4,
      expectedErr:
        "Your odd/even setting cannot be satisfied after applying your include, exclude, and custom group settings.",
      expectedField: ERROR_FIELD_TOTO.ODD,
    },
  ])(
    "includes: $mustIncludes, excludes: $mustExcludes, customGroups: $customGroups, customCount: $customCount, odd: $input.odd, even: $input.even",
    ({
      input,
      mustIncludes,
      mustExcludes,
      customGroups,
      customCount,
      expectedMinOdd,
      expectedMaxOdd,
      expectedMinEven,
      expectedMaxEven,
      expectedRemainingOddCount,
      expectedRemainingEvenCount,
      expectedErr,
      expectedField,
    }) => {
      const remainingPools = getTotoPoolsCopy(defaultPools);
      const { mustIncludePools, remainingCount } = validateIncludeList(
        { mustIncludes, system: input.system },
        rangeInfo,
        remainingPools
      );

      validateExcludeList(
        { mustExcludes, system: input.system },
        rangeInfo,
        remainingPools,
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
        remainingPools,
        remainingCount
      );

      const { odd, even, remainingOddCount, remainingEvenCount, err, field } =
        validateOddEven(
          input,
          remainingPools,
          mustIncludePools,
          customRes.customPools,
          customRes.customCount
        );

      expect(odd.min).toBe(expectedMinOdd);
      expect(odd.max).toBe(expectedMaxOdd);
      expect(even.min).toBe(expectedMinEven);
      expect(even.max).toBe(expectedMaxEven);
      expect(remainingOddCount).toBe(expectedRemainingOddCount);
      expect(remainingEvenCount).toBe(expectedRemainingEvenCount);
      expect(err).toBe(expectedErr);
      expect(field).toBe(expectedField);
    }
  );
});
