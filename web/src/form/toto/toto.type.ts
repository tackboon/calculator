export enum TOTO_RANGE {
  FOURTY_NINE,
  FIFTY,
  FIFTY_FIVE,
  FIFTY_EIGHT,
  SIXTY_NINE,
}

export type TotoInputType = {
  count: string;
  system: number;
  numberRange: number;
  mustIncludes: string;
  mustExcludes: string;
  conditionalGroups: string;
  conditionalCount: string;
  oddEven: string;
  lowHigh: string;
};

export enum ERROR_FIELD_TOTO {
  COUNT,
  MUST_INCLUDES,
  MUST_EXCLUDES,
  CONDITIONAL_GROUPS,
  CONDITIONAL_COUNT,
  ODD_EVEN,
  LOW_HIGH,
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

export type TotoPools = {
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

export type TotoRangeInfo = {
  min: number;
  max: number;
  odd: number;
  even: number;
  count: number;
  low: number;
  group: number;
};
