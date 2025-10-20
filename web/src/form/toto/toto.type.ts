import { BigNumber, number } from "mathjs";

export type TotoInputType = {
  price: string;
  percentage: string;
};

export enum ERROR_FIELD_TOTO {
  PRICE,
  PERCENTAGE,
}

export type TotoResultType = {
  numbers: number[];
};
