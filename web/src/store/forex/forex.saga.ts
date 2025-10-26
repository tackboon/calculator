import { all, call, put, takeLeading, select } from "typed-redux-saga";

import {
  CommodityRateData,
  CurrencyRateData,
  FOREX_ACTION_TYPES,
} from "./forex.types";
import {
  GetCommodityRates,
  getCommodityRatesFinished,
  GetCurrencyRates,
  getCurrencyRatesFinished,
} from "./forex.action";
import { api } from "../../service/openapi";
import { CustomError } from "../../common/error/error";
import {
  selectForexCommodityRates,
  selectForexCurrencyRates,
} from "./forex.selector";

function* getCurrencyRates(bases: string[]) {
  if (bases.length === 0) return { rates: [] };

  const res = yield* call(
    [api.ForexAPI, api.ForexAPI.appApiV1ForexCurrenciesGet],
    bases
  );

  switch (res.data.code) {
    case 200:
      return res.data.data;
    default:
      throw new CustomError(
        "Something went wrong, please try again later.",
        res.data.code || 500
      );
  }
}

function* getCurrencyRatesFlow(action: GetCurrencyRates) {
  try {
    const now = Date.now();
    let newBases: string[] = [];
    const currencyState = yield* select(selectForexCurrencyRates);
    if (currencyState) {
      for (const base of action.payload.bases) {
        if (!Object.hasOwn(currencyState, base)) {
          newBases.push(base);
          continue;
        }

        const rate = currencyState[base];
        if (now - rate.requested_at > 600000) {
          newBases.push(base);
        }
      }
    } else {
      newBases = action.payload.bases;
    }

    const res: { rates: CurrencyRateData[] } | null = yield call(
      getCurrencyRates,
      newBases
    );

    const data = res
      ? res.rates.map((rate) => {
          rate.requested_at = now;
          return rate;
        })
      : null;

    yield put(getCurrencyRatesFinished(data));
  } catch (e) {
    console.error("Failed to get currency rates, err: " + e);
    yield put(getCurrencyRatesFinished(null));
  }
}

function* getCommodityRates(symbols: string[]) {
  if (symbols.length === 0) return { prices: [] };

  const res = yield* call(
    [api.ForexAPI, api.ForexAPI.appApiV1ForexCommoditiesGet],
    symbols
  );

  switch (res.data.code) {
    case 200:
      return res.data.data;
    default:
      throw new CustomError(
        "Something went wrong, please try again later.",
        res.data.code || 500
      );
  }
}

function* getCommodityRatesFlow(action: GetCommodityRates) {
  try {
    const now = Date.now();
    let newSymbols: string[] = [];
    const commodityState = yield* select(selectForexCommodityRates);
    if (commodityState) {
      for (const symbol of action.payload.symbols) {
        if (!Object.hasOwn(commodityState, symbol)) {
          newSymbols.push(symbol);
          continue;
        }

        const rate = commodityState[symbol];
        if (now - rate.requested_at > 600000) {
          newSymbols.push(symbol);
        }
      }
    } else {
      newSymbols = action.payload.symbols;
    }

    const res: { prices: CommodityRateData[] } | null = yield call(
      getCommodityRates,
      newSymbols
    );
    const data = res
      ? res.prices.map((price) => {
          price.requested_at = now;
          return price;
        })
      : null;

    yield put(getCommodityRatesFinished(data));
  } catch (e) {
    console.error("Failed to get commodity rates, err: " + e);
    yield put(getCommodityRatesFinished(null));
  }
}

function* onGetCurrencyRate() {
  yield takeLeading(FOREX_ACTION_TYPES.GET_CURRENCY_RATE, getCurrencyRatesFlow);
}

function* onGetCommodityRate() {
  yield takeLeading(
    FOREX_ACTION_TYPES.GET_COMMODITY_RATE,
    getCommodityRatesFlow
  );
}

export function* forexSagas() {
  yield all([call(onGetCurrencyRate), call(onGetCommodityRate)]);
}
