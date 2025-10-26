import { createSelector } from "@reduxjs/toolkit";

import { RootState } from "../store";
import { ForexState } from "./forex.reducer";

export const selectForexReducer = (state: RootState): ForexState => state.forex;

export const selectForexSupportedAssets = createSelector(
  selectForexReducer,
  (forex) => forex.supportedAssets
);

export const selectForexSupportedCurrencies = createSelector(
  selectForexReducer,
  (forex) => forex.supportedCurrencies
);

export const selectForexCurrencyRates = createSelector(
  selectForexReducer,
  (forex) => forex.currencyRateData
);

export const selectForexIsLoading = createSelector(
  selectForexReducer,
  (forex) => forex.isLoading
);

export const selectForexCommodityRates = createSelector(
  selectForexReducer,
  (forex) => forex.commodityRateData
);
