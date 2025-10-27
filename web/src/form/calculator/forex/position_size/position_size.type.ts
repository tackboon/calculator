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
  stopPip: string;
  includeProfitGoal: boolean;
  profitGoalTyp: ProfitGoalTyp;
  profitGoal: string;
  isLong: boolean;
  includeTradingFee: boolean;
  feeTyp: FeeTyp;
  estTradingFee: string;
  swapPerLot: string;
  period: string;
  leverage: number;
  pipDecimal: string;
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
  SWAP_PER_LOT,
  PERIOD,
  PIP_DECIMAL,
}

export type PositionSizeResultType = {
  isLong: boolean;
  includeTradingFee: boolean;
  includeProfitGoal: boolean;
  accBaseCurrency: string;
  entryPrice: BigNumber;
  stopPrice: BigNumber;
  stopPip: BigNumber;
  profitPrice?: BigNumber;
  profitPip?: BigNumber;
  positionSize: BigNumber;
  lotSize: BigNumber;
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
  swapValue?: BigNumber;
};
