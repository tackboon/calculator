import { BigNumber } from "mathjs";

export type ProfitLossInputType = {
  entryPrice: string;
  exitPrice: string;
  quantity: string;
  isLong: boolean;
  includeTradingFee: boolean;
  estTradingFee: string;
  minTradingFee: string;
};

export enum ERROR_FIELD_PROFIT_LOSS {
  ENTRY_PRICE,
  EXIT_PRICE,
  QUANTITY,
  EST_TRADING_FEE,
  MIN_TRADING_FEE,
}

export type ProfitLossResultType = {
  grossEntryAmount: BigNumber;
  grossGained: BigNumber;
  grossPercentage: BigNumber;
  netGained?: BigNumber;
  netPercentage?: BigNumber;
  entryFee?: BigNumber;
  exitFee?: BigNumber;
  isLong: boolean;
  includeTradingFee: boolean;
};
