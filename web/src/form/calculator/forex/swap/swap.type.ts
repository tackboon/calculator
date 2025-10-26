import { BigNumber } from "mathjs";

export type SwapInputType = {
  accBaseCurrency: string;
  currencyPair: string;
  quotePair: string;
  quoteCrossRate: string;
  positionSize: string;
  pipDecimal: string;
  swapPerLot: string;
  period: string;
};

export enum ERROR_FIELD_SWAP {
  QUOTE_CROSS_RATE,
  POSITION_SIZE,
  PIP_DECIMAL,
  SWAP_PER_LOT,
  PERIOD,
}

export type SwapResultType = {
  accBaseCurrency: string;
  swapValue: BigNumber;
};
