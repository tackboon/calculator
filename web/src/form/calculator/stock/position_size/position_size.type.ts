import { BigNumber } from "mathjs";

export enum UnitType {
  FRACTIONAL,
  UNIT,
  LOT,
}

export enum StopLossTyp {
  PRICED_BASED,
  PERCENT_BASED,
}

export enum ProfitGoalTyp {
  PRICED_BASED,
  PORTFOLIO_BASED,
}

export enum ProfitGoalUnit {
  PRICED_BASED,
  PERCENT_BASED,
}

export type PositionSizeInputType = {
  portfolioCapital: string;
  maxPortfolioRisk: string;
  entryPrice: string;
  unitType: UnitType;
  stopLoss: string;
  stopLossTyp: StopLossTyp;
  includeProfitGoal: boolean;
  profitGoalTyp: ProfitGoalTyp;
  profitGoal: string;
  profitGoalUnit: ProfitGoalUnit;
  isLong: boolean;
  includeTradingFee: boolean;
  estTradingFee: string;
  minTradingFee: string;
  precision: number;
  includeSlippage: boolean;
  slippage: string;
};

export enum ERROR_FIELD_POSITION_SIZE {
  PORTFOLIO_CAPITAL,
  MAX_PORTFOLIO_RISK,
  STOP_LOSS,
  PROFIT_TARGET,
  ENTRY_PRICE,
  EST_TRADING_FEE,
  MIN_TRADING_FEE,
  SLIPPAGE,
}

export type PositionSizeResultType = {
  isLong: boolean;
  includeTradingFee: boolean;
  includeProfitGoal: boolean;
  entryPriceFrom: BigNumber;
  entryPriceTo?: BigNumber;
  stopPrice: BigNumber;
  stopPercent: BigNumber;
  profitPrice?: BigNumber;
  profitPercent?: BigNumber;
  quantity: string;
  entryAmount: BigNumber;
  grossEntryAmount?: BigNumber;
  riskAmount: BigNumber;
  portfolioRisk: BigNumber;
  profitAmount?: BigNumber;
  portfolioProfit?: BigNumber;
  riskRewardRatio?: BigNumber;
  breakEvenWinRate?: BigNumber;
  entryFee?: BigNumber;
  stopFee?: BigNumber;
  profitFee?: BigNumber;
};
