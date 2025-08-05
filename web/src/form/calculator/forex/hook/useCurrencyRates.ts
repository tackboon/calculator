import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { getCurrencyRates } from "../../../../store/forex/forex.action";

const useCurrencyRates = (accBaseCurrency: string) => {
  const prevCurrency = useRef("");
  const dispatch = useDispatch();

  useEffect(() => {
    if (prevCurrency.current !== accBaseCurrency) {
      prevCurrency.current = accBaseCurrency;
      const bases =
        accBaseCurrency === "USD" ? ["USD"] : ["USD", accBaseCurrency];

      dispatch(getCurrencyRates(bases));
    }
  }, [accBaseCurrency, dispatch]);

  return prevCurrency.current;
};

export default useCurrencyRates;
