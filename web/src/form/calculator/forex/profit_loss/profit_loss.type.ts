import { BigNumber } from "mathjs";
import { FeeTyp } from "../forex_calculator_form.type";

export type ProfitLossInputType = {
  accBaseCurrency: string;
  currencyPair: string;
  lotSize: string;
  contractSize: string;
  basePair: string;
  baseCrossRate: string;
  quotePair: string;
  quoteCrossRate: string;
  entryPrice: string;
  exitPrice: string;
  isLong: boolean;
  includeTradingFee: boolean;
  feeTyp: FeeTyp;
  estTradingFee: string;
  swapPerLot: string;
  period: string;
  pipDecimal: string;
  precision: number;
};

export enum ERROR_FIELD_PROFIT_LOSS {
  LOT_SIZE,
  CONTRACT_SIZE,
  BASE_CROSS_RATE,
  QUOTE_CROSS_RATE,
  OPEN_PRICE,
  EXIT_PRICE,
  EST_TRADING_FEE,
  SWAP_PER_LOT,
  PERIOD,
  PIP_DECIMAL,
}

export type ProfitLossResultType = {
  isLong: boolean;
  includeTradingFee: boolean;
  accBaseCurrency: string;
  entryPrice: BigNumber;
  exitPrice: BigNumber;
  pipSize: BigNumber;
  positionSize: BigNumber;
  grossGained: BigNumber;
  netGained?: BigNumber;
  entryFee?: BigNumber;
  exitFee?: BigNumber;
  swapValue?: BigNumber;
};
