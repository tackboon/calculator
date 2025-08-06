import { BigNumber } from "mathjs";
import { getBaseAndQuote } from "../../../../common/forex/forex";
import { mathBigNum } from "../../../../common/number/math";
import {
  convertToLocaleString,
  parseBigNumberFromString,
  parseNumberFromString,
} from "../../../../common/number/number";
import { checkMinMax } from "../../../../common/validation/calculator.validation";
import {
  ERROR_FIELD_POSITION_SIZE,
  FeeTyp,
  ForexPositionSizeInputType,
  PositionSizeResultType,
  ProfitGoalTyp,
  StopLossTyp,
} from "./position_size.type";

export const calculateCrossHeight = (input: ForexPositionSizeInputType) => {
  if (input.quotePair === "") return 0;
  let height = 100;

  if (input.basePair !== "") height = height + 55;

  if (
    input.usdAccPair !== "" &&
    ((input.includeTradingFee && input.feeTyp === FeeTyp.COMMISSION_PER_100K) ||
      input.usdBasePair !== "")
  ) {
    height = height + 55;
  }

  if (
    input.usdQuotePair !== "" &&
    input.includeTradingFee &&
    input.feeTyp === FeeTyp.COMMISSION_PER_100K
  ) {
    height = height + 55;
  }

  if (input.usdBasePair !== "") height = height + 55;

  return height;
};

export const calculateStopPriceFromPip = (
  input: ForexPositionSizeInputType
) => {
  try {
    if (input.stopLossTyp !== StopLossTyp.PIP_BASED) return "";

    const openPrice = parseBigNumberFromString(input.openPrice);
    if (mathBigNum.equal(openPrice, 0)) return "0.00";

    const pip = parseBigNumberFromString(input.stopLoss);
    if (mathBigNum.equal(pip, 0)) return input.openPrice;

    if (input.isLong) {
      let stopPrice = mathBigNum.subtract(
        openPrice,
        mathBigNum.multiply(pip, input.pipSize)
      ) as BigNumber;
      stopPrice = mathBigNum.round(stopPrice, 5);

      return `${stopPrice}`;
    } else {
      let stopPrice = mathBigNum.add(
        openPrice,
        mathBigNum.multiply(pip, input.pipSize)
      ) as BigNumber;
      stopPrice = mathBigNum.round(stopPrice, 5);

      return `${stopPrice}`;
    }
  } catch (err) {
    return "";
  }
};

export const calculateProfitPriceFromPip = (
  input: ForexPositionSizeInputType
) => {
  try {
    if (input.profitGoalTyp !== ProfitGoalTyp.PIP_BASED) return "";

    const openPrice = parseBigNumberFromString(input.openPrice);
    if (mathBigNum.equal(openPrice, 0)) return "0";

    const pip = parseBigNumberFromString(input.profitGoal);
    if (mathBigNum.equal(pip, 0)) return input.openPrice;

    if (input.isLong) {
      let profitPrice = mathBigNum.add(
        openPrice,
        mathBigNum.multiply(pip, input.pipSize)
      ) as BigNumber;
      profitPrice = mathBigNum.round(profitPrice, 5);

      return `${profitPrice}`;
    } else {
      let profitPrice = mathBigNum.subtract(
        openPrice,
        mathBigNum.multiply(pip, input.pipSize)
      ) as BigNumber;
      profitPrice = mathBigNum.round(profitPrice, 5);

      return `${profitPrice}`;
    }
  } catch (err) {
    return "";
  }
};

export const validatePositionSizeInput = (
  input: ForexPositionSizeInputType
): { err: string; field: ERROR_FIELD_POSITION_SIZE | null } => {
  if (!checkMinMax(input.portfolioCapital, 0)) {
    return {
      err: "Please enter a valid portfolio capital.",
      field: ERROR_FIELD_POSITION_SIZE.PORTFOLIO_CAPITAL,
    };
  }

  if (!checkMinMax(input.maxPortfolioRisk, 0, 100)) {
    return {
      err: "Please enter a valid max portflio risk.",
      field: ERROR_FIELD_POSITION_SIZE.MAX_PORTFOLIO_RISK,
    };
  }

  if (input.usdAccPair !== "" && !checkMinMax(input.usdAccCrossRate, 0)) {
    return {
      err: "Please enter a valid cross rate.",
      field: ERROR_FIELD_POSITION_SIZE.USD_ACC_CROSS_RATE,
    };
  }

  if (input.usdBasePair !== "" && !checkMinMax(input.usdBaseCrossRate, 0)) {
    return {
      err: "Please enter a valid cross rate.",
      field: ERROR_FIELD_POSITION_SIZE.USD_BASE_CROSS_RATE,
    };
  }

  if (input.usdQuotePair !== "" && !checkMinMax(input.usdQuoteCrossRate, 0)) {
    return {
      err: "Please enter a valid cross rate.",
      field: ERROR_FIELD_POSITION_SIZE.USD_QUOTE_CROSS_RATE,
    };
  }

  if (input.basePair !== "" && !checkMinMax(input.baseCrossRate, 0)) {
    return {
      err: "Please enter a valid cross rate.",
      field: ERROR_FIELD_POSITION_SIZE.BASE_CROSS_RATE,
    };
  }

  if (input.quotePair !== "" && !checkMinMax(input.quoteCrossRate, 0)) {
    return {
      err: "Please enter a valid cross rate.",
      field: ERROR_FIELD_POSITION_SIZE.QUOTE_CROSS_RATE,
    };
  }

  if (!checkMinMax(input.contractSize, 0)) {
    return {
      err: "Please enter a valid contract size.",
      field: ERROR_FIELD_POSITION_SIZE.CONTRACT_SIZE,
    };
  }

  if (!checkMinMax(input.openPrice, 0)) {
    return {
      err: "Please enter a valid open price.",
      field: ERROR_FIELD_POSITION_SIZE.OPEN_PRICE,
    };
  }

  let stopLossMin = mathBigNum.bignumber(0);
  let stopLossMax: BigNumber | undefined;
  if (input.isLong) {
    stopLossMax = parseBigNumberFromString(input.openPrice);
  } else {
    stopLossMin = parseBigNumberFromString(input.openPrice);
  }

  let stopLoss = input.stopLoss;
  if (input.stopLossTyp === StopLossTyp.PIP_BASED) {
    stopLoss = calculateStopPriceFromPip(input);
  }

  if (!checkMinMax(stopLoss, stopLossMin, stopLossMax)) {
    return {
      err: "Please enter a valid stop loss.",
      field: ERROR_FIELD_POSITION_SIZE.STOP_LOSS,
    };
  }

  if (input.includeProfitGoal) {
    let profitGoalMin = mathBigNum.bignumber(0);
    let profitGoalMax: BigNumber | undefined;
    if (input.profitGoalTyp === ProfitGoalTyp.PORTFOLIO_BASED) {
      if (!checkMinMax(input.profitGoal, profitGoalMin)) {
        return {
          err: "Please enter a valid min portfolio profit.",
          field: ERROR_FIELD_POSITION_SIZE.PROFIT_TARGET,
        };
      }
    } else {
      if (input.isLong) {
        profitGoalMin = parseBigNumberFromString(input.openPrice);
      } else {
        profitGoalMax = parseBigNumberFromString(input.openPrice);
      }

      let profitGoal = input.profitGoal;
      if (input.profitGoalTyp === ProfitGoalTyp.PIP_BASED) {
        profitGoal = calculateProfitPriceFromPip(input);
      }

      if (!checkMinMax(profitGoal, profitGoalMin, profitGoalMax)) {
        return {
          err: "Please enter a valid profit target.",
          field: ERROR_FIELD_POSITION_SIZE.PROFIT_TARGET,
        };
      }
    }
  }

  if (input.includeTradingFee) {
    if (!checkMinMax(input.estTradingFee, 0)) {
      return {
        err: "Please estimates a valid trading fee.",
        field: ERROR_FIELD_POSITION_SIZE.EST_TRADING_FEE,
      };
    }
  }

  return { err: "", field: null };
};

export const calculateResult = (
  input: ForexPositionSizeInputType
  // ): PositionSizeResultType => {
) => {
  // Parse inputs
  const portfolioCapital = parseBigNumberFromString(input.portfolioCapital);
  const maxPortfolioRiskPercent = parseNumberFromString(input.maxPortfolioRisk);
  const maxPortfolioRiskRate = maxPortfolioRiskPercent / 100;
  const openPrice = parseBigNumberFromString(input.openPrice);
  let stopLossStr = input.stopLoss;
  if (input.stopLossTyp === StopLossTyp.PIP_BASED) {
    stopLossStr = calculateStopPriceFromPip(input);
  }
  const stopLoss = parseBigNumberFromString(stopLossStr);
  let profitGoalStr = input.profitGoal;
  if (input.profitGoalTyp === ProfitGoalTyp.PIP_BASED) {
    profitGoalStr = calculateProfitPriceFromPip(input);
  }
  const profitGoal = parseBigNumberFromString(profitGoalStr);
  const contractSize = parseBigNumberFromString(input.contractSize);
  const commissionFee = parseBigNumberFromString(input.estTradingFee);
  const swapFee = parseBigNumberFromString(input.swapFee);

  // Get currency pair info
  const pairInfo = getBaseAndQuote(input.currencyPair);

  // Get base rate (XXXUSD)
  let baseRate = mathBigNum.bignumber(1);
  if (input.basePair === "") {
    if (pairInfo.quote === input.accBaseCurrency) {
      baseRate = input.isLong ? openPrice : stopLoss;
    }
  } else {
    const baseRateInfo = getBaseAndQuote(input.basePair);
    const baseCrossRate = parseBigNumberFromString(input.baseCrossRate);
    baseRate = baseCrossRate;
    if (baseRateInfo.base === input.accBaseCurrency) {
      baseRate = mathBigNum.divide(1, baseCrossRate) as BigNumber;
    }
  }

  // Get quote rate (XXXUSD)
  let quoteRate = mathBigNum.bignumber(1);
  if (input.quotePair === "") {
    if (pairInfo.base === input.accBaseCurrency) {
      quoteRate = mathBigNum.divide(1, stopLoss) as BigNumber;
    }
  } else {
    const quoteRateInfo = getBaseAndQuote(input.quotePair);
    const quoteCrossRate = parseBigNumberFromString(input.quoteCrossRate);
    quoteRate = quoteCrossRate;
    if (quoteRateInfo.base === input.accBaseCurrency) {
      quoteRate = mathBigNum.divide(1, quoteCrossRate) as BigNumber;
    }
  }

  // Get USD acc rate (USDXXX)
  let usdAccRate = mathBigNum.bignumber(1);
  if (input.usdAccPair !== "") {
    const usdAccRateInfo = getBaseAndQuote(input.usdAccPair);
    const usdAccCrossRate = parseBigNumberFromString(input.usdAccCrossRate);
    usdAccRate = usdAccCrossRate;
    if (usdAccRateInfo.quote === "USD") {
      usdAccRate = mathBigNum.divide(1, usdAccCrossRate) as BigNumber;
    }
  }

  // Get USD quote rate (XXXUSD)
  let usdQuoteRate = mathBigNum.bignumber(1);
  if (input.usdQuotePair !== "") {
    const usdQuoteRateInfo = getBaseAndQuote(input.usdQuotePair);
    const usdQuoteCrossRate = parseBigNumberFromString(input.usdQuoteCrossRate);
    usdQuoteRate = usdQuoteCrossRate;
    if (usdQuoteRateInfo.base === "USD") {
      usdQuoteRate = mathBigNum.divide(1, usdQuoteCrossRate) as BigNumber;
    }
  } else if (input.accBaseCurrency === "USD") {
    usdQuoteRate = quoteRate;
  }

  // Get USD base rate (XXXUSD)
  let usdBaseRate = mathBigNum.bignumber(1);
  if (input.usdBasePair !== "") {
    const usdBaseRateInfo = getBaseAndQuote(input.usdBasePair);
    const usdBaseCrossRate = parseBigNumberFromString(input.usdBaseCrossRate);
    usdBaseRate = usdBaseCrossRate;
    if (usdBaseRateInfo.base === "USD") {
      usdBaseRate = mathBigNum.divide(1, usdBaseCrossRate) as BigNumber;
    }
  }

  /*
  Handle calculation
  */

  // Calculate max loss
  // maxLoss = portfolioCapital * maxPortfolioRiskRate
  const maxLoss = mathBigNum.multiply(
    portfolioCapital,
    maxPortfolioRiskRate
  ) as BigNumber;

  // priceDiff = Math.abs(stopLoss - openPrice)
  const priceDiff = mathBigNum.abs(mathBigNum.subtract(stopLoss, openPrice));

  // Calculate lot size
  let lotSize = mathBigNum.bignumber(0);
  let riskAmount = mathBigNum.bignumber(0);
  let entryFeeStr: string | undefined;
  let stopFeeStr: string | undefined;
  if (!input.includeTradingFee) {
    lotSize = calcLotSize(maxLoss, contractSize, quoteRate, priceDiff);

    // riskAmount = lotSize * contractSize * priceDiff * quoteRate
    riskAmount = mathBigNum.multiply(
      mathBigNum.multiply(
        mathBigNum.multiply(lotSize, contractSize),
        priceDiff
      ),
      quoteRate
    ) as BigNumber;
  } else {
    // swapFeeInAccBase = swapFee * quoteRate
    let swapFeeInAccBase = mathBigNum.multiply(swapFee, quoteRate) as BigNumber;
    swapFeeInAccBase = mathBigNum.round(swapFeeInAccBase, 5);

    if (input.feeTyp === FeeTyp.COMMISSION_PER_LOT) {
      lotSize = calcLotSizeWithLotBasedCommission(
        maxLoss,
        contractSize,
        quoteRate,
        priceDiff,
        swapFeeInAccBase,
        commissionFee
      );

      // fee = lotSize * commissionFee
      let fee = mathBigNum.multiply(lotSize, commissionFee);

      // riskAmount = lotSize * contractSize * priceDiff * quoteRate + swapFeeInAccBase + fee * 2
      riskAmount = mathBigNum.add(
        mathBigNum.add(
          mathBigNum.multiply(
            mathBigNum.multiply(
              mathBigNum.multiply(lotSize, contractSize),
              priceDiff
            ),
            quoteRate
          ),
          mathBigNum.multiply(fee, 2)
        ),
        swapFeeInAccBase
      ) as BigNumber;

      // Adjust lot size
      while (
        mathBigNum.larger(riskAmount, maxLoss) &&
        mathBigNum.larger(lotSize, 0)
      ) {
        lotSize = mathBigNum.subtract(lotSize, 0.01) as BigNumber;
        fee = mathBigNum.multiply(lotSize, commissionFee);
        riskAmount = mathBigNum.add(
          mathBigNum.add(
            mathBigNum.multiply(
              mathBigNum.multiply(lotSize, contractSize),
              priceDiff
            ),
            mathBigNum.multiply(fee, 2)
          ),
          swapFeeInAccBase
        ) as BigNumber;
      }

      entryFeeStr = convertToLocaleString(fee.toString(), 2, 5);
      stopFeeStr = entryFeeStr;
    } else {
      const commissionFeeRate = mathBigNum.divide(
        commissionFee,
        100000
      ) as BigNumber;

      lotSize = calcLotSizeWithUSDBasedCommission(
        maxLoss,
        contractSize,
        openPrice,
        stopLoss,
        quoteRate,
        usdQuoteRate,
        usdAccRate,
        swapFeeInAccBase,
        commissionFeeRate
      );

      // fee = openPrice * lotSize * contractSize * usdQuoteRate * commissionFeeRate * usdAccRate
      let feeRate = mathBigNum.multiply(
        mathBigNum.multiply(
          mathBigNum.multiply(
            mathBigNum.multiply(lotSize, contractSize),
            usdQuoteRate
          ),
          commissionFeeRate
        ),
        usdAccRate
      ) as BigNumber;
      let entryFee = mathBigNum.multiply(openPrice, feeRate) as BigNumber;
      entryFee = mathBigNum.round(entryFee, 5);
      let stopFee = mathBigNum.multiply(stopLoss, feeRate) as BigNumber;
      stopFee = mathBigNum.round(stopFee, 5);
      console.log();
      /* 
      riskAmount = lotSize * contractSize * priceDiff * quoteRate + swapFeeInAccBase 
        + entryFee + stopFee
      */
      riskAmount = mathBigNum.add(
        mathBigNum.add(
          mathBigNum.add(
            mathBigNum.multiply(
              mathBigNum.multiply(
                mathBigNum.multiply(lotSize, contractSize),
                priceDiff
              ),
              quoteRate
            ),
            swapFeeInAccBase
          ),
          entryFee
        ),
        stopFee
      ) as BigNumber;

      while (
        mathBigNum.larger(lotSize, 0) &&
        mathBigNum.larger(riskAmount, maxLoss)
      ) {
        lotSize = mathBigNum.subtract(lotSize, 0.01) as BigNumber;

        // Recompute fees
        feeRate = mathBigNum.multiply(
          mathBigNum.multiply(
            mathBigNum.multiply(
              mathBigNum.multiply(lotSize, contractSize),
              usdQuoteRate
            ),
            commissionFeeRate
          ),
          usdAccRate
        ) as BigNumber;
        entryFee = mathBigNum.multiply(openPrice, feeRate) as BigNumber;
        entryFee = mathBigNum.round(entryFee, 5);
        stopFee = mathBigNum.multiply(stopLoss, feeRate) as BigNumber;
        stopFee = mathBigNum.round(stopFee, 5);

        // Recompute risk amount
        riskAmount = mathBigNum.add(
          mathBigNum.add(
            mathBigNum.add(
              mathBigNum.multiply(
                mathBigNum.multiply(
                  mathBigNum.multiply(lotSize, contractSize),
                  priceDiff
                ),
                quoteRate
              ),
              swapFeeInAccBase
            ),
            entryFee
          ),
          stopFee
        ) as BigNumber;
      }

      entryFeeStr = convertToLocaleString(entryFee.toString(), 2, 5);
      stopFeeStr = convertToLocaleString(stopFee.toString(), 2, 5);
    }
  }

  console.log(lotSize.toString(), entryFeeStr, stopFeeStr);
};

const calcLotSize = (
  maxLoss: BigNumber,
  contractSize: BigNumber,
  quoteRate: BigNumber,
  priceDiff: BigNumber
) => {
  /* 
    maxLoss = priceDiff * lotSize * contractSize * quoteRate
    lotSize = maxLoss / (priceDiff * quoteRate * contractSize)
  */
  const diff = mathBigNum.multiply(
    mathBigNum.multiply(priceDiff, quoteRate),
    contractSize
  ) as BigNumber;

  let lotSize = mathBigNum.bignumber(0);
  if (!mathBigNum.equal(diff, 0)) {
    lotSize = mathBigNum.divide(maxLoss, diff) as BigNumber;
    lotSize = mathBigNum.floor(lotSize, 2);
  }

  return lotSize;
};

const calcLotSizeWithLotBasedCommission = (
  maxLoss: BigNumber,
  contractSize: BigNumber,
  quoteRate: BigNumber,
  priceDiff: BigNumber,
  swapFeeInAccBase: BigNumber,
  commissionFee: BigNumber
) => {
  /* 
    maxLoss = 
      priceDiff * lotSize * contractSize * quoteRate 
      - swapFeeInAccBase
      + lotSize * commissionFee * 2

    lotSize = 
      (maxLoss + swapFeeInAccBase) /
      ((priceDiff * contractSize * quoteRate) + commissionFee * 2)
  */
  const diff = mathBigNum.multiply(
    mathBigNum.multiply(priceDiff, contractSize),
    quoteRate
  ) as BigNumber;

  let lotSize = mathBigNum.bignumber(0);
  if (!mathBigNum.equal(diff, 0)) {
    lotSize = mathBigNum.divide(
      mathBigNum.add(maxLoss, swapFeeInAccBase),
      mathBigNum.add(diff, mathBigNum.multiply(commissionFee, 2))
    ) as BigNumber;
    lotSize = mathBigNum.floor(lotSize, 2);
  }

  return lotSize;
};

const calcLotSizeWithUSDBasedCommission = (
  maxLoss: BigNumber,
  contractSize: BigNumber,
  openPrice: BigNumber,
  stopLoss: BigNumber,
  quoteRate: BigNumber,
  usdQuoteRate: BigNumber,
  usdAccRate: BigNumber,
  swapFeeInAccBase: BigNumber,
  commissionFeeRate: BigNumber
) => {
  /*
    maxLoss = 
      Math.abs(stopLoss - openPrice) * lotSize * contractSize * quoteRate
      - swapFeeInAccBase 
      + (openPrice + stopLoss) * lotSize * contractSize * usdQuoteRate *
        commissionFeeRate * usdAccRate

    lotSize = (maxLoss + swapFeeInAccBase) /
      ((Math.abs(stopLoss - openPrice) * contractSize * quoteRate) + 
      (openPrice + stopLoss) * contractSize * usdQuoteRate * commissionFeeRate * usdAccRate
  */

  const diff = mathBigNum.multiply(
    mathBigNum.multiply(
      mathBigNum.abs(mathBigNum.subtract(stopLoss, openPrice)),
      contractSize
    ),
    quoteRate
  );

  let lotSize = mathBigNum.bignumber(0);
  if (!mathBigNum.equal(diff, 0)) {
    lotSize = mathBigNum.divide(
      mathBigNum.add(maxLoss, swapFeeInAccBase),
      mathBigNum.add(
        diff,
        mathBigNum.multiply(
          mathBigNum.multiply(
            mathBigNum.multiply(
              mathBigNum.multiply(
                mathBigNum.add(openPrice, stopLoss),
                contractSize
              ),
              usdQuoteRate
            ),
            commissionFeeRate
          ),
          usdAccRate
        )
      )
    ) as BigNumber;
    lotSize = mathBigNum.round(lotSize, 2);
  }

  return lotSize;
};
