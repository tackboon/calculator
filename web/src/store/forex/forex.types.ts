export enum FOREX_ACTION_TYPES {
  GET_CURRENCY_RATE = "forex/get_currency_rate",
  GET_CURRENCY_RATE_FINISHED = "forex/get_currency_rate_finished",
  GET_COMMODITY_RATE = "forex/get_commodity_rate",
  GET_COMMODITY_RATE_FINISHED = "forex/get_commodity_rate_finished",
}

export enum FOREX_LOADING_TYPES {
  GET_CURRENCY_RATE = "loading/get_currency_rate",
  GET_COMMODITY_RATE = "loading/get_commodity_rate",
}

export type CurrencyRateData = {
  base: string;
  rates: {
    [key: string]: number;
  };
};

export type CommodityRateData = {
  name: string;
  price: number;
  symbol: string;
  updatedAt: number;
};

export type CurrencyInfo = {
  currency: string;
  currency_name: string;
  country_code: string;
};

export type SupportedCurrency = {
  [key: string]: CurrencyInfo;
};

export const supportedCurrencies = {
  AUD: {
    currency: "AUD",
    currency_name: "Australian Dollar",
    country_code: "AU",
  },
  CAD: {
    currency: "CAD",
    currency_name: "Canadian Dollar",
    country_code: "CA",
  },
  CHF: {
    currency: "CHF",
    currency_name: "Swiss Franc",
    country_code: "CH",
  },
  EUR: {
    currency: "EUR",
    currency_name: "Euro",
    country_code: "EU",
  },
  GBP: {
    currency: "GBP",
    currency_name: "British Pound",
    country_code: "GB",
  },
  HKD: {
    currency: "HKD",
    currency_name: "Hong Kong Dollar",
    country_code: "HK",
  },
  JPY: {
    currency: "JPY",
    currency_name: "Japanese Yen",
    country_code: "JP",
  },
  NZD: {
    currency: "NZD",
    currency_name: "New Zealand Dollar",
    country_code: "NZ",
  },
  SGD: {
    currency: "SGD",
    currency_name: "Singapore Dollar",
    country_code: "SG",
  },
  USD: {
    currency: "USD",
    currency_name: "United States Dollar",
    country_code: "US",
  },
};

export type AssetInfo = {
  pip: number;
  lot: string;
};

export type SupportedAsset = {
  [key: string]: AssetInfo;
};

export const supportedAssets: SupportedAsset = {
  "AUD/CAD": { pip: 0.0001, lot: "100,000" },
  "AUD/CHF": { pip: 0.0001, lot: "100,000" },
  "AUD/JPY": { pip: 0.01, lot: "100,000" },
  "AUD/NZD": { pip: 0.0001, lot: "100,000" },
  "AUD/SGD": { pip: 0.0001, lot: "100,000" },
  "AUD/USD": { pip: 0.0001, lot: "100,000" },
  "CAD/CHF": { pip: 0.0001, lot: "100,000" },
  "CAD/JPY": { pip: 0.01, lot: "100,000" },
  "CHF/JPY": { pip: 0.01, lot: "100,000" },
  "CHF/SGD": { pip: 0.0001, lot: "100,000" },
  "EUR/AUD": { pip: 0.0001, lot: "100,000" },
  "EUR/CAD": { pip: 0.0001, lot: "100,000" },
  "EUR/CHF": { pip: 0.0001, lot: "100,000" },
  "EUR/DKK": { pip: 0.0001, lot: "100,000" },
  "EUR/GBP": { pip: 0.0001, lot: "100,000" },
  "EUR/HKD": { pip: 0.0001, lot: "100,000" },
  "EUR/JPY": { pip: 0.01, lot: "100,000" },
  "EUR/NOK": { pip: 0.0001, lot: "100,000" },
  "EUR/NZD": { pip: 0.0001, lot: "100,000" },
  "EUR/PLN": { pip: 0.0001, lot: "100,000" },
  "EUR/SEK": { pip: 0.0001, lot: "100,000" },
  "EUR/SGD": { pip: 0.0001, lot: "100,000" },
  "EUR/TRY": { pip: 0.0001, lot: "100,000" },
  "EUR/USD": { pip: 0.0001, lot: "100,000" },
  "EUR/ZAR": { pip: 0.0001, lot: "100,000" },
  "GBP/AUD": { pip: 0.0001, lot: "100,000" },
  "GBP/CAD": { pip: 0.0001, lot: "100,000" },
  "GBP/CHF": { pip: 0.0001, lot: "100,000" },
  "GBP/DKK": { pip: 0.0001, lot: "100,000" },
  "GBP/JPY": { pip: 0.01, lot: "100,000" },
  "GBP/NOK": { pip: 0.0001, lot: "100,000" },
  "GBP/NZD": { pip: 0.0001, lot: "100,000" },
  "GBP/SEK": { pip: 0.0001, lot: "100,000" },
  "GBP/SGD": { pip: 0.0001, lot: "100,000" },
  "GBP/TRY": { pip: 0.0001, lot: "100,000" },
  "GBP/USD": { pip: 0.0001, lot: "100,000" },
  "NOK/JPY": { pip: 0.01, lot: "100,000" },
  "NOK/SEK": { pip: 0.0001, lot: "100,000" },
  "NZD/CAD": { pip: 0.0001, lot: "100,000" },
  "NZD/CHF": { pip: 0.0001, lot: "100,000" },
  "NZD/JPY": { pip: 0.01, lot: "100,000" },
  "NZD/USD": { pip: 0.0001, lot: "100,000" },
  "SEK/JPY": { pip: 0.01, lot: "100,000" },
  "SGD/JPY": { pip: 0.01, lot: "100,000" },
  "USD/CAD": { pip: 0.0001, lot: "100,000" },
  "USD/CHF": { pip: 0.0001, lot: "100,000" },
  "USD/CNH": { pip: 0.0001, lot: "100,000" },
  "USD/CZK": { pip: 0.001, lot: "100,000" },
  "USD/DKK": { pip: 0.0001, lot: "100,000" },
  "USD/HKD": { pip: 0.0001, lot: "100,000" },
  "USD/HUF": { pip: 0.01, lot: "100,000" },
  "USD/JPY": { pip: 0.01, lot: "100,000" },
  "USD/MXN": { pip: 0.0001, lot: "100,000" },
  "USD/NOK": { pip: 0.0001, lot: "100,000" },
  "USD/PLN": { pip: 0.0001, lot: "100,000" },
  "USD/SEK": { pip: 0.0001, lot: "100,000" },
  "USD/SGD": { pip: 0.0001, lot: "100,000" },
  "USD/THB": { pip: 0.0001, lot: "100,000" },
  "USD/TRY": { pip: 0.0001, lot: "100,000" },
  "USD/ZAR": { pip: 0.0001, lot: "100,000" },
  "XAG/AUD": { pip: 0.01, lot: "1,000" },
  "XAG/EUR": { pip: 0.01, lot: "1,000" },
  "XAG/USD": { pip: 0.01, lot: "1,000" },
  "XAU/AUD": { pip: 0.1, lot: "100" },
  "XAU/CHF": { pip: 0.1, lot: "100" },
  "XAU/EUR": { pip: 0.1, lot: "100" },
  "XAU/GBP": { pip: 0.1, lot: "100" },
  "XAU/JPY": { pip: 10, lot: "100" },
  "XAU/USD": { pip: 0.1, lot: "100" },
  "XPD/USD": { pip: 0.1, lot: "100" },
  "XPT/USD": { pip: 0.1, lot: "100" },
};

export type CurrencyRateMap = { [key: string]: CurrencyRateData } | null;

export type CommodityRateMap = { [key: string]: CommodityRateData } | null;
