import { ERROR_FIELD_TOTO, TOTO_RANGE } from "../toto.type";
import { getRangeInfo, getTotoPoolsCopy, initDefaultTotoPool } from "../utils";
import { validateCustomGroup } from "./validation.custom_group";
import {
  validateExcludeList,
  validateIncludeList,
} from "./validation.number_filter";

describe("validateCustomGroup", () => {
  const rangeInfo = getRangeInfo(TOTO_RANGE.THIRTY);
  const defaultPools = initDefaultTotoPool(TOTO_RANGE.THIRTY);

  it.each([
    {
      input: {
        customGroups: "1,2,3",
        customCount: "1",
        system: 6,
      },
      mustIncludes: "",
      mustExcludes: "30",
      expectedCustomPoolSize: 3,
      expectedMin: 1,
      expectedMax: 1,
      expectedErr: "",
      expectedField: 0,
    },
    {
      input: {
        customGroups: "1",
        customCount: "",
        system: 6,
      },
      mustIncludes: "1",
      mustExcludes: "",
      expectedCustomPoolSize: 0,
      expectedMin: 0,
      expectedMax: 0,
      expectedErr:
        "Number 1 in the custom group cannot be in either the include or exclude list.",
      expectedField: ERROR_FIELD_TOTO.CUSTOM_GROUPS,
    },
    {
      input: {
        customGroups: "1",
        customCount: "2-3",
        system: 6,
      },
      mustIncludes: "",
      mustExcludes: "",
      expectedCustomPoolSize: 1,
      expectedMin: 2,
      expectedMax: 3,
      expectedErr:
        "The custom number count cannot exceed the custom group numbers size.",
      expectedField: ERROR_FIELD_TOTO.CUSTOM_COUNT,
    },
    {
      input: {
        customGroups: "25,26,27,28",
        customCount: "0-1",
        system: 6,
      },
      mustIncludes: "1,2,3,4,5",
      mustExcludes: "",
      expectedCustomPoolSize: 4,
      expectedMin: 0,
      expectedMax: 1,
      expectedErr: "",
      expectedField: 0,
    },
    {
      input: {
        customGroups: "25,26,27,28",
        customCount: "2",
        system: 6,
      },
      mustIncludes: "1,2,3,4,5",
      mustExcludes: "",
      expectedCustomPoolSize: 4,
      expectedMin: 2,
      expectedMax: 2,
      expectedErr:
        "The custom number count cannot exceed the remaining available numbers.",
      expectedField: ERROR_FIELD_TOTO.CUSTOM_COUNT,
    },
    {
      input: {
        customGroups:
          "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25",
        customCount: "0-1",
        system: 6,
      },
      mustIncludes: "",
      mustExcludes: "",
      expectedCustomPoolSize: 25,
      expectedMin: 1,
      expectedMax: 1,
      expectedErr: "",
      expectedField: 0,
    },
    {
      input: {
        customGroups: "23,24,25",
        customCount: "0-6",
        system: 6,
      },
      mustIncludes: "1,2,3,4,5",
      mustExcludes: "",
      expectedCustomPoolSize: 3,
      expectedMin: 0,
      expectedMax: 1,
      expectedErr: "",
      expectedField: 0,
    },
    {
      input: {
        customGroups:
          "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25",
        customCount: "0-1",
        system: 6,
      },
      mustIncludes: "",
      mustExcludes: "26",
      expectedCustomPoolSize: 25,
      expectedMin: 0,
      expectedMax: 1,
      expectedErr:
        "Not enough remaining numbers to complete a combination with the selected custom group count.",
      expectedField: ERROR_FIELD_TOTO.CUSTOM_COUNT,
    },
    {
      input: {
        customGroups: "1",
        customCount: "",
        system: 6,
      },
      mustIncludes: "",
      mustExcludes: "",
      expectedCustomPoolSize: 1,
      expectedMin: 0,
      expectedMax: 1,
      expectedErr: "",
      expectedField: 0,
    },
  ])(
    "includes: $mustIncludes, excludes: $mustExcludes, customGroups: $input.customGroups, customCount: $input.customCount",
    ({
      input,
      mustIncludes,
      mustExcludes,
      expectedCustomPoolSize,
      expectedMin,
      expectedMax,
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

      const { customPools, customCount, err, field } = validateCustomGroup(
        input,
        rangeInfo,
        availablePools,
        requiredCount
      );

      expect(customPools.allPools.allPools.size).toBe(expectedCustomPoolSize);
      expect(customCount.min).toBe(expectedMin);
      expect(customCount.max).toBe(expectedMax);
      expect(includeRes.err).toBe("");
      expect(excludeRes.err).toBe("");
      expect(err).toBe(expectedErr);
      expect(field).toBe(expectedField);
    }
  );
});
