import { useEffect } from "react";
import {
  generateCurrencyPair,
  getBaseAndQuote,
} from "../../../../common/forex/forex";
import { FeeTyp } from "../forex_calculator_form.type";
import { useSelector } from "react-redux";
import {
  selectForexCommodityRates,
  selectForexCurrencyRates,
  selectForexSupportedAssets,
} from "../../../../store/forex/forex.selector";
import { divideBig, multiplyBig } from "../../../../common/number/math";
import { convertToLocaleString } from "../../../../common/number/number";

const useCrossPairs = (
  accBaseCurrency: string,
  currencyPair: string,
  includeTradingFee: boolean,
  feeTyp: FeeTyp,
  setCrossPairs: (pairs: {
    basePair: string;
    baseRate: string;
    baseStep: number;
    quotePair: string;
    quoteRate: string;
    quoteStep: number;
  }) => void
) => {
  const supportedAssets = useSelector(selectForexSupportedAssets);
  const currencyRates = useSelector(selectForexCurrencyRates);
  const commodityRates = useSelector(selectForexCommodityRates);

  useEffect(() => {
    const { base, quote, isCommodity } = getBaseAndQuote(currencyPair);
    const out = {
      basePair: "",
      baseRate: "1.00",
      baseStep: 0.0001,
      quotePair: "",
      quoteRate: "1.00",
      quoteStep: 0.0001,
    };

    if (base === accBaseCurrency || quote === accBaseCurrency) {
      setCrossPairs(out);
      return;
    }

    if (includeTradingFee && feeTyp === FeeTyp.COMMISSION_PER_100K) {
      let tempBasePair = generateCurrencyPair(accBaseCurrency, base);
      if (Object.hasOwn(supportedAssets, tempBasePair)) {
        out.basePair = tempBasePair;
      } else {
        tempBasePair = generateCurrencyPair(base, accBaseCurrency);
        out.basePair = tempBasePair;
      }

      if (Object.hasOwn(supportedAssets, out.basePair)) {
        out.baseStep = supportedAssets[out.basePair].pip;
      } else if (isCommodity) {
        out.baseStep = 0.01;
      }

      if (currencyRates) {
        if (isCommodity) {
          if (commodityRates && Object.hasOwn(commodityRates, base)) {
            let tempCommodityRate = commodityRates[base].price;
            if (accBaseCurrency === "USD") {
              out.baseRate = convertToLocaleString(tempCommodityRate, 2, 5);
            } else {
              let tempRate = currencyRates["USD"].rates[accBaseCurrency];
              out.baseRate = convertToLocaleString(
                multiplyBig(tempCommodityRate, tempRate),
                2,
                5
              );
            }
          }
        } else if (Object.hasOwn(currencyRates, accBaseCurrency)) {
          let tempBaseRate = currencyRates[accBaseCurrency].rates[base];
          const basePairInfo = getBaseAndQuote(out.basePair);
          if (basePairInfo.base === accBaseCurrency) {
            out.baseRate = convertToLocaleString(tempBaseRate, 2, 5);
          } else {
            out.baseRate = convertToLocaleString(
              divideBig(1, tempBaseRate),
              2,
              5
            );
          }
        }
      }
    }

    let tempQuotePair = generateCurrencyPair(accBaseCurrency, quote);
    if (Object.hasOwn(supportedAssets, tempQuotePair)) {
      out.quotePair = tempQuotePair;
    } else {
      tempQuotePair = generateCurrencyPair(quote, accBaseCurrency);
      out.quotePair = tempQuotePair;
    }

    if (Object.hasOwn(supportedAssets, out.quotePair)) {
      out.quoteStep = supportedAssets[out.quotePair].pip;
    }

    if (currencyRates && Object.hasOwn(currencyRates, accBaseCurrency)) {
      let tempQuoteRate = currencyRates[accBaseCurrency].rates[quote];
      const quotePairInfo = getBaseAndQuote(out.quotePair);
      if (quotePairInfo.base === accBaseCurrency) {
        out.quoteRate = convertToLocaleString(tempQuoteRate, 2, 5);
      } else {
        out.quoteRate = convertToLocaleString(
          divideBig(1, tempQuoteRate),
          2,
          5
        );
      }
    }

    setCrossPairs(out);
  }, [
    accBaseCurrency,
    currencyPair,
    includeTradingFee,
    feeTyp,
    supportedAssets,
    currencyRates,
    commodityRates,
    setCrossPairs,
  ]);
};

export default useCrossPairs;
