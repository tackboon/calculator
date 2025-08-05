import { BigNumber } from "mathjs";
import { mathBigNum } from "../../../../common/number/math";
import {
  convertToLocaleString,
  parseBigNumberFromString,
  parseNumberFromString,
} from "../../../../common/number/number";
import { checkMinMax } from "../../../../common/validation/calculator.validation";
import {
  ERROR_FIELD_POSITION_SIZE,
  PositionSizeInputType,
  PositionSizeResultType,
  ProfitGoalTyp,
  UnitType,
} from "./position_size.type";

export const validatePositionSizeInput = (
  input: PositionSizeInputType
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

  if (!checkMinMax(input.entryPrice, 0)) {
    return {
      err: "Please enter a valid open price.",
      field: ERROR_FIELD_POSITION_SIZE.ENTRY_PRICE,
    };
  }

  let stopLossMin = mathBigNum.bignumber(0);
  let stopLossMax: BigNumber | number | undefined;
  if (input.stopLossTyp === "$") {
    if (input.isLong) {
      stopLossMax = parseBigNumberFromString(input.entryPrice);
    } else {
      stopLossMin = parseBigNumberFromString(input.entryPrice);
    }
  } else if (input.isLong) {
    stopLossMax = 100;
  }
  if (!checkMinMax(input.stopLoss, stopLossMin, stopLossMax)) {
    return {
      err: "Please enter a valid stop loss.",
      field: ERROR_FIELD_POSITION_SIZE.STOP_LOSS,
    };
  }

  if (input.includeProfitGoal) {
    let profitGoalMin: BigNumber | number = 0;
    let profitGoalMax: BigNumber | number | undefined;
    if (input.profitGoalTyp === ProfitGoalTyp.PORTFOLIO_BASED) {
      if (!checkMinMax(input.profitGoal, profitGoalMin)) {
        return {
          err: "Please enter a valid min portfolio profit.",
          field: ERROR_FIELD_POSITION_SIZE.PROFIT_TARGET,
        };
      }
    } else {
      if (input.profitGoalUnit === "$") {
        if (input.isLong) {
          profitGoalMin = parseBigNumberFromString(input.entryPrice);
        } else {
          profitGoalMax = parseBigNumberFromString(input.entryPrice);
        }
      } else if (!input.isLong) {
        profitGoalMax = 100;
      }

      if (!checkMinMax(input.profitGoal, profitGoalMin, profitGoalMax)) {
        return {
          err: "Please enter a valid profit target.",
          field: ERROR_FIELD_POSITION_SIZE.PROFIT_TARGET,
        };
      }
    }
  }

  if (input.includeTradingFee) {
    if (!checkMinMax(input.estTradingFee, 0, 100)) {
      return {
        err: "Please estimates a valid trading fee.",
        field: ERROR_FIELD_POSITION_SIZE.EST_TRADING_FEE,
      };
    }

    if (!checkMinMax(input.minTradingFee, 0)) {
      return {
        err: "Please enter a valid minimum trading fee.",
        field: ERROR_FIELD_POSITION_SIZE.MIN_TRADING_FEE,
      };
    }
  }

  return { err: "", field: null };
};

export const calculateResult = (
  input: PositionSizeInputType
): PositionSizeResultType => {
  // Parse inputs
  const portfolioCapital = parseBigNumberFromString(input.portfolioCapital);
  const maxPortfolioRisk = parseNumberFromString(input.maxPortfolioRisk);
  const maxLoss = mathBigNum.multiply(
    portfolioCapital,
    maxPortfolioRisk / 100
  ) as BigNumber;
  const entryPrice = parseBigNumberFromString(input.entryPrice);
  const stopLoss = parseBigNumberFromString(input.stopLoss);
  const profitGoal = parseBigNumberFromString(input.profitGoal);
  const minTradingFee = parseBigNumberFromString(input.minTradingFee);
  const estTradingFeePercent = parseNumberFromString(input.estTradingFee);
  const estFeeRate = mathBigNum.divide(estTradingFeePercent, 100);

  // Calculate stop price
  let stopPrice = mathBigNum.bignumber(0);
  let stopPercent = mathBigNum.bignumber(0);
  if (input.stopLossTyp === "$") {
    stopPrice = stopLoss;
    if (!mathBigNum.equal(entryPrice, 0)) {
      // stopPercent = (Math.abs(entryPrice - stopLoss) / entryPrice) * 100
      const stopRate = mathBigNum.divide(
        mathBigNum.abs(mathBigNum.subtract(entryPrice, stopLoss)),
        entryPrice
      );
      stopPercent = mathBigNum.multiply(stopRate, 100) as BigNumber;
      stopPercent = mathBigNum.round(stopPercent, 5);
    }
  } else {
    /* 
      stopPrice = input.isLong ? 
        entryPrice * (1 - stopPercent / 100):
        entryPrice * (1 + stopPercent / 100)
    */
    let stopRate = mathBigNum.divide(stopLoss, 100) as BigNumber;
    stopRate = (
      input.isLong
        ? mathBigNum.subtract(1, stopRate)
        : mathBigNum.add(1, stopRate)
    ) as BigNumber;
    stopPrice = mathBigNum.multiply(entryPrice, stopRate) as BigNumber;
    stopPrice = input.isLong
      ? mathBigNum.ceil(stopPrice, 5)
      : mathBigNum.floor(stopPrice, 5);

    // Recompute stop loss percent
    if (!mathBigNum.equal(entryPrice, 0)) {
      // stopPercent = (Math.abs(entryPrice - stopPrice) / entryPrice) * 100
      stopRate = mathBigNum.divide(
        mathBigNum.abs(mathBigNum.subtract(entryPrice, stopPrice)),
        entryPrice
      ) as BigNumber;
      stopPercent = mathBigNum.multiply(stopRate, 100) as BigNumber;
      stopPercent = mathBigNum.round(stopPercent, 5);
    }
  }

  // Calculate quantity
  let quantityStr = "";
  let quantity = calculateQuantity(
    maxLoss,
    stopPrice,
    estFeeRate,
    minTradingFee,
    entryPrice,
    input.isLong
  );
  if (quantity.isNaN()) {
    quantity = mathBigNum.bignumber(0);
  }

  switch (input.unitType) {
    case UnitType.FRACTIONAL:
      // Adjust quantity
      while (
        mathBigNum.larger(
          calculateCurrentLoss(
            quantity,
            entryPrice,
            stopPrice,
            estFeeRate,
            minTradingFee
          ),
          maxLoss
        )
      ) {
        quantity = mathBigNum.subtract(quantity, 0.000001) as BigNumber;
      }

      quantityStr = quantity.toString();
      break;
    case UnitType.UNIT:
      quantity = mathBigNum.floor(quantity);
      quantityStr = quantity.toString();
      break;
    case UnitType.LOT:
      // lot = Math.floor(quantity / 100)
      // quantity = lot * 100
      const lot = mathBigNum.floor(
        mathBigNum.divide(quantity, 100) as BigNumber
      );
      quantity = mathBigNum.multiply(lot, 100) as BigNumber;
      quantityStr = lot.toString() + " Lot";
      break;
  }

  // Calculate entry amount
  // entryAmount = entryPrice * quantity
  const entryAmount = mathBigNum.multiply(entryPrice, quantity) as BigNumber;

  // Calculate risk amount
  // riskAmount = Math.abs(entryPrice - stopPrice) * quantity
  let riskAmount = mathBigNum.multiply(
    mathBigNum.abs(mathBigNum.subtract(entryPrice, stopPrice)),
    quantity
  ) as BigNumber;

  // Calculate entry fee and stop fee
  let estimatedEntryFee: BigNumber | undefined;
  let estimatedEntryFeeStr: string | undefined;
  let estimatedStopFeeStr: string | undefined;
  if (input.includeTradingFee) {
    // estimatedEntryFee = entryAmount * estFeeRate;
    estimatedEntryFee = mathBigNum.multiply(
      entryAmount,
      estFeeRate
    ) as BigNumber;
    estimatedEntryFee = mathBigNum.round(estimatedEntryFee, 5);
    if (
      mathBigNum.smaller(estimatedEntryFee, minTradingFee) &&
      mathBigNum.larger(entryAmount, 0)
    ) {
      estimatedEntryFee = minTradingFee;
    }
    estimatedEntryFeeStr = convertToLocaleString(
      estimatedEntryFee.toString(),
      2,
      5
    );

    // estimatedStopFee = stopPrice * quantity * estFeeRate;
    let estimatedStopFee = mathBigNum.multiply(
      stopPrice,
      mathBigNum.multiply(quantity, estFeeRate)
    ) as BigNumber;
    estimatedStopFee = mathBigNum.round(estimatedStopFee, 5);
    if (
      mathBigNum.smaller(estimatedStopFee, minTradingFee) &&
      mathBigNum.larger(entryAmount, 0)
    ) {
      estimatedStopFee = minTradingFee;
    }
    estimatedStopFeeStr = convertToLocaleString(
      estimatedStopFee.toString(),
      2,
      5
    );

    // Recompute risk amount
    riskAmount = mathBigNum.add(
      riskAmount,
      mathBigNum.add(estimatedEntryFee, estimatedStopFee)
    );
  }

  // Calculate portfolio risk
  // portfolioRisk = (riskAmount / portfolioCapital) * 100
  const portfolioRisk = mathBigNum.equal(portfolioCapital, 0)
    ? mathBigNum.bignumber(0)
    : (mathBigNum.multiply(
        mathBigNum.divide(riskAmount, portfolioCapital),
        100
      ) as BigNumber);

  // Calculate profit and profit fee
  let profitPriceStr: string | undefined;
  let profitPercentStr: string | undefined;
  let profitAmount: BigNumber | undefined;
  let profitAmountStr: string | undefined;
  let estimatedProfitFeeStr: string | undefined;
  if (input.includeProfitGoal) {
    let profitPrice = mathBigNum.bignumber(0);
    let profitPercent = mathBigNum.bignumber(0);
    let estimatedProfitFee = mathBigNum.bignumber(0);

    if (input.profitGoalTyp === ProfitGoalTyp.PRICED_BASED) {
      if (input.profitGoalUnit === "$") {
        profitPrice = profitGoal;

        // profitPercent = (Math.abs(entryPrice - profitPrice) / entryPrice) * 100
        if (!mathBigNum.equal(entryPrice, 0)) {
          profitPercent = mathBigNum.multiply(
            mathBigNum.divide(
              mathBigNum.abs(mathBigNum.subtract(entryPrice, profitPrice)),
              entryPrice
            ),
            100
          ) as BigNumber;
        }
      } else {
        /*
          profitPrice = input.isLong
            ? entryPrice * (1 + profitGoal / 100)
            : entryPrice * (1 - profitGoal / 100);
        */
        let profitRate = mathBigNum.divide(profitGoal, 100) as BigNumber;
        profitRate = input.isLong
          ? (mathBigNum.add(1, profitRate) as BigNumber)
          : (mathBigNum.subtract(1, profitRate) as BigNumber);
        profitPrice = mathBigNum.multiply(entryPrice, profitRate) as BigNumber;
        profitPrice = input.isLong
          ? mathBigNum.ceil(profitPrice, 5)
          : mathBigNum.floor(profitPrice, 5);

        // Recompute profit percent
        // profitPercent = (Math.abs(profitPrice - entryPrice) / entryPrice) * 100
        if (!mathBigNum.equal(entryPrice, 0)) {
          profitPercent = mathBigNum.multiply(
            mathBigNum.divide(
              mathBigNum.abs(mathBigNum.subtract(profitPrice, entryPrice)),
              entryPrice
            ),
            100
          ) as BigNumber;
        }
      }

      // exitAmount = profitPrice * quantity
      const exitAmount = mathBigNum.multiply(
        profitPrice,
        quantity
      ) as BigNumber;

      // profitAmount = Math.abs(entryAmount - exitAmount)
      profitAmount = mathBigNum.abs(
        mathBigNum.subtract(entryAmount, exitAmount)
      );
      if (input.includeTradingFee) {
        // estimatedProfitFee = exitAmount * estFeeRate
        estimatedProfitFee = mathBigNum.multiply(
          exitAmount,
          estFeeRate
        ) as BigNumber;
        estimatedProfitFee = mathBigNum.round(estimatedProfitFee, 5);

        if (
          mathBigNum.smaller(estimatedProfitFee, minTradingFee) &&
          mathBigNum.larger(entryAmount, 0)
        ) {
          estimatedProfitFee = minTradingFee;
        }

        // profitAmount = profitAmount - estimatedEntryFee - estimatedProfitFee
        profitAmount = mathBigNum.subtract(profitAmount, estimatedProfitFee);
        if (estimatedEntryFee !== undefined) {
          profitAmount = mathBigNum.subtract(profitAmount, estimatedEntryFee);
        }
      }
    } else {
      // minProfit = portfolioCapital * (profitGoal / 100)
      const minProfit = mathBigNum.multiply(
        portfolioCapital,
        mathBigNum.divide(profitGoal, 100)
      ) as BigNumber;

      if (estimatedEntryFee !== undefined) {
        // including trading fee
        if (!mathBigNum.equal(quantity, 0)) {
          /* 
            profitPrice = input.isLong 
              ? (minProfit + estimatedEntryFee + entryAmount) / ((1 - estFeeRate) * quantity)
              : (entryAmount - estimatedEntryFee - minProfit) / ((1 + estFeeRate) * quantity)
          */
          if (input.isLong) {
            profitPrice = mathBigNum.divide(
              mathBigNum.add(
                mathBigNum.add(minProfit, estimatedEntryFee),
                entryAmount
              ),
              mathBigNum.multiply(mathBigNum.subtract(1, estFeeRate), quantity)
            ) as BigNumber;
            profitPrice = mathBigNum.ceil(profitPrice, 5);
          } else {
            profitPrice = mathBigNum.divide(
              mathBigNum.subtract(
                mathBigNum.subtract(entryAmount, estimatedEntryFee),
                minProfit
              ),
              mathBigNum.multiply(mathBigNum.add(1, estFeeRate), quantity)
            ) as BigNumber;
            profitPrice = mathBigNum.floor(profitPrice, 5);
          }
        }

        // estimatedProfitFee = profitPrice * quantity * estFeeRate
        estimatedProfitFee = mathBigNum.multiply(
          mathBigNum.multiply(profitPrice, quantity),
          estFeeRate
        ) as BigNumber;
        estimatedProfitFee = mathBigNum.round(estimatedProfitFee);

        // Recalculate profit price if profit fee is smaller than minimum trading fee
        if (
          mathBigNum.smaller(estimatedProfitFee, minTradingFee) &&
          mathBigNum.larger(entryAmount, 0)
        ) {
          estimatedProfitFee = minTradingFee;

          /* 
            profitPrice = input.isLong
              ? (minProfit + entryAmount + estimatedEntryFee + estimatedProfitFee) / quantity
              : (entryAmount - estimatedEntryFee - estimatedProfitFee - minProfit) / quantity
          */
          if (input.isLong) {
            profitPrice = mathBigNum.divide(
              mathBigNum.add(
                minProfit,
                mathBigNum.add(
                  entryAmount,
                  mathBigNum.add(estimatedEntryFee, estimatedProfitFee)
                )
              ),
              quantity
            ) as BigNumber;
            profitPrice = mathBigNum.ceil(profitPrice, 5);
          } else {
            profitPrice = mathBigNum.divide(
              mathBigNum.subtract(
                mathBigNum.subtract(
                  mathBigNum.subtract(entryAmount, estimatedEntryFee),
                  estimatedProfitFee
                ),
                minProfit
              ),
              quantity
            ) as BigNumber;
            profitPrice = mathBigNum.floor(profitPrice, 5);
          }
        }

        // Adjust the profit price to make sure it fullfil the minimum profit amount
        const { exitPrice, exitFee } = adjustProfitPrice(
          profitPrice,
          quantity,
          entryAmount,
          estimatedEntryFee,
          estFeeRate,
          minTradingFee,
          minProfit,
          input.isLong
        );
        profitPrice = exitPrice;
        estimatedProfitFee = exitFee;

        // profitAmount = Math.abs(profitPrice - entryPrice) * quantity - estimatedEntryFee - estimatedProfitFee;
        if (estimatedProfitFee !== undefined) {
          profitAmount = mathBigNum.subtract(
            mathBigNum.subtract(
              mathBigNum.multiply(
                mathBigNum.abs(mathBigNum.subtract(profitPrice, entryPrice)),
                quantity
              ),
              estimatedEntryFee
            ),
            estimatedProfitFee
          ) as BigNumber;
        }
      } else {
        // no trading fee

        /*
          profitPrice = input.isLong
            ? minProfit / quantity + entryPrice
            : entryPrice - minProfit / quantity
        */
        if (!mathBigNum.equal(quantity, 0)) {
          if (input.isLong) {
            profitPrice = mathBigNum.add(
              mathBigNum.divide(minProfit, quantity),
              entryPrice
            ) as BigNumber;
            profitPrice = mathBigNum.ceil(profitPrice, 5);
          } else {
            profitPrice = mathBigNum.subtract(
              entryPrice,
              mathBigNum.divide(minProfit, quantity)
            ) as BigNumber;
            profitPrice = mathBigNum.floor(profitPrice, 5);
          }
        }

        // Adjust the profit price to make sure it fullfil the minimum profit amount
        const { exitPrice } = adjustProfitPrice(
          profitPrice,
          quantity,
          entryAmount,
          mathBigNum.bignumber(0),
          0,
          mathBigNum.bignumber(0),
          minProfit,
          input.isLong
        );
        profitPrice = exitPrice;

        // Recompute profit amount
        // profitAmount = Math.abs(profitPrice - entryPrice) * quantity
        profitAmount = mathBigNum.multiply(
          mathBigNum.abs(mathBigNum.subtract(profitPrice, entryPrice)),
          quantity
        ) as BigNumber;
      }
    }

    // profitPercent = (Math.abs(entryPrice - profitPrice) / entryPrice) * 100
    if (!mathBigNum.equal(entryPrice, 0)) {
      profitPercent = mathBigNum.multiply(
        mathBigNum.divide(
          mathBigNum.abs(mathBigNum.subtract(entryPrice, profitPrice)),
          entryPrice
        ),
        100
      ) as BigNumber;
    }

    profitPriceStr = convertToLocaleString(profitPrice.toString(), 2, 5);
    profitPercentStr = convertToLocaleString(profitPercent.toString(), 2, 5);
    if (input.includeTradingFee) {
      estimatedProfitFeeStr = convertToLocaleString(
        estimatedProfitFee.toString(),
        2,
        5
      );
    }
    if (profitAmount !== undefined) {
      profitAmountStr = convertToLocaleString(profitAmount.toString(), 2, 5);
    }
  }

  // Calculate portfolio profit
  let portfolioProfit: BigNumber | undefined;
  let portfolioProfitStr: string | undefined;
  if (profitAmount !== undefined) {
    // portfolioProfit = (profitAmount / portfolioCapital) * 100
    portfolioProfit = mathBigNum.bignumber(0);
    if (!mathBigNum.equal(portfolioCapital, 0)) {
      portfolioProfit = mathBigNum.multiply(
        mathBigNum.divide(profitAmount, portfolioCapital),
        100
      ) as BigNumber;
    }
    portfolioProfitStr = convertToLocaleString(
      portfolioProfit.toString(),
      2,
      5
    );
  }

  // Calculate risk reward ratio and break even win rate
  let riskRewardRatioStr: string | undefined;
  let breakEvenWinRateStr: string | undefined;
  if (
    mathBigNum.larger(riskAmount, 0) &&
    profitAmount !== undefined &&
    mathBigNum.larger(profitAmount, 0)
  ) {
    // ratio = riskAmount / profitAmount
    let ratio = mathBigNum.divide(riskAmount, profitAmount) as BigNumber;
    let roundedRatio = mathBigNum.round(ratio, 2);

    if (mathBigNum.largerEq(roundedRatio, 1)) {
      riskRewardRatioStr = `${ratio}:1`;
    } else {
      riskRewardRatioStr = `1:${convertToLocaleString(
        mathBigNum.divide(1, ratio).toString(),
        0,
        2
      )}`;
    }

    // breakEvenWinRate = (1 / (1 + 1 / ratio)) * 100
    const breakEvenWinRate = mathBigNum.multiply(
      mathBigNum.divide(1, mathBigNum.add(1, mathBigNum.divide(1, ratio))),
      100
    ) as BigNumber;
    breakEvenWinRateStr = convertToLocaleString(
      breakEvenWinRate.toString(),
      2,
      5
    );
  }

  return {
    isLong: input.isLong,
    includeTradingFee: input.includeTradingFee,
    includeProfitGoal: input.includeProfitGoal,
    entryPrice: input.entryPrice,
    stopPrice: convertToLocaleString(stopPrice.toString(), 2, 5),
    stopPercent: convertToLocaleString(stopPercent.toString(), 2, 5),
    profitPrice: profitPriceStr,
    profitPercent: profitPercentStr,
    quantity: quantityStr,
    tradingAmount: convertToLocaleString(entryAmount.toString(), 2, 5),
    riskAmount: convertToLocaleString(riskAmount.toString(), 2, 5),
    portfolioRisk: convertToLocaleString(portfolioRisk.toString(), 2, 5),
    profitAmount: profitAmountStr,
    portfolioProfit: portfolioProfitStr,
    riskRewardRatio: riskRewardRatioStr,
    breakEvenWinRate: breakEvenWinRateStr,
    estimatedEntryFee: estimatedEntryFeeStr,
    estimatedStopFee: estimatedStopFeeStr,
    estimatedProfitFee: estimatedProfitFeeStr,
  };
};

const calculateQuantity = (
  maxLoss: BigNumber,
  stopLossPrice: BigNumber,
  estFeeRate: number,
  minTradingFee: BigNumber,
  entryPrice: BigNumber,
  isLong: boolean
): BigNumber => {
  let quantity = mathBigNum.bignumber(0);

  // Compute trading amount without fees
  if (estFeeRate === 0 && mathBigNum.equal(minTradingFee, 0)) {
    // quantity = maxLoss / Math.abs(entryPrice - stopLossPrice)
    quantity = mathBigNum.divide(
      maxLoss,
      mathBigNum.abs(mathBigNum.subtract(entryPrice, stopLossPrice))
    ) as BigNumber;

    return mathBigNum.floor(quantity, 6);
  }

  // Compute trading amount with fixed fee
  if (estFeeRate === 0 && mathBigNum.larger(minTradingFee, 0)) {
    // quantity = (maxLoss - minTradingFee * 2) / Math.abs(entryPrice - stopLossPrice)
    quantity = mathBigNum.divide(
      mathBigNum.subtract(maxLoss, mathBigNum.multiply(minTradingFee, 2)),
      mathBigNum.abs(mathBigNum.subtract(entryPrice, stopLossPrice))
    ) as BigNumber;

    return mathBigNum.floor(quantity, 6);
  }

  // Compupte trading amount with estimation fees
  // Attempt 1: Assume both fees exceed minTradingFee

  // quantity = maxLoss / (Math.abs(entryPrice - stopLossPrice) + estFeeRate * (entryPrice + stopLossPrice))
  quantity = mathBigNum.divide(
    maxLoss,
    mathBigNum.add(
      mathBigNum.abs(mathBigNum.subtract(entryPrice, stopLossPrice)),
      mathBigNum.multiply(estFeeRate, mathBigNum.add(entryPrice, stopLossPrice))
    )
  ) as BigNumber;
  quantity = mathBigNum.floor(quantity, 6);

  // entryFee = quantity * entryPrice * estFeeRate
  let entryFee = mathBigNum.multiply(
    quantity,
    mathBigNum.multiply(entryPrice, estFeeRate)
  ) as BigNumber;
  entryFee = mathBigNum.round(entryFee, 5);

  // stopLossFee = quantity * stopLossPrice * estFeeRate
  let stopLossFee = mathBigNum.multiply(
    quantity,
    mathBigNum.multiply(stopLossPrice, estFeeRate)
  ) as BigNumber;
  stopLossFee = mathBigNum.round(stopLossFee, 5);

  if (
    mathBigNum.largerEq(entryFee, minTradingFee) &&
    mathBigNum.largerEq(stopLossFee, minTradingFee)
  ) {
    return quantity;
  }

  // Attempt 2: Assume stop loss fee is smaller than minTradingFee
  // quantity = isLong
  //   ? (maxLoss - minTradingFee) /
  //     (entryPrice - stopLossPrice + entryFee * estFeeRate)
  //   : (maxLoss - minTradingFee) /
  //     (stopLossPrice - entryPrice + stopLossPrice * estFeeRate);
  quantity = isLong
    ? (mathBigNum.divide(
        mathBigNum.subtract(maxLoss, minTradingFee),
        mathBigNum.add(
          mathBigNum.subtract(entryPrice, stopLossPrice),
          mathBigNum.multiply(entryFee, estFeeRate)
        )
      ) as BigNumber)
    : (mathBigNum.divide(
        mathBigNum.subtract(maxLoss, minTradingFee),
        mathBigNum.add(
          mathBigNum.subtract(stopLossPrice, entryPrice),
          mathBigNum.multiply(stopLossPrice, estFeeRate)
        )
      ) as BigNumber);
  quantity = mathBigNum.floor(quantity, 6);

  // entryFee = quantity * entryPrice * estFeeRate
  entryFee = mathBigNum.multiply(
    quantity,
    mathBigNum.multiply(entryPrice, estFeeRate)
  ) as BigNumber;
  entryFee = mathBigNum.round(entryFee, 5);

  // stopLossFee = quantity * stopLossPrice * estFeeRate
  stopLossFee = mathBigNum.multiply(
    quantity,
    mathBigNum.multiply(stopLossPrice, estFeeRate)
  ) as BigNumber;
  stopLossFee = mathBigNum.round(stopLossFee, 5);

  if (
    mathBigNum.largerEq(entryFee, minTradingFee) &&
    mathBigNum.largerEq(stopLossFee, minTradingFee)
  ) {
    return quantity;
  }

  // Attempt 3: Assume both fees smaller than minTradingFee
  // quantity = (maxLoss - 2 * minTradingFee) / Math.abs(stopLossPrice - entryPrice);
  quantity = mathBigNum.divide(
    mathBigNum.subtract(maxLoss, mathBigNum.multiply(minTradingFee, 2)),
    mathBigNum.abs(mathBigNum.subtract(stopLossPrice, entryPrice))
  ) as BigNumber;
  return mathBigNum.floor(quantity, 6);
};

const calculateCurrentLoss = (
  quantity: BigNumber,
  entryPrice: BigNumber,
  stopPrice: BigNumber,
  feeRate: number,
  minFee: BigNumber
): BigNumber => {
  // entryAmt = quantity * entryPrice
  const entryAmt = mathBigNum.multiply(quantity, entryPrice) as BigNumber;

  // stopAmt = quantity * stopPrice
  const stopAmt = mathBigNum.multiply(quantity, stopPrice) as BigNumber;

  // entryFee = entryAmt * feeRate
  let entryFee = mathBigNum.multiply(entryAmt, feeRate) as BigNumber;
  entryFee = mathBigNum.round(entryFee, 5);
  if (mathBigNum.smaller(entryFee, minFee)) {
    entryFee = minFee;
  }

  // stopFee = stopAmt * feeRate
  let stopFee = mathBigNum.multiply(stopAmt, feeRate) as BigNumber;
  stopFee = mathBigNum.round(stopFee, 5);
  if (mathBigNum.smaller(stopFee, minFee)) {
    stopFee = minFee;
  }

  // currentLoss = Math.abs(entryAmt - stopAmt) + entryFee + stopFee
  const currentLoss = mathBigNum.add(
    mathBigNum.abs(mathBigNum.subtract(entryAmt, stopAmt)),
    mathBigNum.add(entryFee, stopFee)
  );

  return currentLoss;
};

const adjustProfitPrice = (
  profitPrice: BigNumber,
  quantity: BigNumber,
  entryAmt: BigNumber,
  entryFee: BigNumber,
  feeRate: number,
  minFee: BigNumber,
  minProfit: BigNumber,
  isLong: boolean
): { exitPrice: BigNumber; exitFee: BigNumber } => {
  if (mathBigNum.equal(entryAmt, 0)) {
    return {
      exitPrice: mathBigNum.bignumber(0),
      exitFee: mathBigNum.bignumber(0),
    };
  }

  // exitAmount = profitPrice * quantity
  let exitAmount = mathBigNum.multiply(profitPrice, quantity) as BigNumber;

  // exitFee = exitAmount * feeRate
  let exitFee = mathBigNum.bignumber(0);
  if (mathBigNum.larger(exitAmount, 0)) {
    exitFee = mathBigNum.multiply(exitAmount, feeRate) as BigNumber;
    exitFee = mathBigNum.round(exitFee, 5);
  }
  if (exitFee < minFee) exitFee = minFee;

  // profitAmt = Math.abs(exitAmount - entryAmt) - entryFee - exitFee
  let profitAmt = mathBigNum.subtract(
    mathBigNum.subtract(
      mathBigNum.abs(mathBigNum.subtract(exitAmount, entryAmt)),
      entryFee
    ),
    exitFee
  );

  while (mathBigNum.smaller(profitAmt, minProfit)) {
    // profitPrice = isLong ? profitPrice + 0.00001: profitPrice - 0.00001
    profitPrice = isLong
      ? (mathBigNum.add(profitPrice, 0.00001) as BigNumber)
      : (mathBigNum.subtract(profitPrice, 0.00001) as BigNumber);

    // exitAmount = profitPrice * quantity;
    exitAmount = mathBigNum.multiply(profitPrice, quantity) as BigNumber;

    // exitFee = exitAmount * feeRate
    exitFee = mathBigNum.bignumber(0);
    if (mathBigNum.larger(exitAmount, 0)) {
      exitFee = mathBigNum.multiply(exitAmount, feeRate) as BigNumber;
      exitFee = mathBigNum.round(exitFee, 5);
    }
    if (mathBigNum.smaller(exitFee, minFee)) exitFee = minFee;

    // profitAmt = Math.abs(exitAmount - entryAmt) - entryFee - exitFee
    profitAmt = mathBigNum.subtract(
      mathBigNum.subtract(
        mathBigNum.abs(mathBigNum.subtract(exitAmount, entryAmt)),
        entryFee
      ),
      exitFee
    );
  }

  return { exitPrice: profitPrice, exitFee: exitFee };
};
