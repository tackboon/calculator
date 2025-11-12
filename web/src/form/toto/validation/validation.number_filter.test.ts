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
      expectedRequiredCount: 3,
      expectedAvailablePoolSize: 27,
      expectedErr: "",
      expectedField: 0,
    },
    {
      input: { mustIncludes: "", system: 6 },
      expectedSize: 0,
      expectedRequiredCount: 6,
      expectedAvailablePoolSize: 30,
      expectedErr: "",
      expectedField: 0,
    },
    {
      input: { mustIncludes: "1,2,31", system: 6 },
      expectedSize: 2,
      expectedRequiredCount: 6,
      expectedAvailablePoolSize: 28,
      expectedErr: "Please enter values between 1 and 30.",
      expectedField: ERROR_FIELD_TOTO.MUST_INCLUDES,
    },
    {
      input: { mustIncludes: "1,2,3,4,5,6,7", system: 6 },
      expectedSize: 7,
      expectedRequiredCount: 6,
      expectedAvailablePoolSize: 23,
      expectedErr: "You can only include up to 6 numbers.",
      expectedField: ERROR_FIELD_TOTO.MUST_INCLUDES,
    },
  ])(
    "includes: $input.mustIncludes",
    ({
      input,
      expectedSize,
      expectedRequiredCount,
      expectedAvailablePoolSize,
      expectedErr,
      expectedField,
    }) => {
      const availablePools = getTotoPoolsCopy(defaultPools);
      const { mustIncludePools, requiredCount, err, field } =
        validateIncludeList(input, rangeInfo, availablePools);

      expect(mustIncludePools.allPools.allPools.size).toBe(expectedSize);
      expect(requiredCount).toBe(expectedRequiredCount);
      expect(availablePools.allPools.allPools.size).toBe(
        expectedAvailablePoolSize
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
      expectedAvailablePoolSize: 27,
      expectedErr: "",
      expectedField: 0,
    },
    {
      input: { mustExcludes: "", system: 6 },
      mustIncludes: "",
      expectedAvailablePoolSize: 30,
      expectedErr: "",
      expectedField: 0,
    },
    {
      input: { mustExcludes: "1,2,3", system: 6 },
      mustIncludes: "1",
      expectedAvailablePoolSize: 29,
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
      expectedAvailablePoolSize: 5,
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
      expectedAvailablePoolSize: 4,
      expectedErr: "You can only exclude up to 24 numbers.",
      expectedField: ERROR_FIELD_TOTO.MUST_EXCLUDES,
    },
  ])(
    "includes: $mustIncludes, excludes: $input.mustExcludes",
    ({
      input,
      mustIncludes,
      expectedAvailablePoolSize,
      expectedErr,
      expectedField,
    }) => {
      const availablePools = getTotoPoolsCopy(defaultPools);
      const includeRes = validateIncludeList(
        { mustIncludes, system: input.system },
        rangeInfo,
        availablePools
      );
      const { mustIncludePools } = includeRes;

      const { err, field } = validateExcludeList(
        input,
        rangeInfo,
        availablePools,
        mustIncludePools
      );

      expect(availablePools.allPools.allPools.size).toBe(
        expectedAvailablePoolSize
      );
      expect(includeRes.err).toBe("");
      expect(err).toBe(expectedErr);
      expect(field).toBe(expectedField);
    }
  );
});
