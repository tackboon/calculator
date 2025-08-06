export enum StopLossTyp {
  PRICE_BASED,
  PIP_BASED,
}

export enum ProfitGoalTyp {
  PRICE_BASED,
  PORTFOLIO_BASED,
  PIP_BASED,
}

export enum FeeTyp {
  COMMISSION_PER_LOT,
  COMMISSION_PER_100K,
}

export type ForexPositionSizeInputType = {
  portfolioCapital: string;
  maxPortfolioRisk: string;
  accBaseCurrency: string;
  currencyPair: string;
  contractSize: string;
  basePair: string;
  baseCrossRate: string;
  quotePair: string;
  quoteCrossRate: string;
  openPrice: string;
  stopLoss: string;
  stopLossTyp: StopLossTyp;
  includeProfitGoal: boolean;
  profitGoalTyp: ProfitGoalTyp;
  profitGoal: string;
  isLong: boolean;
  includeTradingFee: boolean;
  feeTyp: FeeTyp;
  estTradingFee: string;
  swapFee: string;
  leverage: number;
};

export enum ERROR_FIELD_POSITION_SIZE {
  PORTFOLIO_CAPITAL,
  MAX_PORTFOLIO_RISK,
  USD_ACC_CROSS_RATE,
  USD_BASE_CROSS_RATE,
  USD_QUOTE_CROSS_RATE,
  CONTRACT_SIZE,
  BASE_CROSS_RATE,
  QUOTE_CROSS_RATE,
  OPEN_PRICE,
  STOP_LOSS,
  PROFIT_TARGET,
  EST_TRADING_FEE,
}

export type PositionSizeResultType = {
  isLong: boolean;
  includeTradingFee: boolean;
  includeProfitGoal: boolean;
  entryPrice: number;
  stopPrice: number;
  profitPrice?: number;
  quantity: number;
  lot: number;
  marginToHold: number;
  riskAmount: number;
  portfolioRisk: number;
  profitAmount?: number;
  portfolioProfit?: number;
  riskRewardRatio?: string;
  breakEvenWinRate?: number;
  commissionFee?: number;
  stopFee?: number;
  profitFee?: number;
  swapFee?: number;
};
