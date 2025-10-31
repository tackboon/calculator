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
  TotoSetPools,
} from "./toto.type";

export const getRangeGroupHeight = (
  includeRangeGroup: boolean,
  rangeTyp: number
) => {
  if (!includeRangeGroup) return 0;
  if (rangeTyp === 5) return 470;
  if (rangeTyp === 6) return 570;
  return 670;
};

const extractRangeInput = (
  input: string,
  defaultMax: number
): { min: number; max: number } => {
  if (input === "") return { min: 0, max: defaultMax };

  const parts = input.split("-");
  if (parts.length === 2) {
    return { min: Number(parts[0]), max: Number(parts[1]) };
  }

  return { min: Number(parts[0]), max: Number(parts[0]) };
};

// const printTotoPoolString = (pools: TotoPools) => {
//   const entries = Object.entries(pools).map(([key, poolSet]) => {
//     const innerEntries = Object.entries(poolSet)
//       .map(([innerKey, set]) => `${innerKey}: [${[...set].join(", ")}]`)
//       .join("\n  ");
//     return `${key}:\n  ${innerEntries}`;
//   });
//   console.log(entries.join("\n\n"));
// };

const poolCache: Record<TOTO_RANGE, TotoPools> = {} as Record<
  TOTO_RANGE,
  TotoPools
>;

const initTotoSetPool = (): TotoSetPools => {
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

const initTotoPool = (): TotoPools => {
  return {
    allPools: initTotoSetPool(),
    range10Pools: initTotoSetPool(),
    range20Pools: initTotoSetPool(),
    range30Pools: initTotoSetPool(),
    range40Pools: initTotoSetPool(),
    range50Pools: initTotoSetPool(),
    range60Pools: initTotoSetPool(),
    range70Pools: initTotoSetPool(),
  };
};

const addNumberToRangeGroup = (
  pools: TotoPools,
  key: keyof TotoSetPools,
  num: number
) => {
  if (num <= 10) {
    pools.range10Pools[key].add(num);
  } else if (num <= 20) {
    pools.range20Pools[key].add(num);
  } else if (num <= 30) {
    pools.range30Pools[key].add(num);
  } else if (num <= 40) {
    pools.range40Pools[key].add(num);
  } else if (num <= 50) {
    pools.range50Pools[key].add(num);
  } else if (num <= 60) {
    pools.range60Pools[key].add(num);
  } else {
    pools.range70Pools[key].add(num);
  }
};

const addPoolNum = (pools: TotoPools, num: number, low: number) => {
  pools.allPools.allPools.add(num);
  addNumberToRangeGroup(pools, "allPools", num);

  if (num % 2 === 0) {
    pools.allPools.evenPools.add(num);
    addNumberToRangeGroup(pools, "evenPools", num);

    if (num <= low) {
      pools.allPools.evenLowPools.add(num);
      addNumberToRangeGroup(pools, "evenLowPools", num);
    } else {
      pools.allPools.evenHighPools.add(num);
      addNumberToRangeGroup(pools, "evenHighPools", num);
    }
  } else {
    pools.allPools.oddPools.add(num);
    addNumberToRangeGroup(pools, "oddPools", num);

    if (num <= low) {
      pools.allPools.oddLowPools.add(num);
      addNumberToRangeGroup(pools, "oddLowPools", num);
    } else {
      pools.allPools.oddHighPools.add(num);
      addNumberToRangeGroup(pools, "oddHighPools", num);
    }
  }

  if (num <= low) {
    pools.allPools.lowPools.add(num);
    addNumberToRangeGroup(pools, "lowPools", num);
  } else {
    pools.allPools.highPools.add(num);
    addNumberToRangeGroup(pools, "highPools", num);
  }
};

const initDefaultTotoPool = (rangeTyp: TOTO_RANGE): TotoPools => {
  if (poolCache[rangeTyp]) return poolCache[rangeTyp];

  const { min, max, low } = getRangeInfo(rangeTyp);
  const pools = initTotoPool();

  for (let i = min; i <= max; i++) {
    addPoolNum(pools, i, low);
  }

  // store in cache
  poolCache[rangeTyp] = pools;
  return pools;
};

const getTotoSetPoolCopy = (pools: TotoSetPools): TotoSetPools => {
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

const getTotoPoolsCopy = (pools: TotoPools): TotoPools => ({
  allPools: getTotoSetPoolCopy(pools.allPools),
  range10Pools: getTotoSetPoolCopy(pools.range10Pools),
  range20Pools: getTotoSetPoolCopy(pools.range20Pools),
  range30Pools: getTotoSetPoolCopy(pools.range30Pools),
  range40Pools: getTotoSetPoolCopy(pools.range40Pools),
  range50Pools: getTotoSetPoolCopy(pools.range50Pools),
  range60Pools: getTotoSetPoolCopy(pools.range60Pools),
  range70Pools: getTotoSetPoolCopy(pools.range70Pools),
});

const deletePoolSetNum = (pools: TotoSetPools, n: number) => {
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

const deletePoolNum = (pools: TotoPools, n: number) => {
  deletePoolSetNum(pools.allPools, n);
  deletePoolSetNum(pools.range10Pools, n);
  deletePoolSetNum(pools.range20Pools, n);
  deletePoolSetNum(pools.range30Pools, n);
  deletePoolSetNum(pools.range40Pools, n);
  deletePoolSetNum(pools.range50Pools, n);
  deletePoolSetNum(pools.range60Pools, n);
  deletePoolSetNum(pools.range70Pools, n);
};

export const getRangeInfo = (rangeTyp: TOTO_RANGE): TotoRangeInfo => {
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

  // Build initial pool
  const defaultPools = initDefaultTotoPool(input.numberRange);
  const pools = getTotoPoolsCopy(defaultPools);

  // Number Filter Rule
  const mustIncludePool = initTotoPool();
  if (input.includeNumberFilter) {
    // Validate must includes rule
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

      if (!mustIncludePool.allPools.allPools.has(n)) {
        addPoolNum(mustIncludePool, n, rangeInfo.low);
        deletePoolNum(pools, n);
      }
    }
    if (mustIncludePool.allPools.allPools.size > input.system) {
      return {
        err: `You can only include up to ${input.system} numbers.`,
        field: ERROR_FIELD_TOTO.MUST_INCLUDES,
      };
    }

    // validate must excludes field
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
      if (mustIncludePool.allPools.allPools.has(n)) {
        return {
          err: `Number ${n} cannot be in both include and exclude lists.`,
          field: ERROR_FIELD_TOTO.MUST_EXCLUDES,
        };
      }

      if (pools.allPools.allPools.has(n)) {
        deletePoolNum(pools, n);
      }
    }
    if (
      pools.allPools.allPools.size + mustIncludePool.allPools.allPools.size <
      input.system
    ) {
      return {
        err: `You can only exclude up to ${
          rangeInfo.count - input.system
        } numbers.`,
        field: ERROR_FIELD_TOTO.MUST_EXCLUDES,
      };
    }
  }

  // Custom Group Rule
  let minCustomCount = 0;
  let maxCustomCount = 0;
  const customPool = initTotoPool();
  if (input.includeCustomGroup) {
    // Validate custom group numbers
    const customGroupParts = input.customGroups.split(",");
    for (const val of customGroupParts) {
      if (val === "") continue;

      const n = Number(val);
      if (isNaN(n) || n < rangeInfo.min || n > rangeInfo.max) {
        return {
          err: `Please enter values between ${rangeInfo.min} and ${rangeInfo.max}.`,
          field: ERROR_FIELD_TOTO.CUSTOM_GROUPS,
        };
      }

      if (!pools.allPools.allPools.has(n)) {
        return {
          err: `Number ${n} in the custom group cannot be in either the include or exclude list.`,
          field: ERROR_FIELD_TOTO.CUSTOM_GROUPS,
        };
      }

      if (!customPool.allPools.allPools.has(n)) {
        addPoolNum(customPool, n, rangeInfo.low);
      }
    }

    // Validate custom number count
    const customCount = extractRangeInput(input.customCount, input.system);
    if (
      isNaN(customCount.min) ||
      isNaN(customCount.max) ||
      customCount.min < 0 ||
      customCount.max < customCount.min
    ) {
      return {
        err: `Please enter a valid custom number count.`,
        field: ERROR_FIELD_TOTO.CUSTOM_COUNT,
      };
    }
    if (customCount.min > customPool.allPools.allPools.size) {
      return {
        err: `The minimum count cannot exceed the number of selected group numbers.`,
        field: ERROR_FIELD_TOTO.CUSTOM_COUNT,
      };
    }
    if (
      customCount.min > input.system - mustIncludePool.allPools.allPools.size ||
      customCount.min > pools.allPools.allPools.size
    ) {
      return {
        err: `The minimum count cannot exceed the remaining available numbers or your system size limit.`,
        field: ERROR_FIELD_TOTO.CUSTOM_COUNT,
      };
    }

    minCustomCount = customCount.min;
    maxCustomCount = customCount.max;
  }

  // Odd/Even Rule
  let minOddCount = 0;
  let minEvenCount = 0;
  if (input.includeOddEven) {
    const odd = extractRangeInput(input.odd, input.system);
    if (isNaN(odd.min) || isNaN(odd.max) || odd.min > input.system) {
      return {
        err: `Please enter a valid odd value`,
        field: ERROR_FIELD_TOTO.ODD,
      };
    }

    const even = extractRangeInput(input.even, input.system);
    if (isNaN(even.min) || isNaN(even.max) || even.min > input.system) {
      return {
        err: `Please enter a valid even value`,
        field: ERROR_FIELD_TOTO.EVEN,
      };
    }

    if (
      odd.min + even.min > input.system ||
      (input.even !== "" && input.system - even.max > odd.min) ||
      (input.odd !== "" && input.system - odd.max > even.min)
    ) {
      return {
        err: "Please enter a valid odd/even distribution that less than or equal to your system size.",
        field: ERROR_FIELD_TOTO.ODD,
      };
    }

    minOddCount = Math.min(odd.min, Math.max(input.system - even.max, 0));
    if (minOddCount < mustIncludePool.allPools.oddPools.size) {
      return {
        err: "Your odd/even setting conflicts with the numbers you've included.",
        field: ERROR_FIELD_TOTO.ODD,
      };
    }

    minEvenCount = Math.min(even.min, Math.max(input.system - odd.max, 0));
    if (minEvenCount < mustIncludePool.allPools.evenPools.size) {
      return {
        err: "Your odd/even setting conflicts with the numbers you've included.",
        field: ERROR_FIELD_TOTO.EVEN,
      };
    }

    const remainingOddCount =
      minOddCount - mustIncludePool.allPools.oddPools.size;
    if (remainingOddCount > pools.allPools.oddPools.size) {
      return {
        err: "Your odd/even setting cannot be satisfied after applying your include and exclude settings.",
        field: ERROR_FIELD_TOTO.ODD,
      };
    }

    const remainingEvenCount =
      minEvenCount - mustIncludePool.allPools.evenPools.size;
    if (remainingEvenCount > pools.allPools.evenPools.size) {
      return {
        err: "Your odd/even setting cannot be satisfied after applying your include and exclude settings.",
        field: ERROR_FIELD_TOTO.EVEN,
      };
    }

    if (input.includeCustomGroup) {
      if (minCustomCount > 0) {
        const forcedOddCount = Math.max(
          0,
          minCustomCount - customPool.allPools.evenPools.size
        );
        if (remainingOddCount < forcedOddCount) {
          return {
            err: "Your odd/even setting cannot be satisfied after applying your include, exclude, and custom group settings.",
            field: ERROR_FIELD_TOTO.ODD,
          };
        }

        const forcedEvenCount = Math.max(
          0,
          minCustomCount - customPool.allPools.oddPools.size
        );
        if (remainingEvenCount < forcedEvenCount) {
          return {
            err: "Your odd/even setting cannot be satisfied after applying your include, exclude, and custom group settings.",
            field: ERROR_FIELD_TOTO.EVEN,
          };
        }
      }

      if (maxCustomCount < input.system) {
        const noCustomOddCount =
          pools.allPools.oddPools.size - customPool.allPools.oddPools.size;
        const maxCustomOddCount = Math.min(
          maxCustomCount,
          customPool.allPools.oddPools.size
        );
        if (noCustomOddCount + maxCustomOddCount < minOddCount) {
          return {
            err: "Your odd/even setting cannot be satisfied after applying your include, exclude, and custom group settings.",
            field: ERROR_FIELD_TOTO.ODD,
          };
        }

        const noCustomEvenCount =
          pools.allPools.evenPools.size - customPool.allPools.evenPools.size;
        const maxCustomEvenCount = Math.min(
          maxCustomCount,
          customPool.allPools.evenPools.size
        );
        if (noCustomEvenCount + maxCustomEvenCount < minEvenCount) {
          return {
            err: "Your odd/even setting cannot be satisfied after applying your include, exclude, and custom group settings.",
            field: ERROR_FIELD_TOTO.EVEN,
          };
        }
      }
    }
  }

  // Low/High Rule
  let minLowCount = 0;
  let minHighCount = 0;
  if (input.includeLowHigh) {
    const low = extractRangeInput(input.low, input.system);
    if (isNaN(low.min) || isNaN(low.max) || low.min > input.system) {
      return {
        err: `Please enter a valid low value`,
        field: ERROR_FIELD_TOTO.LOW,
      };
    }

    const high = extractRangeInput(input.high, input.system);
    if (isNaN(high.min) || isNaN(high.max) || high.min > input.system) {
      return {
        err: `Please enter a valid high value`,
        field: ERROR_FIELD_TOTO.HIGH,
      };
    }

    if (
      low.min + high.min > input.system ||
      (input.high !== "" && input.system - high.max > low.min) ||
      (input.low !== "" && input.system - low.max > high.min)
    ) {
      return {
        err: "Please enter a valid low/high distribution that less than or equal to your system size.",
        field: ERROR_FIELD_TOTO.LOW,
      };
    }

    minLowCount = Math.min(low.min, Math.max(input.system - high.max, 0));
    if (minLowCount < mustIncludePool.allPools.lowPools.size) {
      return {
        err: "Your low/high setting conflicts with the numbers you've included.",
        field: ERROR_FIELD_TOTO.LOW,
      };
    }

    minHighCount = Math.min(high.min, Math.max(input.system - low.max, 0));
    if (minHighCount < mustIncludePool.allPools.highPools.size) {
      return {
        err: "Your low/high setting conflicts with the numbers you've included.",
        field: ERROR_FIELD_TOTO.HIGH,
      };
    }

    const remainingLowCount =
      minLowCount - mustIncludePool.allPools.lowPools.size;

    if (remainingLowCount > pools.allPools.lowPools.size) {
      return {
        err: "Your low/high setting cannot be satisfied after applying your include and exclude settings.",
        field: ERROR_FIELD_TOTO.LOW,
      };
    }

    const remainingHighCount =
      minHighCount - mustIncludePool.allPools.highPools.size;
    if (remainingHighCount > pools.allPools.highPools.size) {
      return {
        err: "Your low/high setting cannot be satisfied after applying your include and exclude settings.",
        field: ERROR_FIELD_TOTO.HIGH,
      };
    }

    if (input.includeLowHigh) {
    }
    if (customCount > 0) {
      // if minimum low/high count exists in custom group
      const forcedLowCount = Math.max(0, customCount - customPoolHighCount);
      const forcedHighCount = Math.max(0, customCount - customPoolLowCount);
      if (
        remainingLowCount < forcedLowCount ||
        remainingHighCount < forcedHighCount
      ) {
        return {
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, and custom group settings.",
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
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, custom group, and odd/even settings.",
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

export const generateCombinations = (
  input: TotoInputType
): TotoCombination[] => {
  // Read params
  const count = Number(input.count);
  const rangeInfo = getRangeInfo(input.numberRange);

  // Build initial pool
  const defaultPools = initDefaultTotoPool(input.numberRange);
  const pools = getTotoPoolsCopy(defaultPools);
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

  // Read custom groups
  const customCount = Number(input.customCount);
  const customPool = initTotoPool();
  if (customCount > 0) {
    const customGroupParts = input.customGroups.split(",");
    for (const val of customGroupParts) {
      if (val === "") {
        continue;
      }
      const n = Number(val);
      customPool.allPools.add(n);

      if (n % 2 === 0) {
        customPool.evenPools.add(n);

        if (n <= rangeInfo.low) {
          customPool.evenLowPools.add(n);
        } else {
          customPool.evenHighPools.add(n);
        }
      } else {
        customPool.oddPools.add(n);

        if (n <= rangeInfo.low) {
          customPool.oddLowPools.add(n);
        } else {
          customPool.oddHighPools.add(n);
        }
      }

      if (n <= rangeInfo.low) customPool.lowPools.add(n);
      else customPool.highPools.add(n);
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
    const customPoolCopy = getTotoPoolCopy(customPool);

    const combination = generateCombination(
      poolsCopy,
      selectedPoolCopy,
      customPoolCopy,
      customCount,
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
  customPool: TotoPools,
  customCount: number,
  includeOddEven: boolean,
  odd: number,
  even: number,
  includeLowHigh: boolean,
  low: number,
  high: number,
  rangeLow: number,
  system: number
): Set<number> => {
  const remainingSlot = system - selectedPool.allPools.size;
  const initialCustomSize = customPool.allPools.size;

  for (let i = 0; i < remainingSlot; i++) {
    let n: number | undefined;
    const remainingCustomCount =
      customCount - (initialCustomSize - customPool.allPools.size);

    n =
      remainingCustomCount > 0
        ? randomNumber(
            customPool,
            selectedPool,
            includeOddEven,
            odd,
            even,
            includeLowHigh,
            low,
            high
          )
        : randomNumber(
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
      deletePoolNum(customPool, n);
    } else {
      console.error("Failed to random on empty set.", i);
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
  if (includeOddEven) {
    const remainingOddCount = Math.max(0, odd - selectedPool.oddPools.size);
    const remainingEvenCount = Math.max(0, even - selectedPool.evenPools.size);

    if (remainingOddCount !== remainingEvenCount) {
      if (remainingEvenCount === 0 || remainingOddCount === 1) {
        oddEvenRule = "odd";
      } else if (remainingOddCount === 0 || remainingEvenCount === 1) {
        oddEvenRule = "even";
      }
    }
  }

  let lowHighRule = "both";
  if (includeLowHigh) {
    const remainingLowCount = Math.max(0, low - selectedPool.lowPools.size);
    const remainingHighCount = Math.max(0, high - selectedPool.highPools.size);

    if (remainingLowCount !== remainingHighCount) {
      if (remainingHighCount === 0 || remainingLowCount === 1) {
        lowHighRule = "low";
      } else if (remainingLowCount === 0 || remainingHighCount === 1) {
        lowHighRule = "high";
      }
    }
  }

  let n: number | undefined;
  if (oddEvenRule === "both" && lowHighRule === "both") {
    n = randomFromSet(pools.allPools);
  } else {
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
    const name = `${i}-${i + 9}`;
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
