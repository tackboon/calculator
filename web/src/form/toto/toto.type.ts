export enum TOTO_RANGE {
  FOURTY_NINE,
  FIFTY,
  FIFTY_FIVE,
  FIFTY_EIGHT,
  SIXTY_NINE,
  THIRTY
}

export type TotoInputType = {
  count: string;
  system: number;
  numberRange: number;
  includeNumberFilter: boolean;
  mustIncludes: string;
  mustExcludes: string;
  includeOddEven: boolean;
  odd: string;
  even: string;
  includeLowHigh: boolean;
  low: string;
  high: string;
  includeCustomGroup: boolean;
  customGroups: string;
  customCount: string;
  includeRangeGroup: boolean;
  rangeCount10: string;
  rangeCount20: string;
  rangeCount30: string;
  rangeCount40: string;
  rangeCount50: string;
  rangeCount60: string;
  rangeCount70: string;
};

export enum ERROR_FIELD_TOTO {
  COUNT,
  MUST_INCLUDES,
  MUST_EXCLUDES,
  CUSTOM_GROUPS,
  CUSTOM_COUNT,
  ODD,
  EVEN,
  LOW,
  HIGH,
  RANGE_10,
  RANGE_20,
  RANGE_30,
  RANGE_40,
  RANGE_50,
  RANGE_60,
  RANGE_70,
}

export type TotoOutputGroup = {
  name: string;
  count: number;
};

export type TotoCombination = {
  combination: string;
  oddEven: string;
  lowHigh: string;
  sum: number;
  average: number;
  outputGroups: TotoOutputGroup[];
};

export type TotoSetPools = {
  allPools: Set<number>;
  oddPools: Set<number>;
  evenPools: Set<number>;
  lowPools: Set<number>;
  highPools: Set<number>;
  oddLowPools: Set<number>;
  oddHighPools: Set<number>;
  evenLowPools: Set<number>;
  evenHighPools: Set<number>;
};

export type TotoPools = {
  allPools: TotoSetPools;
  range10Pools: TotoSetPools;
  range20Pools: TotoSetPools;
  range30Pools: TotoSetPools;
  range40Pools: TotoSetPools;
  range50Pools: TotoSetPools;
  range60Pools: TotoSetPools;
  range70Pools: TotoSetPools;
};

export type TotoRangeInfo = {
  min: number;
  max: number;
  odd: number;
  even: number;
  count: number;
  low: number;
  group: number;
};

export type RangeValue = {
  min: number;
  max: number;
};
