import { BigNumber } from "mathjs";

export type PipMovementInputType = {
  currencyPair: string;
  price: string;
  pipDecimal: string;
  pipSize: string;
};

export enum ERROR_FIELD_PIP_MOVEMENT {
  PRICE,
  PIP_DECIMAL,
  PIP_SIZE,
}

export type PipMovementResultType = {
  increasedPrice?: BigNumber;
  decreasedPrice: BigNumber;
};
