import { AxiosResponse } from "axios";
import { all, call, put, takeLeading } from "typed-redux-saga";

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
import { BaseResponse } from "../../openapi";
import { api } from "../../service/openapi";
import { CustomError } from "../../common/error/error";

function* getCurrencyRates({ payload: { bases } }: GetCurrencyRates) {
  const res: AxiosResponse<BaseResponse> = yield call(
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
    const res: { rates: CurrencyRateData[] } | null = yield call(
      getCurrencyRates,
      action
    );
    const data = res ? res.rates : null;

    yield put(getCurrencyRatesFinished(data));
  } catch (e) {
    console.error("Failed to get currency rates, err: " + e);
    yield put(getCurrencyRatesFinished(null));
  }
}

function* getCommodityRates({ payload: { symbols } }: GetCommodityRates) {
  const res: AxiosResponse<BaseResponse> = yield call(
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
    const res: { prices: CommodityRateData[] } | null = yield call(
      getCommodityRates,
      action
    );
    const data = res ? res.prices : null;

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
