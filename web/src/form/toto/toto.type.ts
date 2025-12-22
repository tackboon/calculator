import { CustomGroupInputType } from "../../component/toto/custom_group/custom.type";

export enum TOTO_RANGE {
  FOURTY_NINE,
  FIFTY,
  FIFTY_FIVE,
  FIFTY_EIGHT,
  SIXTY_NINE,
  THIRTY,
  THIRTY_FIVE,
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
  customGroups: CustomGroupInputType[];
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
  oddCount: number;
  evenCount: number;
  lowCount: number;
  highCount: number;
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

export const TotoPoolKeys: Array<keyof TotoPools> = [
  "range10Pools",
  "range20Pools",
  "range30Pools",
  "range40Pools",
  "range50Pools",
  "range60Pools",
  "range70Pools",
];

export const TotoRangeInputKeys = [
  "rangeCount10",
  "rangeCount20",
  "rangeCount30",
  "rangeCount40",
  "rangeCount50",
  "rangeCount60",
  "rangeCount70",
] as const;

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
  excludes: number[];
};

export type WorkerInput = {
  system: number;
  rangeInfo: TotoRangeInfo;
  customCounts: RangeValue[];
  odd: RangeValue;
  even: RangeValue;
  low: RangeValue;
  high: RangeValue;
  rangeValues: RangeValue[];
  mustIncludeSize: number;
  availableBit: boolean[];
  selectedBit: boolean[];
  customBits: boolean[][];
  oddBit: boolean[];
  lowBit: boolean[];
  rangeBit: number[];
  startNum: number;
  endNum: number;
};