import { BigNumber } from "mathjs";
import { getBaseAndQuote } from "../../../../common/forex/forex";
import {
  absBig,
  addBig,
  divideBig,
  mathBigNum,
  multiplyBig,
  QUADRILLION,
  QUINTILLION,
  subtractBig,
} from "../../../../common/number/math";
import {
  parseBigNumberFromString,
  parseNumberFromString,
} from "../../../../common/number/number";
import {
  ERROR_FIELD_POSITION_SIZE,
  ForexPositionSizeInputType,
} from "./position_size.type";
import { FeeTyp, ProfitGoalTyp } from "../forex_calculator_form.type";
import {
  checkMinMax,
  CheckMinMaxOption,
} from "../../../../common/validation/calculator.validation";
import { LotTyp } from "../../../../component/forex/lot_typ_input_box/lot_typ.component";

export const calculateCrossHeight = (input: ForexPositionSizeInputType) => {
  if (input.basePair === "" && input.quotePair === "") return 0;
  if (input.basePair !== "" && input.quotePair !== "") return 220;
  return 135;
};

export const calculateProfitHeight = (input: ForexPositionSizeInputType) => {
  if (!input.includeProfitGoal) return 0;
  if (input.isProfitPip) return 240;
  return 200;
};

export const validatePositionSizeInput = (
  input: ForexPositionSizeInputType
): { err: string; field: ERROR_FIELD_POSITION_SIZE | null } => {
  if (
    !checkMinMax(input.portfolioCapital, { min: 0, maxOrEqual: QUINTILLION })
  ) {
    return {
      err: "Please enter a valid portfolio capital.",
      field: ERROR_FIELD_POSITION_SIZE.PORTFOLIO_CAPITAL,
    };
  }

  if (!checkMinMax(input.maxPortfolioRisk, { min: 0, max: 100 })) {
    return {
      err: "Please enter a valid max portflio risk.",
      field: ERROR_FIELD_POSITION_SIZE.MAX_PORTFOLIO_RISK,
    };
  }

  if (!checkMinMax(input.contractSize, { min: 0, max: 100000 })) {
    return {
      err: "Please enter a valid contract size.",
      field: ERROR_FIELD_POSITION_SIZE.CONTRACT_SIZE,
    };
  }

  if (
    input.basePair !== "" &&
    !checkMinMax(input.baseCrossRate, { min: 0, maxOrEqual: QUADRILLION })
  ) {
    return {
      err: "Please enter a valid cross rate.",
      field: ERROR_FIELD_POSITION_SIZE.BASE_CROSS_RATE,
    };
  }

  if (
    input.quotePair !== "" &&
    !checkMinMax(input.quoteCrossRate, { min: 0, maxOrEqual: QUADRILLION })
  ) {
    return {
      err: "Please enter a valid cross rate.",
      field: ERROR_FIELD_POSITION_SIZE.QUOTE_CROSS_RATE,
    };
  }

  if (!checkMinMax(input.openPrice, { min: 0, maxOrEqual: QUADRILLION })) {
    return {
      err: "Please enter a valid open price.",
      field: ERROR_FIELD_POSITION_SIZE.OPEN_PRICE,
    };
  }

  const stopLossMinMaxOpt: CheckMinMaxOption = {};
  if (input.isLong) {
    stopLossMinMaxOpt.min = 0;
    stopLossMinMaxOpt.max = parseBigNumberFromString(input.openPrice);
  } else {
    stopLossMinMaxOpt.min = parseBigNumberFromString(input.openPrice);
    stopLossMinMaxOpt.maxOrEqual = QUADRILLION;
  }
  if (!checkMinMax(input.stopLoss, stopLossMinMaxOpt)) {
    return {
      err: "Please enter a valid stop loss.",
      field: ERROR_FIELD_POSITION_SIZE.STOP_LOSS,
    };
  }

  if (input.includeProfitGoal) {
    if (input.profitGoalTyp === ProfitGoalTyp.PORTFOLIO_BASED) {
      if (!checkMinMax(input.profitGoal, { min: 0, maxOrEqual: QUADRILLION })) {
        return {
          err: "Please enter a valid min portfolio profit.",
          field: ERROR_FIELD_POSITION_SIZE.PROFIT_TARGET,
        };
      }
    } else {
      const profitGoalMinMaxOpt: CheckMinMaxOption = {};
      if (input.isLong) {
        profitGoalMinMaxOpt.min = parseBigNumberFromString(input.openPrice);
        profitGoalMinMaxOpt.maxOrEqual = QUADRILLION;
      } else {
        profitGoalMinMaxOpt.min = 0;
        profitGoalMinMaxOpt.max = parseBigNumberFromString(input.openPrice);
      }

      if (!checkMinMax(input.profitGoal, profitGoalMinMaxOpt)) {
        return {
          err: "Please enter a valid profit target.",
          field: ERROR_FIELD_POSITION_SIZE.PROFIT_TARGET,
        };
      }
    }
  }

  if (input.includeTradingFee) {
    if (
      !checkMinMax(input.estTradingFee, { min: 0, maxOrEqual: QUADRILLION })
    ) {
      return {
        err: "Please estimates a valid trading fee.",
        field: ERROR_FIELD_POSITION_SIZE.EST_TRADING_FEE,
      };
    }

    if (
      !checkMinMax(input.swapFee, {
        minOrEqual: QUADRILLION.negated(),
        maxOrEqual: QUADRILLION,
      })
    ) {
      return {
        err: "Please estimates a valid swap fee.",
        field: ERROR_FIELD_POSITION_SIZE.SWAP_FEE,
      };
    }

    if (!checkMinMax(input.period, { min: 0, maxOrEqual: QUADRILLION })) {
      return {
        err: "Please estimates a valid swap fee.",
        field: ERROR_FIELD_POSITION_SIZE.SWAP_FEE,
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
  const stopLoss = parseBigNumberFromString(input.stopLoss);
  const profitGoal = parseBigNumberFromString(input.profitGoal);
  const contractSize = parseBigNumberFromString(input.contractSize);
  const commissionFee = parseBigNumberFromString(input.estTradingFee);
  const swapFee = parseBigNumberFromString(input.swapFee);
  const period = parseBigNumberFromString(input.period);

  // Get currency pair info
  const pairInfo = getBaseAndQuote(input.currencyPair);

  // Get base rate (XXXUSD)
  let openBaseRate = mathBigNum.bignumber(1);
  let stopBaseRate = mathBigNum.bignumber(1);
  let profitBaseRate: BigNumber | undefined;
  if (input.basePair === "") {
    // acc base currency in the pair
    if (pairInfo.quote === input.accBaseCurrency) {
      openBaseRate = openPrice;
      stopBaseRate = stopLoss;

      if (
        input.includeProfitGoal &&
        input.profitGoalTyp === ProfitGoalTyp.PRICE_BASED
      ) {
        profitBaseRate = profitGoal;
      }
    } else {
      profitBaseRate = mathBigNum.bignumber(1);
    }
  } else {
    const baseRateInfo = getBaseAndQuote(input.basePair);
    const baseCrossRate = parseBigNumberFromString(input.baseCrossRate);
    openBaseRate =
      baseRateInfo.quote === input.accBaseCurrency
        ? baseCrossRate
        : divideBig(1, baseCrossRate);
    stopBaseRate = openBaseRate;
    profitBaseRate = openBaseRate;
  }

  // Get quote rate (XXXUSD)
  let stopQuoteRate = mathBigNum.bignumber(1);
  let profitQuoteRate: BigNumber | undefined;
  if (input.quotePair === "") {
    // acc base currency in the pair
    if (pairInfo.base === input.accBaseCurrency) {
      stopQuoteRate = divideBig(1, stopLoss);

      if (
        input.includeProfitGoal &&
        input.profitGoalTyp === ProfitGoalTyp.PRICE_BASED
      ) {
        profitQuoteRate = divideBig(1, profitGoal);
      }
    } else {
      profitQuoteRate = mathBigNum.bignumber(1);
    }
  } else {
    const quoteRateInfo = getBaseAndQuote(input.quotePair);
    const quoteCrossRate = parseBigNumberFromString(input.quoteCrossRate);
    stopQuoteRate =
      quoteRateInfo.quote === input.accBaseCurrency
        ? quoteCrossRate
        : divideBig(1, quoteCrossRate);
    profitQuoteRate = stopQuoteRate;
  }

  /*
  Handle calculation
  */

  // Calculate max loss
  // maxLoss = portfolioCapital * maxPortfolioRiskRate
  const maxLoss = multiplyBig(portfolioCapital, maxPortfolioRiskRate);

  // priceDiff = Math.abs(stopLoss - openPrice)
  const priceDiff = absBig(subtractBig(stopLoss, openPrice));

  // Calculate lot size
  let positionSize = mathBigNum.bignumber(0);
  let lotSize = mathBigNum.bignumber(0);
  let riskAmount = mathBigNum.bignumber(0);
  let entryFee: BigNumber | undefined;
  let stopFee: BigNumber | undefined;
  let stopSwapFee: BigNumber | undefined;
  if (!input.includeTradingFee) {
    // Calculate position size and lot size
    lotSize = calcLotSize(
      maxLoss,
      input.lotTyp,
      contractSize,
      stopQuoteRate,
      priceDiff
    );

    // riskAmount = lotSize * contractSize * priceDiff * quoteRate
    riskAmount = multiplyBig(
      multiplyBig(multiplyBig(lotSize, contractSize), priceDiff),
      stopQuoteRate
    );
  } else {
    // stopSwapFee = swapFee * stopQuoteRate * period
    stopSwapFee = multiplyBig(multiplyBig(swapFee, stopQuoteRate), period);
    stopSwapFee = mathBigNum.round(stopSwapFee, input.precision);

    if (input.feeTyp === FeeTyp.COMMISSION_PER_LOT) {
      lotSize = calcLotSizeWithLotBasedCommission(
        maxLoss,
        input.lotTyp,
        contractSize,
        stopQuoteRate,
        priceDiff,
        stopSwapFee,
        commissionFee
      );

      // fee = lotSize * commissionFee
      let fee = multiplyBig(lotSize, commissionFee);

      // riskAmount = positionSize * priceDiff * quoteRate + stopSwapFee + fee * 2
      riskAmount = addBig(
        addBig(
          multiplyBig(multiplyBig(positionSize, priceDiff), stopQuoteRate),
          multiplyBig(fee, 2)
        ),
        stopSwapFee
      );

      // Adjust lot size
      while (
        mathBigNum.larger(riskAmount, maxLoss) &&
        mathBigNum.larger(lotSize, 0)
      ) {
        lotSize = subtractBig(lotSize, 0.01);
        fee = multiplyBig(lotSize, commissionFee);
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

      // entryFeeStr = convertToLocaleString(fee.toString(), 2, 5);
      // stopFeeStr = entryFeeStr;
    } else {
      const commissionFeeRate = mathBigNum.divide(
        commissionFee,
        100000
      ) as BigNumber;

      // lotSize = calcLotSizeWithUSDBasedCommission(
      //   maxLoss,
      //   contractSize,
      //   openPrice,
      //   stopLoss,
      //   quoteRate,
      //   usdQuoteRate,
      //   usdAccRate,
      //   swapFeeInAccBase,
      //   commissionFeeRate
      // );

      // fee = openPrice * lotSize * contractSize * usdQuoteRate * commissionFeeRate * usdAccRate
      // let feeRate = mathBigNum.multiply(
      //   mathBigNum.multiply(
      //     mathBigNum.multiply(
      //       mathBigNum.multiply(lotSize, contractSize),
      //       usdQuoteRate
      //     ),
      //     commissionFeeRate
      //   ),
      //   usdAccRate
      // ) as BigNumber;
      // let entryFee = mathBigNum.multiply(openPrice, feeRate) as BigNumber;
      // entryFee = mathBigNum.round(entryFee, 5);
      // let stopFee = mathBigNum.multiply(stopLoss, feeRate) as BigNumber;
      // stopFee = mathBigNum.round(stopFee, 5);

      /* 
      riskAmount = lotSize * contractSize * priceDiff * quoteRate + swapFeeInAccBase 
        + entryFee + stopFee
      */
      // riskAmount = mathBigNum.add(
      //   mathBigNum.add(
      //     mathBigNum.add(
      //       mathBigNum.multiply(
      //         mathBigNum.multiply(
      //           mathBigNum.multiply(lotSize, contractSize),
      //           priceDiff
      //         ),
      //         quoteRate
      //       ),
      //       swapFeeInAccBase
      //     ),
      //     entryFee
      //   ),
      //   stopFee
      // ) as BigNumber;

      // while (
      //   mathBigNum.larger(lotSize, 0) &&
      //   mathBigNum.larger(riskAmount, maxLoss)
      // ) {
      //   lotSize = mathBigNum.subtract(lotSize, 0.01) as BigNumber;

      //   // Recompute fees
      //   feeRate = mathBigNum.multiply(
      //     mathBigNum.multiply(
      //       mathBigNum.multiply(
      //         mathBigNum.multiply(lotSize, contractSize),
      //         usdQuoteRate
      //       ),
      //       commissionFeeRate
      //     ),
      //     usdAccRate
      //   ) as BigNumber;
      //   entryFee = mathBigNum.multiply(openPrice, feeRate) as BigNumber;
      //   entryFee = mathBigNum.round(entryFee, 5);
      //   stopFee = mathBigNum.multiply(stopLoss, feeRate) as BigNumber;
      //   stopFee = mathBigNum.round(stopFee, 5);

      //   // Recompute risk amount
      //   riskAmount = mathBigNum.add(
      //     mathBigNum.add(
      //       mathBigNum.add(
      //         mathBigNum.multiply(
      //           mathBigNum.multiply(
      //             mathBigNum.multiply(lotSize, contractSize),
      //             priceDiff
      //           ),
      //           quoteRate
      //         ),
      //         swapFeeInAccBase
      //       ),
      //       entryFee
      //     ),
      //     stopFee
      //   ) as BigNumber;
      // }

      // entryFeeStr = convertToLocaleString(entryFee.toString(), 2, 5);
      // stopFeeStr = convertToLocaleString(stopFee.toString(), 2, 5);
    }
  }

  console.log(lotSize.toString(), entryFee?.toString(), stopFee?.toString());
};

const calcLotSize = (
  maxLoss: BigNumber,
  lotPrecision: number,
  contractSize: BigNumber,
  quoteRate: BigNumber,
  priceDiff: BigNumber
) => {
  let lotSize = mathBigNum.bignumber(0);

  /* 
    maxLoss = priceDiff * lotSize * contractSize * quoteRate
    lotSize = maxLoss / (priceDiff * contractSize * quoteRate)
  */
  const diff = multiplyBig(multiplyBig(priceDiff, quoteRate), contractSize);
  if (mathBigNum.equal(diff, 0)) {
    return lotSize;
  }
  lotSize = divideBig(maxLoss, diff);
  lotSize = mathBigNum.floor(lotSize, lotPrecision);

  return lotSize;
};

const calcLotSizeWithLotBasedCommission = (
  maxLoss: BigNumber,
  lotPrecision: number,
  contractSize: BigNumber,
  quoteRate: BigNumber,
  priceDiff: BigNumber,
  swapFeeInAccBase: BigNumber,
  commissionFee: BigNumber
) => {
  let lotSize = mathBigNum.bignumber(0);

  /* 
    maxLoss = priceDiff * lotSize * contractSize * quoteRate + lotSize * commissionFee * 2 - swapFeeInAccBase
    lotSize = (maxLoss + swapFeeInAccBase) /
      ((priceDiff * contractSize * quoteRate) + commissionFee * 2)
  */
  const diff = multiplyBig(multiplyBig(priceDiff, contractSize), quoteRate);
  if (mathBigNum.equal(diff, 0)) {
    return lotSize;
  }

  lotSize = divideBig(
    addBig(maxLoss, swapFeeInAccBase),
    addBig(diff, multiplyBig(commissionFee, 2))
  );
  lotSize = mathBigNum.floor(lotSize, lotPrecision);

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

const adjustLotSize = (
  getRiskAmountFn: (lotSize: BigNumber) => BigNumber,
  maxLoss: BigNumber,
  lotSize: BigNumber,
  lotTyp: LotTyp
) => {
  let riskAmount = getRiskAmountFn(lotSize);
  let units = [1, 0.1, 0.01, 0.001];

  for (let i = 0; i <= lotTyp; i++) {
    let tempLotSize = lotSize;

    while (mathBigNum.equal(riskAmount, maxLoss)) {
      if (mathBigNum.larger(riskAmount, maxLoss)) {
        tempLotSize = subtractBig(tempLotSize, units[i]);
      } else {
      }
    }
  }
};

const adjustLotSizeWithLotBasedCommission = (
  lotSize: BigNumber,
  commissionFee: BigNumber,
  contractSize: BigNumber,
  priceDiff: BigNumber,
  quoteRate: BigNumber,
  swapFee: BigNumber,
  maxLoss: BigNumber
) => {
  // fee = lotSize * commissionFee
  let fee = multiplyBig(lotSize, commissionFee);

  // riskAmount = lotSize * contractSize * priceDiff * quoteRate + swapFee + fee * 2
  let riskAmount = addBig(
    addBig(
      multiplyBig(
        multiplyBig(multiplyBig(lotSize, contractSize), priceDiff),
        quoteRate
      ),
      multiplyBig(fee, 2)
    ),
    swapFee
  );

  // Adjust lot size
  while (
    mathBigNum.larger(riskAmount, maxLoss) &&
    mathBigNum.larger(lotSize, 0)
  ) {
    lotSize = subtractBig(lotSize, 0.01);
    fee = multiplyBig(lotSize, commissionFee);
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
};
