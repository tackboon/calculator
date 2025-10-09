import { BigNumber } from "mathjs";
import { FeeTyp, ProfitGoalTyp } from "../forex_calculator_form.type";
import { LotTyp } from "../../../../component/forex/lot_typ_input_box/lot_typ.component";

export type ForexPositionSizeInputType = {
  portfolioCapital: string;
  maxPortfolioRisk: string;
  accBaseCurrency: string;
  currencyPair: string;
  lotTyp: LotTyp;
  contractSize: string;
  basePair: string;
  baseCrossRate: string;
  quotePair: string;
  quoteCrossRate: string;
  openPrice: string;
  stopLoss: string;
  isStopLossPip: boolean;
  includeProfitGoal: boolean;
  profitGoalTyp: ProfitGoalTyp;
  profitGoal: string;
  isProfitPip: boolean;
  isLong: boolean;
  includeTradingFee: boolean;
  feeTyp: FeeTyp;
  estTradingFee: string;
  swapFee: string;
  period: string;
  leverage: number;
  pipSize: number;
  precision: number;
};

export enum ERROR_FIELD_POSITION_SIZE {
  PORTFOLIO_CAPITAL,
  MAX_PORTFOLIO_RISK,
  CONTRACT_SIZE,
  BASE_CROSS_RATE,
  QUOTE_CROSS_RATE,
  OPEN_PRICE,
  STOP_LOSS,
  PROFIT_TARGET,
  EST_TRADING_FEE,
  SWAP_FEE,
  PERIOD,
}

export type PositionSizeResultType = {
  isLong: boolean;
  includeTradingFee: boolean;
  includeProfitGoal: boolean;
  accBaseCurrency: string;
  entryPrice: BigNumber;
  stopPrice: BigNumber;
  profitPrice?: BigNumber;
  positionSize: BigNumber;
  lotTyp: BigNumber;
  marginToHold: BigNumber;
  riskAmount: BigNumber;
  portfolioRisk: BigNumber;
  profitAmount?: BigNumber;
  portfolioProfit?: BigNumber;
  riskRewardRatio?: BigNumber;
  breakEvenWinRate?: BigNumber;
  entryFee?: BigNumber;
  stopFee?: BigNumber;
  profitFee?: BigNumber;
  stopSwapFee?: BigNumber;
  profitSwapFee?: BigNumber;
};
