import { ERROR_FIELD_TOTO, TOTO_RANGE } from "../toto.type";
import { getRangeInfo, getTotoPoolsCopy, initDefaultTotoPool } from "../utils";
import {
  validateExcludeList,
  validateIncludeList,
} from "./validation.number_filter";

describe("validateIncludeList", () => {
  const rangeInfo = getRangeInfo(TOTO_RANGE.THIRTY);
  const defaultPools = initDefaultTotoPool(TOTO_RANGE.THIRTY);

  it.each([
    {
      input: { mustIncludes: "1,2,3", system: 6 },
      expectedSize: 3,
      expectedRemaining: 3,
      expectedRemainingPoolSize: 27,
      expectedErr: "",
      expectedField: 0,
    },
    {
      input: { mustIncludes: "", system: 6 },
      expectedSize: 0,
      expectedRemaining: 6,
      expectedRemainingPoolSize: 30,
      expectedErr: "",
      expectedField: 0,
    },
    {
      input: { mustIncludes: "1,2,31", system: 6 },
      expectedSize: 2,
      expectedRemaining: 6,
      expectedRemainingPoolSize: 28,
      expectedErr: "Please enter values between 1 and 30.",
      expectedField: ERROR_FIELD_TOTO.MUST_INCLUDES,
    },
    {
      input: { mustIncludes: "1,2,3,4,5,6,7", system: 6 },
      expectedSize: 7,
      expectedRemaining: 6,
      expectedRemainingPoolSize: 23,
      expectedErr: "You can only include up to 6 numbers.",
      expectedField: ERROR_FIELD_TOTO.MUST_INCLUDES,
    },
  ])(
    "includes: $input.mustIncludes",
    ({
      input,
      expectedSize,
      expectedRemaining,
      expectedRemainingPoolSize,
      expectedErr,
      expectedField,
    }) => {
      const remainingPools = getTotoPoolsCopy(defaultPools);
      const { mustIncludePools, remainingCount, err, field } =
        validateIncludeList(input, rangeInfo, remainingPools);

      expect(mustIncludePools.allPools.allPools.size).toBe(expectedSize);
      expect(remainingCount).toBe(expectedRemaining);
      expect(remainingPools.allPools.allPools.size).toBe(
        expectedRemainingPoolSize
      );
      expect(err).toBe(expectedErr);
      expect(field).toBe(expectedField);
    }
  );
});

describe("validateExcludeList", () => {
  const rangeInfo = getRangeInfo(TOTO_RANGE.THIRTY);
  const defaultPools = initDefaultTotoPool(TOTO_RANGE.THIRTY);

  it.each([
    {
      input: { mustExcludes: "1,2,3", system: 6 },
      mustIncludes: "",
      expectedRemainingPoolSize: 27,
      expectedErr: "",
      expectedField: 0,
    },
    {
      input: { mustExcludes: "", system: 6 },
      mustIncludes: "",
      expectedRemainingPoolSize: 30,
      expectedErr: "",
      expectedField: 0,
    },
    {
      input: { mustExcludes: "1,2,3", system: 6 },
      mustIncludes: "1",
      expectedRemainingPoolSize: 29,
      expectedErr: "Number 1 cannot be in both include and exclude lists.",
      expectedField: ERROR_FIELD_TOTO.MUST_EXCLUDES,
    },
    {
      input: {
        mustExcludes:
          "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24",
        system: 6,
      },
      mustIncludes: "25",
      expectedRemainingPoolSize: 5,
      expectedErr: "",
      expectedField: 0,
    },
    {
      input: {
        mustExcludes:
          "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,26",
        system: 6,
      },
      mustIncludes: "25",
      expectedRemainingPoolSize: 4,
      expectedErr: "You can only exclude up to 24 numbers.",
      expectedField: ERROR_FIELD_TOTO.MUST_EXCLUDES,
    },
  ])(
    "includes: $mustIncludes, excludes: $input.mustExcludes",
    ({
      input,
      mustIncludes,
      expectedRemainingPoolSize,
      expectedErr,
      expectedField,
    }) => {
      const remainingPools = getTotoPoolsCopy(defaultPools);
      const { mustIncludePools } = validateIncludeList(
        { mustIncludes, system: input.system },
        rangeInfo,
        remainingPools
      );

      const { err, field } = validateExcludeList(
        input,
        rangeInfo,
        remainingPools,
        mustIncludePools
      );

      expect(remainingPools.allPools.allPools.size).toBe(
        expectedRemainingPoolSize
      );
      expect(err).toBe(expectedErr);
      expect(field).toBe(expectedField);
    }
  );
});
