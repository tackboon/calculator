import { BigNumber } from "mathjs";

export type RiskAndProfitInputType = {
  portfolioCapital: string;
  includeTradingFee: boolean;
  estTradingFee: string;
  minTradingFee: string;
  precision: number;
};

export enum ERROR_FIELD_RISK_AND_PROFIT {
  PORTFOLIO_CAPITAL,
  EST_TRADING_FEE,
  MIN_TRADING_FEE,
}

export type OrderResultType = {
  isLong: boolean;
  entryPrice: BigNumber;
  stopLossPrice: BigNumber;
  stopLossPercent: BigNumber;
  profitPrice?: BigNumber;
  profitPercent?: BigNumber;
  grossEntryAmount?: BigNumber;
  entryAmount: BigNumber;
  riskAmount: BigNumber;
  profitAmount?: BigNumber;
  entryFee?: BigNumber;
  stopLossFee?: BigNumber;
  profitFee?: BigNumber;
  portfolioRisk: BigNumber;
  portfolioProfit?: BigNumber;
  riskRewardRatio?: BigNumber;
  breakEvenWinRate?: BigNumber;
  quantity: BigNumber;
};

export type RiskAndProfitResultType = {
  totalEntryAmount: BigNumber;
  totalGrossEntryAmount?: BigNumber;
  totalRiskAmount: BigNumber;
  totalProfitAmount?: BigNumber;
  portfolioRisk: BigNumber;
  portfolioProfit?: BigNumber;
  riskRewardRatio?: BigNumber;
  breakEvenWinRate?: BigNumber;
  includeTradingFee: boolean;
  orders: OrderResultType[];
  totalShort: number;
  totalLong: number;
};
