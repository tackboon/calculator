import { BigNumber } from "mathjs";

export type PipInputType = {
  accBaseCurrency: string;
  currencyPair: string;
  quotePair: string;
  quoteCrossRate: string;
  positionSize: string;
  pipDecimal: string;
  pipSize: string;
};

export enum ERROR_FIELD_PIP {
  QUOTE_CROSS_RATE,
  POSITION_SIZE,
  PIP_DECIMAL,
  PIP_SIZE,
}

export type PipResultType = {
  accBaseCurrency: string;
  pipValue: BigNumber;
  totalPipValue: BigNumber;
};
