import { randomFromSet } from "../../common/random/random";
import {
  RangeValue,
  TOTO_RANGE,
  TotoCombination,
  TotoInputType,
  TotoOutputGroup,
  TotoPoolKeys,
  TotoPools,
  TotoRangeInfo,
  TotoRangeInputKeys,
  TotoSetPools,
} from "./toto.type";
import { createWorker } from "./worker_factory";

export const getRangeGroupHeight = (
  includeRangeGroup: boolean,
  rangeTyp: number
) => {
  if (!includeRangeGroup) return 0;
  if (rangeTyp === 5) return 476;
  if (rangeTyp === 6) return 576;
  return 676;
};

export const extractRangeInput = (
  input: string,
  defaultMax: number
): { value: RangeValue; isValid: boolean } => {
  const excludes: number[] = [];
  const value = { min: 0, max: defaultMax, excludes };

  if (input === "") return { value, isValid: true };

  let rangeCount = 0;
  const commaParts = input.split(",");
  for (const part of commaParts) {
    const val = part.trim();

    if (/^!\d+$/.test(val)) {
      // check exclude format
      const num = Number(val.slice(1));
      if (num < 0 || num > defaultMax) return { value, isValid: false };
      excludes.push(num);
    } else if (/^\d+-\d+$/.test(val)) {
      if (rangeCount === 1) return { value, isValid: false };
      rangeCount++;

      // check range format
      const parts = val.split("-");
      if (parts.length !== 2) return { value, isValid: false };
      value.min = Number(parts[0]);
      value.max = Number(parts[1]);

      if (
        value.min < 0 ||
        value.min > defaultMax ||
        value.max > defaultMax ||
        value.max < value.min
      )
        return { value, isValid: false };
    } else if (/^\d+$/.test(val)) {
      // check digit format
      const num = Number(val);
      if (commaParts.length > 1 || num < 0 || num > defaultMax)
        return { value, isValid: false };

      return { value: { min: num, max: num, excludes }, isValid: true };
    } else {
      return { value, isValid: false };
    }
  }

  return { value, isValid: true };
};

export const printTotoSetPoolString = (pool: TotoSetPools) => {
  const entries = Object.entries(pool)
    .map(([innerKey, set]) => `${innerKey}: [${[...set].join(", ")}]`)
    .join("\n  ");
  console.log(entries);
};

export const printTotoPoolString = (pools: TotoPools) => {
  const entries = Object.entries(pools).map(([key, poolSet]) => {
    const innerEntries = Object.entries(poolSet)
      .map(([innerKey, set]) => `${innerKey}: [${[...set].join(", ")}]`)
      .join("\n  ");
    return `${key}:\n  ${innerEntries}`;
  });
  console.log(entries.join("\n\n"));
};

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

export const initTotoPool = (): TotoPools => {
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

export const addPoolNum = (pools: TotoPools, num: number, low: number) => {
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

export const initDefaultTotoPool = (rangeTyp: TOTO_RANGE): TotoPools => {
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

export const getTotoPoolsCopy = (pools: TotoPools): TotoPools => ({
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

export const deletePoolNum = (pools: TotoPools, n: number) => {
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
    case TOTO_RANGE.THIRTY:
      return {
        min: 1,
        max: 30,
        odd: 15,
        even: 15,
        count: 30,
        low: 15,
        group: 3,
      };
    case TOTO_RANGE.THIRTY_FIVE:
      return {
        min: 1,
        max: 35,
        odd: 18,
        even: 17,
        count: 35,
        low: 17,
        group: 4,
      };
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

export const calcCombination = (n: number, k: number) => {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;

  // C(n, k) = C(n, n-k)
  if (k > n - k) k = n - k;

  let result = 1;

  for (let i = 1; i <= k; i++) {
    result = (result * (n - k + i)) / i;
  }

  return result;
};

export const verifyCombination = (
  system: number,
  combinationSize: number,
  selectedCustomCounts: number[],
  customCounts: RangeValue[],
  selectedOddCount: number,
  odd: RangeValue,
  selectedEvenCount: number,
  even: RangeValue,
  selectedLowCount: number,
  low: RangeValue,
  selectedHighCount: number,
  high: RangeValue,
  selectedRangeGroups: number[],
  rangeValues: RangeValue[]
): boolean => {
  // ensure the combination size is correct
  if (combinationSize !== system) return false;

  // ensure the custom group setting is correct
  for (let i = 0; i < customCounts.length; i++) {
    if (
      selectedCustomCounts[i] < customCounts[i].min ||
      selectedCustomCounts[i] > customCounts[i].max
    )
      return false;

    for (const exclude of customCounts[i].excludes) {
      if (selectedCustomCounts[i] === exclude) return false;
    }
  }

  // ensure the odd/even setting is correct
  if (
    selectedOddCount < odd.min ||
    selectedOddCount > odd.max ||
    selectedEvenCount < even.min ||
    selectedEvenCount > even.max
  )
    return false;

  for (const exclude of odd.excludes) {
    if (selectedOddCount === exclude) return false;
  }
  for (const exclude of even.excludes) {
    if (selectedEvenCount === exclude) return false;
  }

  // ensure the low/high setting is correct
  if (
    selectedLowCount < low.min ||
    selectedLowCount > low.max ||
    selectedHighCount < high.min ||
    selectedHighCount > high.max
  )
    return false;

  for (const exclude of low.excludes) {
    if (selectedLowCount === exclude) return false;
  }
  for (const exclude of high.excludes) {
    if (selectedHighCount === exclude) return false;
  }

  // ensure the range group setting is correct
  for (let i = 0; i < rangeValues.length; i++) {
    if (
      selectedRangeGroups[i] < rangeValues[i].min ||
      selectedRangeGroups[i] > rangeValues[i].max
    )
      return false;

    for (const exclude of rangeValues[i].excludes) {
      if (selectedRangeGroups[i] === exclude) return false;
    }
  }

  return true;
};

export const generateCombinations = async (
  input: TotoInputType,
  isBrowser: boolean
): Promise<{ combinations: TotoCombination[]; count: number | null }> => {
  // Read params
  const count = Number(input.count);
  const rangeInfo = getRangeInfo(input.numberRange);

  // Build initial pool
  const defaultPool = initDefaultTotoPool(input.numberRange);
  const availablePool = getTotoPoolsCopy(defaultPool);
  const selectedPool = initTotoPool();

  // Init output
  const combinationSet = new Set<string>();
  const combinations: TotoCombination[] = [];

  // Read must include setting
  const mustIncludeParts = input.mustIncludes.split(",");
  for (const val of mustIncludeParts) {
    if (val === "") {
      continue;
    }
    const n = Number(val);
    addPoolNum(selectedPool, n, rangeInfo.low);
    deletePoolNum(availablePool, n);
  }

  // Check is selected pools full
  if (selectedPool.allPools.allPools.size === input.system) {
    const combinationStr = setToString(selectedPool.allPools.allPools, " ");
    const out = analyseData(
      selectedPool.allPools.allPools,
      combinationStr,
      rangeInfo
    );
    combinations.push(out);

    return { combinations, count: calcCombination(input.system, 6) };
  }

  // Calculate remaining numbers to fill
  const remainingSlot = input.system - selectedPool.allPools.allPools.size;

  // Read must excludes setting
  const mustExcludeParts = input.mustExcludes.split(",");
  for (const val of mustExcludeParts) {
    if (val === "") {
      continue;
    }
    const n = Number(val);
    deletePoolNum(availablePool, n);
  }

  // Read custom group setting
  const customCounts: RangeValue[] = [];
  const customPools: TotoPools[] = [];
  const customPoolIdx: Record<number, number> = {};
  if (input.includeCustomGroup) {
    for (const [idx, customGroup] of input.customGroups.entries()) {
      const customCount = extractRangeInput(customGroup.count, input.system);
      const customPool = initTotoPool();
      const parts = customGroup.numbers.split(",");
      for (const val of parts) {
        if (val === "") {
          continue;
        }
        const n = Number(val);
        addPoolNum(customPool, n, rangeInfo.low);
        customPoolIdx[n] = idx;
      }
      customPools.push(customPool);

      // Adjust custom group setting
      customCount.value.max = Math.min(
        customPool.allPools.allPools.size,
        Math.min(customCount.value.max, remainingSlot)
      );
      customCount.value.min = Math.max(
        customCount.value.min,
        remainingSlot -
          (availablePool.allPools.allPools.size -
            customPool.allPools.allPools.size)
      );
      customCounts.push(customCount.value);
    }
  }

  // Read odd/even setting
  const odd = extractRangeInput(input.odd, input.system);
  const even = extractRangeInput(input.even, input.system);

  // Adjust odd/even count
  odd.value.min = Math.max(odd.value.min, input.system - even.value.max);
  odd.value.max = Math.min(odd.value.max, input.system - even.value.min);
  even.value.min = Math.max(even.value.min, input.system - odd.value.max);
  even.value.max = Math.min(even.value.max, input.system - odd.value.min);

  // Read low/high setting
  const low = extractRangeInput(input.low, input.system);
  const high = extractRangeInput(input.high, input.system);

  // Adjust low/high count
  low.value.min = Math.max(low.value.min, input.system - high.value.max);
  low.value.max = Math.min(low.value.max, input.system - high.value.min);
  high.value.min = Math.max(high.value.min, input.system - low.value.max);
  high.value.max = Math.min(high.value.max, input.system - low.value.min);

  // Read range group settings
  let minRangeSum = 0;
  let maxRangeSum = 0;
  const rangeValues: RangeValue[] = [];
  for (let i = 0; i < rangeInfo.group; i++) {
    // validate range group fields
    const rangeInput = extractRangeInput(
      input[TotoRangeInputKeys[i]],
      input.system
    );
    rangeValues.push(rangeInput.value);

    // calculate sum of min/max
    minRangeSum += rangeInput.value.min;
    maxRangeSum += rangeInput.value.max;
  }

  // Adjust range group count
  for (const [idx, rangeValue] of rangeValues.entries()) {
    const minSumExcludingGroup = Math.max(
      input.system - rangeValue.max,
      minRangeSum - rangeValue.min
    );
    const maxSumExcludingGroup = Math.min(
      input.system - rangeValue.min,
      maxRangeSum - rangeValue.max
    );

    // adjust range value
    rangeValue.min = Math.max(
      rangeValue.min,
      input.system - maxSumExcludingGroup
    );
    rangeValue.max = Math.min(
      rangeValue.max,
      input.system - minSumExcludingGroup
    );
    rangeValues[idx] = rangeValue;
  }

  let possibleCombination = 0;
  if (isBrowser) {
    possibleCombination = await calcPossibleCombination(
      input.system,
      rangeInfo,
      customCounts,
      customPoolIdx,
      odd.value,
      even.value,
      low.value,
      high.value,
      rangeValues,
      availablePool,
      selectedPool
    );
  }

  if (possibleCombination === 0 && isBrowser) {
    return { combinations: [], count: possibleCombination };
  }

  // Generate combinations
  let k = 0;
  while (combinations.length < count && k < 10000) {
    // duplication pools to prevent overwrite of the default pools
    const availablePoolCopy = getTotoPoolsCopy(availablePool);
    const selectedPoolCopy = getTotoPoolsCopy(selectedPool);
    const customPoolsCopy: TotoPools[] = [];
    for (const customPool of customPools) {
      customPoolsCopy.push(getTotoPoolsCopy(customPool));
    }

    // generate combination
    const combination = generateCombination(
      remainingSlot,
      rangeInfo,
      availablePoolCopy,
      selectedPoolCopy,
      customPoolsCopy,
      customCounts,
      customPoolIdx,
      odd.value,
      even.value,
      low.value,
      high.value,
      rangeValues
    );

    // analyse result and write to the output list
    const combinationStr = setToString(combination, " ");
    if (!combinationSet.has(combinationStr)) {
      // calculate selected custom number
      const selectedCustomCounts = new Array<number>(customPools.length);
      for (const num of combination) {
        if (num in customPoolIdx) selectedCustomCounts[customPoolIdx[num]]++;
      }

      const out = analyseData(combination, combinationStr, rangeInfo);

      if (
        !verifyCombination(
          input.system,
          combination.size,
          selectedCustomCounts,
          customCounts,
          out.oddCount,
          odd.value,
          out.evenCount,
          even.value,
          out.lowCount,
          low.value,
          out.highCount,
          high.value,
          out.outputGroups.map((g) => g.count),
          rangeValues
        )
      )
        continue;

      // save combination
      combinations.push(out);
      combinationSet.add(combinationStr);
    }

    k++;
  }

  return { combinations, count: possibleCombination };
};

const generateCombination = (
  remainingSlot: number,
  rangeInfo: TotoRangeInfo,
  availablePool: TotoPools,
  selectedPool: TotoPools,
  customPools: TotoPools[],
  customCounts: RangeValue[],
  customIdx: Record<number, number>,
  odd: RangeValue,
  even: RangeValue,
  low: RangeValue,
  high: RangeValue,
  rangeValues: RangeValue[]
): Set<number> => {
  const selectedCustomCounts = new Array<number>(customCounts.length).fill(0);
  for (let i = 0; i < remainingSlot; i++) {
    // Calculate remaining numbers to fill
    const remainingCount = remainingSlot - i;

    // Calculate remaining and required custom numbers
    let minRequiredCustomCount = 999;
    let selectedCustomIdx = 0;
    for (const [idx, customCount] of customCounts.entries()) {
      const requiredCustomCount = Math.max(
        0,
        customCount.min - selectedCustomCounts[idx]
      );
      if (
        requiredCustomCount > 0 &&
        requiredCustomCount < minRequiredCustomCount
      ) {
        minRequiredCustomCount = requiredCustomCount;
        selectedCustomIdx = idx;
      }

      // Remove unnessary custom numbers
      const remainingCustomCount = Math.min(
        customCount.max - selectedCustomCounts[idx],
        customPools[idx].allPools.allPools.size
      );
      if (remainingCustomCount === 0) {
        for (const num of customPools[idx].allPools.allPools) {
          deletePoolNum(availablePool, num);
          deletePoolNum(customPools[idx], num);
        }
      }
    }

    // Calculate the remaining and required odd/even numbers
    const remainingOddCount = Math.max(
      0,
      odd.max - selectedPool.allPools.oddPools.size
    );
    const requiredOddCount = Math.max(
      0,
      odd.min - selectedPool.allPools.oddPools.size
    );
    const remainingEvenCount = Math.max(
      0,
      even.max - selectedPool.allPools.evenPools.size
    );
    const requiredEvenCount = Math.max(
      0,
      even.min - selectedPool.allPools.evenPools.size
    );

    // Caculate the remaining and required low/high numbers
    const remainingLowCount = Math.max(
      0,
      low.max - selectedPool.allPools.lowPools.size
    );
    const requiredLowCount = Math.max(
      0,
      low.min - selectedPool.allPools.lowPools.size
    );
    const remainingHighCount = Math.max(
      0,
      high.max - selectedPool.allPools.highPools.size
    );
    const requiredHighCount = Math.max(
      0,
      high.min - selectedPool.allPools.highPools.size
    );

    // Calculate remaining and required numbers in each range group
    let totalAvailRangeOddCount = 0;
    let totalAvailRangeEvenCount = 0;
    let totalAvailRangeLowCount = 0;
    let totalAvailRangeHighCount = 0;
    const remainingRangeCounts: number[] = [];
    const requiredRangeCounts: number[] = [];
    for (const [idx, rangeValue] of rangeValues.entries()) {
      // Calculate remaining numbers in each range group
      const remainingRangeCount = Math.max(
        0,
        rangeValue.max - selectedPool[TotoPoolKeys[idx]].allPools.size
      );
      remainingRangeCounts.push(remainingRangeCount);

      // Remove the numbers if the range group limit is reached
      if (remainingRangeCount === 0) {
        for (const num of availablePool[TotoPoolKeys[idx]].allPools) {
          deletePoolNum(availablePool, num);
          if (num in customIdx) {
            deletePoolNum(customPools[customIdx[num]], num);
          }
        }
      }

      // Calculate required numbers in each range group
      const requiredRangeCount = Math.max(
        0,
        rangeValue.min - selectedPool[TotoPoolKeys[idx]].allPools.size
      );
      requiredRangeCounts.push(requiredRangeCount);

      // Calculate available odd count in range group
      const availRangeOddCount = Math.min(
        rangeValue.max,
        availablePool[TotoPoolKeys[idx]].oddPools.size
      );
      totalAvailRangeOddCount += availRangeOddCount;

      // Calculate available even count in range group
      const availRangeEvenCount = Math.min(
        rangeValue.max,
        availablePool[TotoPoolKeys[idx]].evenPools.size
      );
      totalAvailRangeEvenCount += availRangeEvenCount;

      // Calculate available low count in range group
      const availRangeLowCount = Math.min(
        rangeValue.max,
        availablePool[TotoPoolKeys[idx]].lowPools.size
      );
      totalAvailRangeLowCount += availRangeLowCount;

      // Calculate available high count in range group
      const availRangeHighCount = Math.min(
        rangeValue.max,
        availablePool[TotoPoolKeys[idx]].highPools.size
      );
      totalAvailRangeHighCount += availRangeHighCount;
    }

    // Select pool to draw
    let poolGroup: TotoPools;
    let poolSet: TotoSetPools;
    let selectedRangeGroupIdx: number | undefined;
    let requiredRangeCount = remainingCount + 1;
    if (minRequiredCustomCount !== 999) {
      // Choose the range group to draw with
      poolGroup = customPools[selectedCustomIdx];
      poolSet = poolGroup.allPools;
      for (let j = 0; j < rangeInfo.group; j++) {
        const requiredCustomRangeCount = Math.max(
          0,
          requiredRangeCounts[j] -
            (availablePool[TotoPoolKeys[j]].allPools.size -
              poolGroup[TotoPoolKeys[j]].allPools.size)
        );
        if (
          requiredCustomRangeCount > 0 &&
          requiredCustomRangeCount < requiredRangeCount
        ) {
          requiredRangeCount = requiredCustomRangeCount;
          poolSet = poolGroup[TotoPoolKeys[j]];
          selectedRangeGroupIdx = j;
        }
      }
    } else {
      // Choose the range group to draw with
      poolGroup = availablePool;
      poolSet = availablePool.allPools;
      for (let j = 0; j < rangeInfo.group; j++) {
        if (
          requiredRangeCounts[j] > 0 &&
          requiredRangeCounts[j] < requiredRangeCount
        ) {
          requiredRangeCount = requiredRangeCounts[j];
          poolSet = availablePool[TotoPoolKeys[j]];
          selectedRangeGroupIdx = j;
        }
      }
    }

    // Set selection bias for odd/even setting
    const poolAvailOddCount =
      selectedRangeGroupIdx === undefined
        ? Math.min(totalAvailRangeOddCount, poolGroup.allPools.oddPools.size)
        : Math.min(
            rangeValues[selectedRangeGroupIdx].max,
            poolGroup[TotoPoolKeys[selectedRangeGroupIdx]].oddPools.size
          );
    const poolAvailEvenCount =
      selectedRangeGroupIdx === undefined
        ? Math.min(totalAvailRangeEvenCount, poolGroup.allPools.evenPools.size)
        : Math.min(
            rangeValues[selectedRangeGroupIdx].max,
            poolGroup[TotoPoolKeys[selectedRangeGroupIdx]].evenPools.size
          );

    let requiredPoolOddCount = 0;
    if (poolAvailOddCount > 0) {
      requiredPoolOddCount = Math.max(
        0,
        requiredOddCount - (totalAvailRangeOddCount - poolAvailOddCount)
      );
    }
    let requiredPoolEvenCount = 0;
    if (poolAvailEvenCount > 0) {
      requiredPoolEvenCount = Math.max(
        0,
        requiredEvenCount - (totalAvailRangeEvenCount - poolAvailEvenCount)
      );
    }

    let oddEvenRule = "both";
    if (
      remainingEvenCount === 0 ||
      poolAvailEvenCount === 0 ||
      requiredPoolOddCount > 0
    ) {
      oddEvenRule = "odd";
    } else if (
      remainingOddCount === 0 ||
      poolAvailOddCount === 0 ||
      requiredPoolEvenCount > 0
    ) {
      oddEvenRule = "even";
    }

    // Set selection bias for low/high setting
    const poolAvailLowCount =
      selectedRangeGroupIdx === undefined
        ? Math.min(totalAvailRangeLowCount, poolGroup.allPools.lowPools.size)
        : Math.min(
            rangeValues[selectedRangeGroupIdx].max,
            poolGroup[TotoPoolKeys[selectedRangeGroupIdx]].lowPools.size
          );
    const poolAvailHighCount =
      selectedRangeGroupIdx === undefined
        ? Math.min(totalAvailRangeHighCount, poolGroup.allPools.highPools.size)
        : Math.min(
            rangeValues[selectedRangeGroupIdx].max,
            poolGroup[TotoPoolKeys[selectedRangeGroupIdx]].highPools.size
          );

    let requiredPoolLowCount = 0;
    if (poolAvailLowCount > 0) {
      requiredPoolLowCount = Math.max(
        0,
        requiredLowCount - (totalAvailRangeLowCount - poolAvailLowCount)
      );
    }
    let requiredPoolHighCount = 0;
    if (poolAvailHighCount > 0) {
      requiredPoolHighCount = Math.max(
        0,
        requiredHighCount - (totalAvailRangeHighCount - poolAvailHighCount)
      );
    }

    let lowHighRule = "both";
    if (
      remainingHighCount === 0 ||
      poolAvailHighCount === 0 ||
      requiredPoolLowCount > 0
    ) {
      lowHighRule = "low";
    } else if (
      remainingLowCount === 0 ||
      poolAvailLowCount === 0 ||
      requiredPoolHighCount > 0
    ) {
      lowHighRule = "high";
    }

    // Random number with selected settings
    const n = randomNumber(poolSet, oddEvenRule, lowHighRule);
    if (n !== undefined) {
      // Calculate selected custom numbers
      if (n in customIdx) {
        selectedCustomCounts[customIdx[n]]++;

        // Remove selected number from custom pools
        deletePoolNum(customPools[customIdx[n]], n);
      }

      // add generated number
      addPoolNum(selectedPool, n, rangeInfo.low);

      // Remove selected number from pools
      deletePoolNum(availablePool, n);
    } else {
      console.error("Failed to random on empty set.", i);
    }
  }

  return selectedPool.allPools.allPools;
};

const randomNumber = (
  availablePool: TotoSetPools,
  oddEvenRule: string,
  lowHighRule: string
) => {
  // Generate number based on bias
  let n: number | undefined;
  if (oddEvenRule === "both" && lowHighRule === "both") {
    n = randomFromSet(availablePool.allPools);
  } else {
    if (oddEvenRule === "both") {
      if (lowHighRule === "low") {
        n = randomFromSet(availablePool.lowPools);
      } else {
        n = randomFromSet(availablePool.highPools);
      }
    } else if (oddEvenRule === "odd") {
      if (lowHighRule === "both") {
        n = randomFromSet(availablePool.oddPools);
      } else if (lowHighRule === "low") {
        n = randomFromSet(availablePool.oddLowPools);
      } else {
        n = randomFromSet(availablePool.oddHighPools);
      }
    } else {
      if (lowHighRule === "both") {
        n = randomFromSet(availablePool.evenPools);
      } else if (lowHighRule === "low") {
        n = randomFromSet(availablePool.evenLowPools);
      } else {
        n = randomFromSet(availablePool.evenHighPools);
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
    oddCount,
    evenCount,
    lowCount,
    highCount,
  };
};

export const calcPossibleCombination = async (
  system: number,
  rangeInfo: TotoRangeInfo,
  customCounts: RangeValue[],
  customIdx: Record<number, number>,
  odd: RangeValue,
  even: RangeValue,
  low: RangeValue,
  high: RangeValue,
  rangeValues: RangeValue[],
  availablePool: TotoPools,
  selectedPool: TotoPools
) => {
  let possibleCombination = 0;

  const selectedBit = new Array<boolean>(rangeInfo.max + 1).fill(false);
  const availableBit = new Array<boolean>(rangeInfo.max + 1).fill(false);
  const oddBit = new Array<boolean>(rangeInfo.max + 1).fill(false);
  const lowBit = new Array<boolean>(rangeInfo.max + 1).fill(false);
  const rangeBit = new Array<number>(rangeInfo.max + 1).fill(0);

  for (let i = 1; i <= rangeInfo.max; i++) {
    if (selectedPool.allPools.allPools.has(i)) selectedBit[i] = true;
    if (availablePool.allPools.allPools.has(i)) availableBit[i] = true;
    if (i % 2 !== 0) oddBit[i] = true;
    if (i <= rangeInfo.low) lowBit[i] = true;
    rangeBit[i] = Math.floor((i - 1) / 10);
  }

  const maxFirstNum = rangeInfo.count - (6 - 1);
  const startNums: number[] = [];
  let chunkSize = 8;
  switch (rangeInfo.count) {
    case 49:
      startNums.push(1, 2, 3, 4, 6, 8, 11, 15);
      break;
    case 50:
      startNums.push(1, 2, 3, 4, 6, 8, 11, 15);
      break;
    case 55:
      startNums.push(1, 2, 3, 4, 6, 8, 11, 15);
      break;
    case 58:
      startNums.push(1, 2, 3, 4, 6, 8, 11, 16);
      break;
    case 69:
      chunkSize = 12;
      startNums.push(1, 2, 3, 4, 5, 6, 7, 9, 11, 14, 18, 24);
      break;
  }

  const mustIncludeSize = Math.max(
    0,
    selectedPool.allPools.allPools.size - (system - 6)
  );
  const newOdd = {
    min: Math.max(0, odd.min - (system - 6)),
    max: odd.max,
    excludes: odd.excludes,
  };
  const newEven = {
    min: Math.max(0, even.min - (system - 6)),
    max: even.max,
    excludes: even.excludes,
  };
  const newLow = {
    min: Math.max(0, low.min - (system - 6)),
    max: low.max,
    excludes: low.excludes,
  };
  const newHigh = {
    min: Math.max(0, high.min - (system - 6)),
    max: high.max,
    excludes: high.excludes,
  };
  const newRangeValues: RangeValue[] = [];
  for (const val of rangeValues) {
    newRangeValues.push({
      min: Math.max(0, val.min - (system - 6)),
      max: val.max,
      excludes: val.excludes,
    });
  }
  const newCustomCounts: RangeValue[] = [];
  for (const val of customCounts) {
    newCustomCounts.push({
      min: Math.max(0, val.min - (system - 6)),
      max: val.max,
      excludes: val.excludes,
    });
  }

  const countPromises: Promise<number>[] = [];
  for (let j = 0; j < chunkSize; j++) {
    const startNum = startNums[j];
    const endNum = j < chunkSize - 1 ? startNums[j + 1] - 1 : maxFirstNum;
    countPromises.push(
      new Promise((resolve) => {
        const worker = createWorker();

        worker.onmessage = (e) => {
          const combinationCount: number = e.data;
          resolve(combinationCount);
          worker.terminate();
        };

        worker.postMessage({
          system,
          rangeInfo,
          customCounts: newCustomCounts,
          odd: newOdd,
          even: newEven,
          low: newLow,
          high: newHigh,
          rangeValues: newRangeValues,
          mustIncludeSize,
          availableBit,
          selectedBit,
          customIdx,
          oddBit,
          lowBit,
          rangeBit,
          startNum,
          endNum,
        });
      })
    );
  }

  const res = await Promise.all(countPromises);
  for (const combinationCount of res) {
    possibleCombination += combinationCount;
  }

  return possibleCombination;
};
