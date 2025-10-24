import { randomFromSet } from "../../common/random/random";
import { checkMinMax } from "../../common/validation/calculator.validation";
import {
  ERROR_FIELD_TOTO,
  TOTO_RANGE,
  TotoCombination,
  TotoInputType,
  TotoOutputGroup,
  TotoPools,
  TotoRangeInfo,
} from "./toto.type";

const poolCache: Record<TOTO_RANGE, TotoPools> = {} as Record<
  TOTO_RANGE,
  TotoPools
>;

const initTotoPool = (): TotoPools => {
  return {
    allPools: new Set<number>(),
    oddPools: new Set<number>(),
    evenPools: new Set<number>(),
    lowPools: new Set<number>(),
    highPools: new Set<number>(),
    oddLowPools: new Set<number>(),
    oddHighPools: new Set<number>(),
    evenLowPools: new Set<number>(),
    evenHighPools: new Set<number>(),
  };
};

const printTotoPoolString = (pools: TotoPools) => {
  const entries = Object.entries(pools).map(
    ([key, set]) => `${key}: [${[...set].join(", ")}]`
  );
  console.log(entries.join("\n"));
};

const initDefaultTotoPool = (rangeTyp: TOTO_RANGE): TotoPools => {
  if (poolCache[rangeTyp]) return poolCache[rangeTyp];

  const { min, max, low } = getRangeInfo(rangeTyp);
  const pools = initTotoPool();

  for (let i = min; i <= max; i++) {
    pools.allPools.add(i);

    if (i % 2 === 0) {
      pools.evenPools.add(i);
      if (i <= low) {
        pools.evenLowPools.add(i);
      } else {
        pools.evenHighPools.add(i);
      }
    } else {
      pools.oddPools.add(i);
      if (i <= low) {
        pools.oddLowPools.add(i);
      } else {
        pools.oddHighPools.add(i);
      }
    }

    if (i <= low) pools.lowPools.add(i);
    else pools.highPools.add(i);
  }

  // store in cache
  poolCache[rangeTyp] = pools;
  return pools;
};

const getTotoPoolCopy = (pools: TotoPools): TotoPools => {
  const {
    allPools,
    oddPools,
    evenPools,
    lowPools,
    highPools,
    oddLowPools,
    oddHighPools,
    evenLowPools,
    evenHighPools,
  } = pools;

  return {
    allPools: new Set(allPools),
    oddPools: new Set(oddPools),
    evenPools: new Set(evenPools),
    lowPools: new Set(lowPools),
    highPools: new Set(highPools),
    oddLowPools: new Set(oddLowPools),
    oddHighPools: new Set(oddHighPools),
    evenLowPools: new Set(evenLowPools),
    evenHighPools: new Set(evenHighPools),
  };
};

const getRangeInfo = (rangeTyp: TOTO_RANGE): TotoRangeInfo => {
  switch (rangeTyp) {
    case TOTO_RANGE.FOURTY_NINE:
      return {
        min: 1,
        max: 49,
        odd: 25,
        even: 24,
        count: 49,
        low: 24,
        group: 5,
      };
    case TOTO_RANGE.FIFTY:
      return {
        min: 1,
        max: 50,
        odd: 25,
        even: 25,
        count: 50,
        low: 25,
        group: 5,
      };
    case TOTO_RANGE.FIFTY_FIVE:
      return {
        min: 1,
        max: 55,
        odd: 28,
        even: 27,
        count: 55,
        low: 27,
        group: 6,
      };
    case TOTO_RANGE.FIFTY_EIGHT:
      return {
        min: 1,
        max: 58,
        odd: 29,
        even: 29,
        count: 58,
        low: 29,
        group: 6,
      };
    case TOTO_RANGE.SIXTY_NINE:
      return {
        min: 1,
        max: 69,
        odd: 35,
        even: 34,
        count: 69,
        low: 34,
        group: 7,
      };
  }
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

  const rangeInfo = getRangeInfo(input.numberRange);
  let avaiPoolSize = rangeInfo.count;

  // validate must includes field
  let mustIncludesOddCount = 0;
  let mustIncludesEvenCount = 0;
  let mustIncludesLowCount = 0;
  let mustIncludesHighCount = 0;
  let avaiOddCount = rangeInfo.odd;
  let avaiEvenCount = rangeInfo.even;
  let avaiLowCount = rangeInfo.low - rangeInfo.min + 1;
  let avaiHighCount = rangeInfo.count - rangeInfo.low;
  const mustIncludes = new Set<number>();
  const mustIncludeParts = input.mustIncludes.split(",");
  for (const val of mustIncludeParts) {
    if (val === "") {
      continue;
    }

    const n = Number(val);
    if (isNaN(n) || n < rangeInfo.min || n > rangeInfo.max) {
      return {
        err: `Please enter values between ${rangeInfo.min} and ${rangeInfo.max}.`,
        field: ERROR_FIELD_TOTO.MUST_INCLUDES,
      };
    }

    if (!mustIncludes.has(n)) {
      mustIncludes.add(n);

      if (n % 2 !== 0) {
        mustIncludesOddCount++;
        avaiOddCount--;
      } else {
        mustIncludesEvenCount++;
        avaiEvenCount--;
      }

      if (n <= rangeInfo.low) {
        mustIncludesLowCount++;
        avaiLowCount--;
      } else {
        mustIncludesHighCount++;
        avaiHighCount--;
      }
    }
  }
  if (mustIncludes.size > input.system) {
    return {
      err: `You can only include up to ${input.system} numbers.`,
      field: ERROR_FIELD_TOTO.MUST_INCLUDES,
    };
  }
  avaiPoolSize = avaiPoolSize - mustIncludes.size;

  // validate must excludes field
  const mustExcludes = new Set<number>();
  const mustExcludeParts = input.mustExcludes.split(",");
  for (const val of mustExcludeParts) {
    if (val === "") {
      continue;
    }

    const n = Number(val);
    if (isNaN(n) || n < rangeInfo.min || n > rangeInfo.max) {
      return {
        err: `Each number must be between ${rangeInfo.min} and ${rangeInfo.max}.`,
        field: ERROR_FIELD_TOTO.MUST_EXCLUDES,
      };
    }
    if (mustIncludes.has(n)) {
      return {
        err: `Number ${n} cannot be in both include and exclude lists.`,
        field: ERROR_FIELD_TOTO.MUST_EXCLUDES,
      };
    }

    if (!mustExcludes.has(n)) {
      mustExcludes.add(n);

      if (n % 2 !== 0) {
        avaiOddCount--;
      } else {
        avaiEvenCount--;
      }

      if (n <= rangeInfo.low) {
        avaiLowCount--;
      } else {
        avaiHighCount--;
      }
    }
  }
  const maxExclude = rangeInfo.count - input.system;
  if (mustExcludes.size > maxExclude) {
    return {
      err: `You can only exclude up to ${maxExclude} numbers.`,
      field: ERROR_FIELD_TOTO.MUST_EXCLUDES,
    };
  }
  avaiPoolSize = avaiPoolSize - mustExcludes.size;

  // validate conditional group
  let conditionalPoolLowCount = 0;
  let conditionalPoolHighCount = 0;
  const conditionalGroups = new Set<number>();
  const conditionalPoolOdd = new Set<number>();
  const conditionalPoolEven = new Set<number>();
  const conditionalGroupParts = input.conditionalGroups.split(",");
  for (const val of conditionalGroupParts) {
    if (val === "") continue;

    const n = Number(val);
    if (isNaN(n) || n < rangeInfo.min || n > rangeInfo.max) {
      return {
        err: `Please enter values between ${rangeInfo.min} and ${rangeInfo.max}.`,
        field: ERROR_FIELD_TOTO.CONDITIONAL_GROUPS,
      };
    }

    if (mustIncludes.has(n) || mustExcludes.has(n)) {
      return {
        err: `Number ${n} in the conditional group cannot be in either the include or exclude list.`,
        field: ERROR_FIELD_TOTO.CONDITIONAL_GROUPS,
      };
    }

    if (!conditionalGroups.has(n)) {
      conditionalGroups.add(n);

      if (n % 2 !== 0) {
        conditionalPoolOdd.add(n);
      } else {
        conditionalPoolEven.add(n);
      }

      if (n <= rangeInfo.low) {
        conditionalPoolLowCount++;
      } else {
        conditionalPoolHighCount++;
      }
    }
  }

  // validate conditional count
  const conditionalCount = Number(input.conditionalCount);
  if (isNaN(conditionalCount) || conditionalCount < 0) {
    return {
      err: `Please enter a valid minimum count.`,
      field: ERROR_FIELD_TOTO.CONDITIONAL_COUNT,
    };
  }
  if (conditionalCount > conditionalGroups.size) {
    return {
      err: `The minimum count cannot exceed the number of selected group numbers.`,
      field: ERROR_FIELD_TOTO.CONDITIONAL_COUNT,
    };
  }
  if (
    conditionalCount > input.system - mustIncludes.size ||
    conditionalCount > avaiPoolSize
  ) {
    return {
      err: `The minimum count cannot exceed the remaining available numbers or your system size limit.`,
      field: ERROR_FIELD_TOTO.CONDITIONAL_COUNT,
    };
  }

  // validate odd/even
  let forcedOddLowCount = 0;
  let forcedOddHighCount = 0;
  let forcedEvenLowCount = 0;
  let forcedEvenHighCount = 0;
  if (input.oddEven !== "") {
    const oddEvenParts = input.oddEven.split("/");
    if (oddEvenParts.length !== 2) {
      return {
        err: `Please enter a valid odd/even value`,
        field: ERROR_FIELD_TOTO.ODD_EVEN,
      };
    }
    const odd = Number(oddEvenParts[0]);
    const even = Number(oddEvenParts[1]);
    if (isNaN(odd) || isNaN(even) || odd + even !== input.system) {
      return {
        err: "Please enter a valid odd/even distribution format that equal your system size.",
        field: ERROR_FIELD_TOTO.ODD_EVEN,
      };
    }
    if (odd < mustIncludesOddCount || even < mustIncludesEvenCount) {
      return {
        err: "Your odd/even setting conflicts with the numbers you've included.",
        field: ERROR_FIELD_TOTO.ODD_EVEN,
      };
    }

    const remainingOddCount = odd - mustIncludesOddCount;
    const remainingEvenCount = even - mustIncludesEvenCount;
    if (
      remainingOddCount > avaiOddCount ||
      remainingEvenCount > avaiEvenCount
    ) {
      return {
        err: "Your odd/even setting cannot be satisfied after applying your include and exclude settings.",
        field: ERROR_FIELD_TOTO.ODD_EVEN,
      };
    }

    if (conditionalCount > 0) {
      // if minimum odd/even count exists in conditional group
      const forcedOddCount = Math.max(
        0,
        conditionalCount - conditionalPoolEven.size
      );
      const forcedEvenCount = Math.max(
        0,
        conditionalCount - conditionalPoolOdd.size
      );
      if (
        remainingOddCount < forcedOddCount ||
        remainingEvenCount < forcedEvenCount
      ) {
        return {
          err: "Your odd/even setting cannot be satisfied after applying your include, exclude, and conditional group settings.",
          field: ERROR_FIELD_TOTO.ODD_EVEN,
        };
      }

      if (forcedOddCount > 0) {
        for (const oddNum of conditionalPoolOdd) {
          if (oddNum <= rangeInfo.low) {
            forcedOddLowCount++;
          } else {
            forcedOddHighCount++;
          }
        }
      }

      if (forcedEvenCount > 0) {
        for (const evenNum of conditionalPoolEven) {
          if (evenNum <= rangeInfo.low) {
            forcedEvenLowCount++;
          } else {
            forcedEvenHighCount++;
          }
        }
      }
    }
  }

  // validate low/high
  if (input.lowHigh !== "") {
    const lowHighParts = input.lowHigh.split("/");
    if (lowHighParts.length !== 2) {
      return {
        err: `Please enter a valid low/high value`,
        field: ERROR_FIELD_TOTO.LOW_HIGH,
      };
    }
    const low = Number(lowHighParts[0]);
    const high = Number(lowHighParts[1]);
    if (isNaN(low) || isNaN(high) || low + high !== input.system) {
      return {
        err: "Please enter a valid low/high distribution format that equal your system size.",
        field: ERROR_FIELD_TOTO.LOW_HIGH,
      };
    }
    if (low < mustIncludesLowCount || high < mustIncludesHighCount) {
      return {
        err: "Your low/high setting conflicts with the numbers you've included.",
        field: ERROR_FIELD_TOTO.LOW_HIGH,
      };
    }

    const remainingLowCount = low - mustIncludesLowCount;
    const remainingHighCount = high - mustIncludesHighCount;
    if (
      remainingLowCount > avaiLowCount ||
      remainingHighCount > avaiHighCount
    ) {
      return {
        err: "Your low/high setting cannot be satisfied after applying your include and exclude settings.",
        field: ERROR_FIELD_TOTO.LOW_HIGH,
      };
    }

    if (conditionalCount > 0) {
      // if minimum low/high count exists in conditional group
      const forcedLowCount = Math.max(
        0,
        conditionalCount - conditionalPoolHighCount
      );
      const forcedHighCount = Math.max(
        0,
        conditionalCount - conditionalPoolLowCount
      );
      if (
        remainingLowCount < forcedLowCount ||
        remainingHighCount < forcedHighCount
      ) {
        return {
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, and conditional group settings.",
          field: ERROR_FIELD_TOTO.LOW_HIGH,
        };
      }

      if (
        forcedOddLowCount > remainingLowCount ||
        forcedEvenLowCount > remainingLowCount ||
        forcedOddHighCount > remainingHighCount ||
        forcedEvenHighCount > remainingHighCount
      ) {
        return {
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, conditional group, and odd/even settings.",
          field: ERROR_FIELD_TOTO.LOW_HIGH,
        };
      }
    }
  }

  return { err: "", field: null };
};

const updateSelectPool = (n: number, selectedPool: TotoPools, low: number) => {
  selectedPool.allPools.add(n);

  if (n % 2 === 0) selectedPool.evenPools.add(n);
  else selectedPool.oddPools.add(n);

  if (n <= low) selectedPool.lowPools.add(n);
  else selectedPool.highPools.add(n);
};

const deletePoolNum = (pools: TotoPools, n: number) => {
  pools.allPools.delete(n);
  pools.oddPools.delete(n);
  pools.evenPools.delete(n);
  pools.lowPools.delete(n);
  pools.highPools.delete(n);
  pools.oddLowPools.delete(n);
  pools.oddHighPools.delete(n);
  pools.evenLowPools.delete(n);
  pools.evenHighPools.delete(n);
};

export const generateCombinations = (
  input: TotoInputType
): TotoCombination[] => {
  // Read params
  const count = Number(input.count);
  const rangeInfo = getRangeInfo(input.numberRange);

  // Build initial pool
  const defaultPools = initDefaultTotoPool(input.numberRange);
  const pools = getTotoPoolCopy(defaultPools);
  const selectedPool = initTotoPool();

  // Init output
  const combinationSet = new Set<string>();
  const combinations: TotoCombination[] = [];

  // Read must includes
  const mustIncludeParts = input.mustIncludes.split(",");
  for (const val of mustIncludeParts) {
    if (val === "") {
      continue;
    }
    const n = Number(val);
    updateSelectPool(n, selectedPool, rangeInfo.low);
    deletePoolNum(pools, n);
  }

  if (selectedPool.allPools.size === input.system) {
    const combinationStr = setToString(selectedPool.allPools, " ");
    const out = analyseData(selectedPool.allPools, combinationStr, rangeInfo);
    combinations.push(out);

    return combinations;
  }

  // Read must excludes
  const mustExcludeParts = input.mustExcludes.split(",");
  for (const val of mustExcludeParts) {
    if (val === "") {
      continue;
    }
    const n = Number(val);
    deletePoolNum(pools, n);
  }

  // Read conditional groups
  const conditionalCount = Number(input.conditionalCount);
  const conditionalPool = initTotoPool();
  if (conditionalCount > 0) {
    const conditionalGroupParts = input.conditionalGroups.split(",");
    for (const val of conditionalGroupParts) {
      if (val === "") {
        continue;
      }
      const n = Number(val);
      conditionalPool.allPools.add(n);

      if (n % 2 === 0) conditionalPool.evenPools.add(n);
      else conditionalPool.oddPools.add(n);

      if (n <= rangeInfo.low) conditionalPool.lowPools.add(n);
      else conditionalPool.highPools.add(n);
    }
  }

  // Read odd/even
  let odd = 0;
  let even = 0;
  const includeOddEven = input.oddEven !== "";
  const oddEvenParts = input.oddEven.split("/");
  if (oddEvenParts.length === 2) {
    odd = Number(oddEvenParts[0]);
    even = Number(oddEvenParts[1]);
  }

  // Read low/high
  let low = 0;
  let high = 0;
  const includeLowHigh = input.lowHigh !== "";
  const lowHighParts = input.lowHigh.split("/");
  if (lowHighParts.length === 2) {
    low = Number(lowHighParts[0]);
    high = Number(lowHighParts[1]);
  }

  let k = 0;
  while (combinations.length < count && k < 1000) {
    const poolsCopy = getTotoPoolCopy(pools);
    const selectedPoolCopy = getTotoPoolCopy(selectedPool);
    const conditionalPoolCopy = getTotoPoolCopy(conditionalPool);

    const combination = generateCombination(
      poolsCopy,
      selectedPoolCopy,
      conditionalPoolCopy,
      conditionalCount,
      includeOddEven,
      odd,
      even,
      includeLowHigh,
      low,
      high,
      rangeInfo.low,
      input.system
    );

    const combinationStr = setToString(combination, " ");
    if (!combinationSet.has(combinationStr)) {
      const out = analyseData(combination, combinationStr, rangeInfo);
      combinations.push(out);
      combinationSet.add(combinationStr);
    }

    k++;
  }

  return combinations;
};

const generateCombination = (
  pools: TotoPools,
  selectedPool: TotoPools,
  conditionalPool: TotoPools,
  conditionalCount: number,
  includeOddEven: boolean,
  odd: number,
  even: number,
  includeLowHigh: boolean,
  low: number,
  high: number,
  rangeLow: number,
  system: number
): Set<number> => {
  // Handle conditional group logic
  if (conditionalCount > 0) {
    for (let i = 0; i < conditionalCount; i++) {
      const n = randomNumber(
        conditionalPool,
        selectedPool,
        includeOddEven,
        odd,
        even,
        includeLowHigh,
        low,
        high
      );
      if (n !== undefined) {
        deletePoolNum(conditionalPool, n);
        updateSelectPool(n, selectedPool, rangeLow);
        deletePoolNum(pools, n);
      } else {
        console.error(`Failed to random on empty set. Conditional: ${i}`);
      }
    }
  }

  if (selectedPool.allPools.size === system) {
    return selectedPool.allPools;
  }

  // Fill up remaining slot
  const remainingSlot = system - selectedPool.allPools.size;
  for (let i = 0; i < remainingSlot; i++) {
    const n = randomNumber(
      pools,
      selectedPool,
      includeOddEven,
      odd,
      even,
      includeLowHigh,
      low,
      high
    );
    if (n !== undefined) {
      updateSelectPool(n, selectedPool, rangeLow);
      deletePoolNum(pools, n);
    } else {
      console.error("Failed to random on empty set. All: 3");
    }
  }

  return selectedPool.allPools;
};

const randomNumber = (
  pools: TotoPools,
  selectedPool: TotoPools,
  includeOddEven: boolean,
  odd: number,
  even: number,
  includeLowHigh: boolean,
  low: number,
  high: number
) => {
  let oddEvenRule = "both";
  let requiredOddEvenCount = 999;
  if (includeOddEven) {
    const remainingOddCount = odd - selectedPool.oddPools.size;
    const remainingEvenCount = even - selectedPool.evenPools.size;

    if (remainingOddCount === remainingEvenCount) {
      requiredOddEvenCount = remainingOddCount;
    } else if (
      remainingEvenCount === 0 ||
      (remainingOddCount > 0 && remainingOddCount < remainingEvenCount)
    ) {
      oddEvenRule = "odd";
      requiredOddEvenCount = remainingOddCount;
    } else {
      oddEvenRule = "even";
      requiredOddEvenCount = remainingEvenCount;
    }
  }

  let lowHighRule = "both";
  let requiredLowHighCount = 999;
  if (includeLowHigh) {
    const remainingLowCount = low - selectedPool.lowPools.size;
    const remainingHighCount = high - selectedPool.highPools.size;

    if (remainingLowCount === remainingHighCount) {
      requiredLowHighCount = remainingLowCount;
    } else if (
      remainingHighCount === 0 ||
      (remainingLowCount > 0 && remainingLowCount < remainingHighCount)
    ) {
      lowHighRule = "low";
      requiredLowHighCount = remainingLowCount;
    } else {
      lowHighRule = "high";
      requiredLowHighCount = remainingHighCount;
    }
  }

  let n: number | undefined;
  if (oddEvenRule === "both" && lowHighRule === "both") {
    n = randomFromSet(pools.allPools);
  } else if (requiredOddEvenCount === requiredLowHighCount) {
    if (oddEvenRule === "both") {
      if (lowHighRule === "low") {
        n = randomFromSet(pools.lowPools);
      } else {
        n = randomFromSet(pools.highPools);
      }
    } else if (oddEvenRule === "odd") {
      if (lowHighRule === "both") {
        n = randomFromSet(pools.oddPools);
      } else if (lowHighRule === "low") {
        n = randomFromSet(pools.oddLowPools);
      } else {
        n = randomFromSet(pools.oddHighPools);
      }
    } else {
      if (lowHighRule === "both") {
        n = randomFromSet(pools.evenPools);
      } else if (lowHighRule === "low") {
        n = randomFromSet(pools.evenLowPools);
      } else {
        n = randomFromSet(pools.evenHighPools);
      }
    }
  } else if (requiredOddEvenCount < requiredLowHighCount) {
    if (oddEvenRule === "both") {
      if (lowHighRule === "low") {
        n = randomFromSet(pools.lowPools);
      } else {
        n = randomFromSet(pools.highPools);
      }
    } else if (oddEvenRule === "odd") {
      n = randomFromSet(pools.oddPools);
    } else {
      n = randomFromSet(pools.evenPools);
    }
  } else {
    if (lowHighRule === "both") {
      if (oddEvenRule === "odd") {
        n = randomFromSet(pools.oddPools);
      } else {
        n = randomFromSet(pools.evenPools);
      }
    } else if (lowHighRule === "low") {
      n = randomFromSet(pools.lowPools);
    } else {
      n = randomFromSet(pools.highPools);
    }
  }

  return n;
};

const setToString = (set: Set<number>, separator: string) => {
  return Array.from(set)
    .sort((a, b) => a - b)
    .join(separator);
};

const analyseData = (
  combination: Set<number>,
  combinationStr: string,
  rangeInfo: TotoRangeInfo
): TotoCombination => {
  const outputGroups: TotoOutputGroup[] = [];
  for (let i = 1; i <= rangeInfo.group * 10; i += 10) {
    const name = `${i}-${i + 10}`;
    const outputGroup: TotoOutputGroup = {
      name,
      count: 0,
    };
    outputGroups.push(outputGroup);
  }

  let sum = 0;
  let average = 0;
  let oddCount = 0;
  let evenCount = 0;
  let lowCount = 0;
  let highCount = 0;
  for (const n of combination) {
    sum += n;

    if (n % 2 === 0) evenCount++;
    else oddCount++;

    if (n <= rangeInfo.low) lowCount++;
    else highCount++;

    const divide = Math.floor(n / 10);
    const remainder = n % 10;

    let group = 0;
    if (divide > 0) {
      group = remainder > 0 ? divide : divide - 1;
    }

    outputGroups[group].count++;
  }

  if (combination.size > 0) {
    average = Math.round(sum / combination.size);
  }

  return {
    combination: combinationStr,
    oddEven: `${oddCount}/${evenCount}`,
    lowHigh: `${lowCount}/${highCount}`,
    sum,
    average,
    outputGroups,
  };
};
