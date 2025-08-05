export enum UnitType {
  FRACTIONAL,
  UNIT,
  LOT,
}

export enum ProfitGoalTyp {
  PRICED_BASED,
  PORTFOLIO_BASED,
}

export type PositionSizeInputType = {
  portfolioCapital: string;
  maxPortfolioRisk: string;
  entryPrice: string;
  unitType: UnitType;
  stopLoss: string;
  stopLossTyp: "$" | "%";
  includeProfitGoal: boolean;
  profitGoalTyp: ProfitGoalTyp;
  profitGoal: string;
  profitGoalUnit: "$" | "%";
  isLong: boolean;
  includeTradingFee: boolean;
  estTradingFee: string;
  minTradingFee: string;
};

export enum ERROR_FIELD_POSITION_SIZE {
  PORTFOLIO_CAPITAL,
  MAX_PORTFOLIO_RISK,
  STOP_LOSS,
  PROFIT_TARGET,
  ENTRY_PRICE,
  EST_TRADING_FEE,
  MIN_TRADING_FEE,
}

export type PositionSizeResultType = {
  isLong: boolean;
  includeTradingFee: boolean;
  includeProfitGoal: boolean;
  entryPrice: string;
  stopPrice: string;
  stopPercent: string;
  profitPrice?: string;
  profitPercent?: string;
  quantity: string;
  tradingAmount: string;
  riskAmount: string;
  portfolioRisk: string;
  profitAmount?: string;
  portfolioProfit?: string;
  riskRewardRatio?: string;
  breakEvenWinRate?: string;
  estimatedEntryFee?: string;
  estimatedStopFee?: string;
  estimatedProfitFee?: string;
};
