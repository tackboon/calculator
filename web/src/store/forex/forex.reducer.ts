import { UnknownAction } from "@reduxjs/toolkit";
import { initStateObj } from "../../common/redux/reducer";
import {
  CommodityRateMap,
  CurrencyRateMap,
  FOREX_LOADING_TYPES,
  SupportedAsset,
  supportedAssets,
  supportedCurrencies,
  SupportedCurrency,
} from "./forex.types";
import {
  getCommodityRates,
  getCommodityRatesFinished,
  getCurrencyRates,
  getCurrencyRatesFinished,
} from "./forex.action";

export type ForexState = {
  readonly isLoading: { [key: string]: boolean };
  readonly currencyRateData: CurrencyRateMap;
  readonly commodityRateData: CommodityRateMap;
  readonly supportedCurrencies: SupportedCurrency;
  readonly supportedAssets: SupportedAsset;
};

const INITIAL_STATE: ForexState = {
  isLoading: initStateObj(FOREX_LOADING_TYPES, false),
  currencyRateData: {},
  commodityRateData: {},
  supportedCurrencies: supportedCurrencies,
  supportedAssets: supportedAssets,
};

export const forexReducer = (
  state = INITIAL_STATE,
  action: UnknownAction
): ForexState => {
  if (getCurrencyRates.match(action)) {
    return {
      ...state,
      isLoading: {
        ...state.isLoading,
        [FOREX_LOADING_TYPES.GET_CURRENCY_RATE]: true,
      },
    };
  }

  if (getCurrencyRatesFinished.match(action)) {
    const currencyRateData = { ...state.currencyRateData };
    if (action.payload.datas) {
      for (let i = 0; i < action.payload.datas.length; i++) {
        const data = action.payload.datas[i];
        currencyRateData[data.base] = data;
      }
    }

    return {
      ...state,
      isLoading: {
        ...state.isLoading,
        [FOREX_LOADING_TYPES.GET_CURRENCY_RATE]: false,
      },
      currencyRateData,
    };
  }

  if (getCommodityRates.match(action)) {
    return {
      ...state,
      isLoading: {
        ...state.isLoading,
        [FOREX_LOADING_TYPES.GET_COMMODITY_RATE]: true,
      },
    };
  }

  if (getCommodityRatesFinished.match(action)) {
    const commodityRateData = { ...state.commodityRateData };
    if (action.payload.datas) {
      for (let i = 0; i < action.payload.datas.length; i++) {
        const data = action.payload.datas[i];
        commodityRateData[data.symbol] = data;
      }
    }

    return {
      ...state,
      isLoading: {
        ...state.isLoading,
        [FOREX_LOADING_TYPES.GET_COMMODITY_RATE]: false,
      },
      commodityRateData,
    };
  }

  return state;
};
