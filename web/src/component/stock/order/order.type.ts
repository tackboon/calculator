export type StockOrderInputType = {
  entryPrice: string;
  quantity: string;
  stopLoss: string;
  profitGoal: string;
  isLong: boolean;
  includeProfitGoal: boolean;
};

export enum ERROR_FIELD_STOCK_ORDER {
  ENTRY_PRICE,
  QUANTITY,
  STOP_LOSS,
  PROFIT_TARGET,
}

export type StockOrderType = {
  name: string;
  idx: number;
  onInputChange: (inputData: StockOrderInputType) => void;
  deleteHandler: () => void;
  errorField: ERROR_FIELD_STOCK_ORDER | null;
};
