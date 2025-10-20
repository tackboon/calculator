import { BigNumber } from "mathjs";

export type MarginInputType = {
  accBaseCurrency: string;
  currencyPair: string;
  basePair: string;
  baseCrossRate: string;
  positionSize: string;
  leverage: number;
};

export enum ERROR_FIELD_MARGIN {
  BASE_CROSS_RATE,
  POSITION_SIZE,
}

export type MarginResultType = {
  accBaseCurrency: string;
  margin: BigNumber;
};
