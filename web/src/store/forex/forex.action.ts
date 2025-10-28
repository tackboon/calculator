import {
  ActionWithPayload,
  createActionWithPayload,
  withMatcher,
} from "../../common/redux/action";
import {
  CommodityRateData,
  CurrencyRateData,
  FOREX_ACTION_TYPES,
} from "./forex.types";

// Handle get currency rates
export type GetCurrencyRates = ActionWithPayload<
  FOREX_ACTION_TYPES.GET_CURRENCY_RATE,
  { bases: string[] }
>;
export const getCurrencyRates = withMatcher(
  (bases: string[]): GetCurrencyRates =>
    createActionWithPayload(FOREX_ACTION_TYPES.GET_CURRENCY_RATE, { bases })
);

// Handle get currency rates finished
export type GetCurrencyRatesFinished = ActionWithPayload<
  FOREX_ACTION_TYPES.GET_CURRENCY_RATE_FINISHED,
  { datas: CurrencyRateData[] | null }
>;
export const getCurrencyRatesFinished = withMatcher(
  (datas: CurrencyRateData[] | null): GetCurrencyRatesFinished =>
    createActionWithPayload(FOREX_ACTION_TYPES.GET_CURRENCY_RATE_FINISHED, {
      datas,
    })
);

// Handle get commodity rates
export type GetCommodityRates = ActionWithPayload<
  FOREX_ACTION_TYPES.GET_COMMODITY_RATE,
  { symbols: string[] }
>;
export const getCommodityRates = withMatcher(
  (symbols: string[]): GetCommodityRates =>
    createActionWithPayload(FOREX_ACTION_TYPES.GET_COMMODITY_RATE, { symbols })
);

// Handle get commodity rates finished
export type GetCommodityRatesFinished = ActionWithPayload<
  FOREX_ACTION_TYPES.GET_COMMODITY_RATE_FINISHED,
  { datas: CommodityRateData[] | null }
>;
export const getCommodityRatesFinished = withMatcher(
  (datas: CommodityRateData[] | null): GetCommodityRatesFinished =>
    createActionWithPayload(FOREX_ACTION_TYPES.GET_COMMODITY_RATE_FINISHED, {
      datas,
    })
);
