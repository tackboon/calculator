import { BigNumber } from "mathjs";

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
  grossEntryAmount: BigNumber;
  entryPrice: string;
  stopLossPrice: string;
  stopLossPercent: BigNumber;
  profitPrice?: string;
  profitPercent?: BigNumber;
  riskAmount: BigNumber;
  profitAmount?: BigNumber;
  entryFee?: BigNumber;
  stopLossFee?: BigNumber;
  profitFee?: BigNumber;
  portfolioRisk: BigNumber;
  portfolioProfit?: BigNumber;
  riskRewardRatio?: BigNumber;
  quantity: string;
};

export type RiskAndProfitResultType = {
  totalEntryAmount: BigNumber;
  totalRiskAmount: BigNumber;
  totalProfitAmount?: BigNumber;
  portfolioRisk: BigNumber;
  portfolioProfit?: BigNumber;
  riskRewardRatio?: BigNumber;
  includeTradingFee: boolean;
  orders: OrderResultType[];
  totalShort: number;
  totalLong: number;
};
