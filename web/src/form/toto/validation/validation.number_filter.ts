import { ERROR_FIELD_TOTO, TotoPools, TotoRangeInfo } from "../toto.type";
import { addPoolNum, deletePoolNum, initTotoPool } from "../utils";
import { validateListInput } from "./validation";

type IncludeInput = {
  mustIncludes: string;
  system: number;
};

export const validateIncludeList = (
  input: IncludeInput,
  rangeInfo: TotoRangeInfo,
  remainingPools: TotoPools
): {
  mustIncludePools: TotoPools;
  remainingCount: number;
  err: string;
  field: ERROR_FIELD_TOTO;
} => {
  const mustIncludePools = initTotoPool();
  let remainingCount = input.system;

  if (input.mustIncludes !== "") {
    // validate must includes field
    let err = validateListInput(input.mustIncludes, rangeInfo, (n) => {
      if (!mustIncludePools.allPools.allPools.has(n)) {
        addPoolNum(mustIncludePools, n, rangeInfo.low);
        deletePoolNum(remainingPools, n);
      }
      return "";
    });
    if (err !== "")
      return {
        mustIncludePools,
        remainingCount,
        err,
        field: ERROR_FIELD_TOTO.MUST_INCLUDES,
      };

    // Ensure included numbers less than system size
    if (mustIncludePools.allPools.allPools.size > input.system) {
      return {
        mustIncludePools,
        remainingCount,
        err: `You can only include up to ${input.system} numbers.`,
        field: ERROR_FIELD_TOTO.MUST_INCLUDES,
      };
    }

    // recompute remaining count
    remainingCount = input.system - mustIncludePools.allPools.allPools.size;
  }

  return { mustIncludePools, remainingCount, err: "", field: 0 };
};

type ExcludeInput = {
  mustExcludes: string;
  system: number;
};

export const validateExcludeList = (
  input: ExcludeInput,
  rangeInfo: TotoRangeInfo,
  remainingPools: TotoPools,
  mustIncludePools: TotoPools
): { err: string; field: ERROR_FIELD_TOTO } => {
  if (input.mustExcludes !== "") {
    // validate must excludes field
    const err = validateListInput(input.mustExcludes, rangeInfo, (n) => {
      if (mustIncludePools.allPools.allPools.has(n)) {
        return `Number ${n} cannot be in both include and exclude lists.`;
      }
      if (remainingPools.allPools.allPools.has(n))
        deletePoolNum(remainingPools, n);
      return "";
    });
    if (err !== "") return { err, field: ERROR_FIELD_TOTO.MUST_EXCLUDES };

    // Ensure the remaining pool is sufficient for the system size
    if (
      remainingPools.allPools.allPools.size +
        mustIncludePools.allPools.allPools.size <
      input.system
    ) {
      const maxExcludeCount = rangeInfo.count - input.system;
      return {
        err: `You can only exclude up to ${maxExcludeCount} numbers.`,
        field: ERROR_FIELD_TOTO.MUST_EXCLUDES,
      };
    }
  }

  return { err: "", field: 0 };
};
