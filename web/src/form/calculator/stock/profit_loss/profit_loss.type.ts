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
  totalEntryAmount: string;
  totalExitAmount: string;
  grossGained: string;
  grossPercentage: string;
  netGained?: string;
  netPercentage?: string;
  estimatedEntryFee?: string;
  estimatedExitFee?: string;
  isLong: boolean;
  includeTradingFee: boolean;
};
