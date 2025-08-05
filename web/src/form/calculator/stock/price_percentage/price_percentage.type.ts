export type PricePercentageInputType = {
  price: string;
  percentage: string;
};

export enum ERROR_FIELD_PRICE_PERCENTAGE {
  PRICE,
  PERCENTAGE,
}

export type PricePercentageResultType = {
  increasedPrice?: string;
  decreasedPrice?: string;
};
