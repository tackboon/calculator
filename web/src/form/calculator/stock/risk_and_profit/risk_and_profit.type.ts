export type RiskAndProfitInputType = {
  portfolioCapital: string;
  includeTradingFee: boolean;
  estTradingFee: string;
  minTradingFee: string;
};

export enum ERROR_FIELD_RISK_AND_PROFIT {
  PORTFOLIO_CAPITAL,
  EST_TRADING_FEE,
  MIN_TRADING_FEE,
}

export type OrderResultType = {
  isLong: boolean;
  entryAmount: string;
  entryPrice: string;
  stopLossPrice: string;
  stopLossPercent: string;
  profitPrice?: string;
  profitPercent?: string;
  riskAmount: string;
  profitAmount?: string;
  entryFee?: string;
  stopLossFee?: string;
  profitFee?: string;
  portfolioRisk: string;
  portfolioProfit?: string;
  riskRewardRatio?: string;
  quantity: string;
};

export type RiskAndProfitResultType = {
  totalEntryAmount: string;
  totalRiskAmount: string;
  totalProfitAmount: string;
  portfolioRisk: string;
  portfolioProfit?: string;
  riskRewardRatio?: string;
  includeTradingFee: boolean;
  orders: OrderResultType[];
  totalShort: string;
  totalLong: string;
  hasProfitGoal: boolean;
};
