import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getCommodityRates } from "../../../../store/forex/forex.action";

const useCommodityRates = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Get commodity rates
    const symbols = ["XAU", "XAG", "XPD", "XPT"];
    dispatch(getCommodityRates(symbols));
  }, [dispatch]);
};

export default useCommodityRates;
