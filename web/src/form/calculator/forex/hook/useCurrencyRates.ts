import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { getCurrencyRates } from "../../../../store/forex/forex.action";

const useCurrencyRates = (accBaseCurrency: string) => {
  const currCurrency = useRef("");
  const dispatch = useDispatch();

  useEffect(() => {
    if (currCurrency.current !== accBaseCurrency) {
      currCurrency.current = accBaseCurrency;
      const bases =
        accBaseCurrency === "USD" ? ["USD"] : ["USD", accBaseCurrency];

      dispatch(getCurrencyRates(bases));
    }
  }, [accBaseCurrency, dispatch]);

  return currCurrency.current;
};

export default useCurrencyRates;
