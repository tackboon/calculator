import { BigNumber } from "mathjs";
import {
  addBig,
  divideBig,
  mathBigNum,
  multiplyBig,
  QUADRILLION,
  QUINTILLION,
  subtractBig,
} from "../../../../common/number/math";
import { parseBigNumberFromString } from "../../../../common/number/number";
import {
  checkMinMax,
  CheckMinMaxOption,
} from "../../../../common/validation/calculator.validation";
import {
  ERROR_FIELD_POSITION_SIZE,
  PositionSizeInputType,
  PositionSizeResultType,
  ProfitGoalTyp,
  ProfitGoalUnit,
  StopLossTyp,
  UnitType,
} from "./position_size.type";

export const validatePositionSizeInput = (
  input: PositionSizeInputType
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

  if (!checkMinMax(input.entryPrice, { min: 0, maxOrEqual: QUADRILLION })) {
    return {
      err: "Please enter a valid open price.",
      field: ERROR_FIELD_POSITION_SIZE.ENTRY_PRICE,
    };
  }

  const stopLossMinMaxOpt: CheckMinMaxOption = {};
  if (input.stopLossTyp === StopLossTyp.PRICED_BASED) {
    if (input.isLong) {
      stopLossMinMaxOpt.min = 0;
      stopLossMinMaxOpt.max = parseBigNumberFromString(input.entryPrice);
    } else {
      stopLossMinMaxOpt.min = parseBigNumberFromString(input.entryPrice);
      stopLossMinMaxOpt.maxOrEqual = QUADRILLION;
    }
  } else {
    if (input.isLong) {
      stopLossMinMaxOpt.min = 0;
      stopLossMinMaxOpt.max = 100;
    } else {
      stopLossMinMaxOpt.min = 0;
      stopLossMinMaxOpt.maxOrEqual = QUADRILLION;
    }
  }
  if (!checkMinMax(input.stopLoss, stopLossMinMaxOpt)) {
    return {
      err: "Please enter a valid stop loss.",
      field: ERROR_FIELD_POSITION_SIZE.STOP_LOSS,
    };
  }

  if (input.includeProfitGoal) {
    const profitGoalMinMaxOpt: CheckMinMaxOption = {};
    if (input.profitGoalTyp === ProfitGoalTyp.PORTFOLIO_BASED) {
      profitGoalMinMaxOpt.min = 0;
      profitGoalMinMaxOpt.maxOrEqual = QUADRILLION;

      if (!checkMinMax(input.profitGoal, profitGoalMinMaxOpt)) {
        return {
          err: "Please enter a valid min portfolio profit.",
          field: ERROR_FIELD_POSITION_SIZE.PROFIT_TARGET,
        };
      }
    } else {
      if (input.profitGoalUnit === ProfitGoalUnit.PRICED_BASED) {
        if (input.isLong) {
          profitGoalMinMaxOpt.min = parseBigNumberFromString(input.entryPrice);
          profitGoalMinMaxOpt.maxOrEqual = QUADRILLION;
        } else {
          profitGoalMinMaxOpt.min = 0;
          profitGoalMinMaxOpt.max = parseBigNumberFromString(input.entryPrice);
        }
      } else {
        if (input.isLong) {
          profitGoalMinMaxOpt.min = 0;
          profitGoalMinMaxOpt.maxOrEqual = QUADRILLION;
        } else {
          profitGoalMinMaxOpt.min = 0;
          profitGoalMinMaxOpt.max = 100;
        }
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
    if (!checkMinMax(input.estTradingFee, { min: 0, maxOrEqual: 100 })) {
      return {
        err: "Please estimates a valid trading fee.",
        field: ERROR_FIELD_POSITION_SIZE.EST_TRADING_FEE,
      };
    }

    if (
      !checkMinMax(input.minTradingFee, { min: 0, maxOrEqual: QUADRILLION })
    ) {
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
  const maxPortfolioRisk = parseBigNumberFromString(input.maxPortfolioRisk);
  const maxLoss = multiplyBig(
    portfolioCapital,
    divideBig(maxPortfolioRisk, 100)
  );
  const entryPrice = parseBigNumberFromString(input.entryPrice);
  const stopLoss = parseBigNumberFromString(input.stopLoss);
  const profitGoal = parseBigNumberFromString(input.profitGoal);
  const minTradingFee = parseBigNumberFromString(input.minTradingFee);
  const estTradingFeePercent = parseBigNumberFromString(input.estTradingFee);
  const estFeeRate = divideBig(estTradingFeePercent, 100);

  // Calculate stop price
  let stopPrice = mathBigNum.bignumber(0);
  let stopPercent = mathBigNum.bignumber(0);
  if (input.stopLossTyp === StopLossTyp.PRICED_BASED) {
    stopPrice = stopLoss;
    if (!mathBigNum.equal(entryPrice, 0)) {
      // stopPercent = (Math.abs(entryPrice - stopLoss) / entryPrice) * 100
      const stopRate = divideBig(
        mathBigNum.abs(subtractBig(entryPrice, stopLoss)),
        entryPrice
      );
      stopPercent = multiplyBig(stopRate, 100);
      stopPercent = mathBigNum.round(stopPercent, input.precision);
    }
  } else {
    /* 
      stopPrice = input.isLong ? 
        entryPrice * (1 - stopPercent / 100):
        entryPrice * (1 + stopPercent / 100)
    */
    let stopRate = divideBig(stopLoss, 100);
    stopRate = input.isLong ? subtractBig(1, stopRate) : addBig(1, stopRate);
    stopPrice = multiplyBig(entryPrice, stopRate);
    stopPrice = input.isLong
      ? mathBigNum.ceil(stopPrice, 5)
      : mathBigNum.floor(stopPrice, 5);

    // Recompute stop loss percent
    if (!mathBigNum.equal(entryPrice, 0)) {
      // stopPercent = (Math.abs(entryPrice - stopPrice) / entryPrice) * 100
      stopRate = divideBig(
        mathBigNum.abs(subtractBig(entryPrice, stopPrice)),
        entryPrice
      );
      stopPercent = multiplyBig(stopRate, 100);
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
    input.isLong,
    input.precision
  );
  if (quantity.isNaN()) {
    quantity = mathBigNum.bignumber(0);
  }

  // Adjust quantity
  while (
    mathBigNum.larger(
      calculateCurrentLoss(
        quantity,
        entryPrice,
        stopPrice,
        estFeeRate,
        minTradingFee,
        input.precision
      ),
      maxLoss
    )
  ) {
    quantity = subtractBig(quantity, 0.000001);
  }

  switch (input.unitType) {
    case UnitType.FRACTIONAL:
      quantityStr = quantity.toString();
      break;
    case UnitType.UNIT:
      quantity = mathBigNum.floor(quantity);
      quantityStr = quantity.toString();
      break;
    case UnitType.LOT:
      // lot = Math.floor(quantity / 100)
      // quantity = lot * 100
      const lot = mathBigNum.floor(divideBig(quantity, 100));
      quantity = multiplyBig(lot, 100);
      quantityStr = lot.toString() + " Lot";
      break;
  }

  // Calculate entry amount
  // grossEntryAmount = entryPrice * quantity
  const grossEntryAmount = multiplyBig(entryPrice, quantity);
  let entryAmount = grossEntryAmount;

  // Calculate risk amount
  // riskAmount = Math.abs(entryPrice - stopPrice) * quantity
  let riskAmount = multiplyBig(
    mathBigNum.abs(subtractBig(entryPrice, stopPrice)),
    quantity
  );

  // Calculate entry fee and stop fee
  let entryFee: BigNumber | undefined;
  let realEntryFee: BigNumber | undefined;
  let stopFee: BigNumber | undefined;
  if (input.includeTradingFee) {
    // entryFee = grossEntryAmount * estFeeRate;
    realEntryFee = multiplyBig(grossEntryAmount, estFeeRate);
    entryFee = mathBigNum.round(realEntryFee, input.precision);
    if (mathBigNum.smaller(entryFee, minTradingFee)) {
      entryFee = minTradingFee;
    }
    if (mathBigNum.smaller(realEntryFee, entryFee)) {
      realEntryFee = entryFee;
    }

    // Recompute entry amount
    entryAmount = addBig(grossEntryAmount, entryFee);

    // stopFee = stopPrice * quantity * estFeeRate;
    stopFee = multiplyBig(stopPrice, multiplyBig(quantity, estFeeRate));
    stopFee = mathBigNum.round(stopFee, input.precision);
    if (mathBigNum.smaller(stopFee, minTradingFee)) {
      stopFee = minTradingFee;
    }

    // Recompute risk amount
    riskAmount = addBig(riskAmount, addBig(entryFee, stopFee));
  }

  // Calculate portfolio risk
  // portfolioRisk = (riskAmount / portfolioCapital) * 100
  const portfolioRisk = mathBigNum.equal(portfolioCapital, 0)
    ? mathBigNum.bignumber(0)
    : multiplyBig(divideBig(riskAmount, portfolioCapital), 100);

  // Calculate profit and profit fee
  let profitPrice: BigNumber | undefined;
  let profitPercent: BigNumber | undefined;
  let profitAmount: BigNumber | undefined;
  let profitFee: BigNumber | undefined;
  if (input.includeProfitGoal) {
    profitPrice = mathBigNum.bignumber(0);
    profitPercent = mathBigNum.bignumber(0);

    if (input.profitGoalTyp === ProfitGoalTyp.PRICED_BASED) {
      if (input.profitGoalUnit === ProfitGoalUnit.PRICED_BASED) {
        profitPrice = profitGoal;

        // profitPercent = (Math.abs(entryPrice - profitPrice) / entryPrice) * 100
        if (!mathBigNum.equal(entryPrice, 0)) {
          profitPercent = multiplyBig(
            divideBig(
              mathBigNum.abs(subtractBig(entryPrice, profitPrice)),
              entryPrice
            ),
            100
          );
          profitPercent = mathBigNum.round(profitPercent, input.precision);
        }
      } else {
        /*
          profitPrice = input.isLong
            ? entryPrice * (1 + profitGoal / 100)
            : entryPrice * (1 - profitGoal / 100);
        */
        let profitRate = divideBig(profitGoal, 100);
        profitRate = input.isLong
          ? addBig(1, profitRate)
          : subtractBig(1, profitRate);
        profitPrice = multiplyBig(entryPrice, profitRate);
        profitPrice = input.isLong
          ? mathBigNum.ceil(profitPrice, 5)
          : mathBigNum.floor(profitPrice, 5);

        // Recompute profit percent
        // profitPercent = (Math.abs(profitPrice - entryPrice) / entryPrice) * 100
        if (!mathBigNum.equal(entryPrice, 0)) {
          profitPercent = multiplyBig(
            divideBig(
              mathBigNum.abs(subtractBig(profitPrice, entryPrice)),
              entryPrice
            ),
            100
          );
          profitPercent = mathBigNum.round(profitPercent, 5);
        }
      }

      // exitAmount = profitPrice * quantity
      const exitAmount = multiplyBig(profitPrice, quantity);

      // profitAmount = Math.abs(grossEntryAmount - exitAmount)
      profitAmount = mathBigNum.abs(subtractBig(grossEntryAmount, exitAmount));
      if (input.includeTradingFee) {
        profitFee = mathBigNum.bignumber(0);

        // estimatedProfitFee = exitAmount * estFeeRate
        profitFee = multiplyBig(exitAmount, estFeeRate);
        profitFee = mathBigNum.round(profitFee, input.precision);
        if (mathBigNum.smaller(profitFee, minTradingFee)) {
          profitFee = minTradingFee;
        }

        // profitAmount = profitAmount - entryFee - profitFee
        if (entryFee !== undefined) {
          profitAmount = subtractBig(
            subtractBig(profitAmount, entryFee),
            profitFee
          );
        }
      }
    } else {
      // minProfit = portfolioCapital * (profitGoal / 100)
      const minProfit = multiplyBig(
        portfolioCapital,
        divideBig(profitGoal, 100)
      );

      if (entryFee !== undefined && realEntryFee !== undefined) {
        // including trading fee
        if (
          !mathBigNum.equal(quantity, 0) ||
          !input.isLong ||
          !mathBigNum.equal(estFeeRate, 1)
        ) {
          /* 
            profitPrice = input.isLong 
              ? (minProfit + entryFee + grossEntryAmount) / ((1 - estFeeRate) * quantity)
              : (grossEntryAmount - entryFee - minProfit) / ((1 + estFeeRate) * quantity)
          */
          if (input.isLong) {
            profitPrice = divideBig(
              addBig(addBig(minProfit, realEntryFee), grossEntryAmount),
              multiplyBig(subtractBig(1, estFeeRate), quantity)
            );
            profitPrice = mathBigNum.ceil(profitPrice, 5);
          } else {
            profitPrice = divideBig(
              subtractBig(
                subtractBig(grossEntryAmount, realEntryFee),
                minProfit
              ),
              multiplyBig(addBig(1, estFeeRate), quantity)
            );
            profitPrice = mathBigNum.floor(profitPrice, 5);
          }

          // Adjust the profit price to make sure it fullfil the minimum profit amount
          const { exitPrice, exitFee } = adjustProfitPrice(
            profitPrice,
            quantity,
            grossEntryAmount,
            realEntryFee,
            estFeeRate,
            minTradingFee,
            minProfit,
            input.isLong,
            input.precision
          );
          profitPrice = exitPrice;
          profitFee = exitFee;

          // profitAmount = Math.abs(profitPrice - entryPrice) * quantity - entryFee - profitFee;
          profitAmount = subtractBig(
            subtractBig(
              multiplyBig(
                mathBigNum.abs(subtractBig(profitPrice, entryPrice)),
                quantity
              ),
              entryFee
            ),
            profitFee
          );
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
            profitPrice = addBig(divideBig(minProfit, quantity), entryPrice);
            profitPrice = mathBigNum.ceil(profitPrice, 5);
          } else {
            profitPrice = subtractBig(
              entryPrice,
              divideBig(minProfit, quantity)
            );
            profitPrice = mathBigNum.floor(profitPrice, 5);
          }
        }

        // Adjust the profit price to make sure it fullfil the minimum profit amount
        const { exitPrice } = adjustProfitPrice(
          profitPrice,
          quantity,
          grossEntryAmount,
          mathBigNum.bignumber(0),
          mathBigNum.bignumber(0),
          mathBigNum.bignumber(0),
          minProfit,
          input.isLong,
          input.precision
        );
        profitPrice = exitPrice;

        // Recompute profit amount
        // profitAmount = Math.abs(profitPrice - entryPrice) * quantity
        profitAmount = multiplyBig(
          mathBigNum.abs(subtractBig(profitPrice, entryPrice)),
          quantity
        );
      }

      // profitPercent = (Math.abs(entryPrice - profitPrice) / entryPrice) * 100
      if (!mathBigNum.equal(entryPrice, 0)) {
        profitPercent = multiplyBig(
          divideBig(
            mathBigNum.abs(subtractBig(entryPrice, profitPrice)),
            entryPrice
          ),
          100
        );
        profitPercent = mathBigNum.round(profitPercent, input.precision);
      }
    }
  }

  // Calculate portfolio profit
  let portfolioProfit: BigNumber | undefined;
  if (profitAmount !== undefined) {
    // portfolioProfit = (profitAmount / portfolioCapital) * 100
    portfolioProfit = mathBigNum.bignumber(0);
    if (!mathBigNum.equal(portfolioCapital, 0)) {
      portfolioProfit = multiplyBig(
        divideBig(profitAmount, portfolioCapital),
        100
      );

      const roundedPortfolioProfit = mathBigNum.round(
        portfolioProfit,
        input.precision
      );
      if (
        input.profitGoalTyp === ProfitGoalTyp.PORTFOLIO_BASED &&
        mathBigNum.smaller(roundedPortfolioProfit, profitGoal)
      ) {
        portfolioProfit = mathBigNum.round(portfolioProfit, 5);
      } else {
        portfolioProfit = roundedPortfolioProfit;
      }
    }
  }

  // Calculate risk reward ratio and break even win rate
  let riskRewardRatio: BigNumber | undefined;
  let breakEvenWinRate: BigNumber | undefined;
  if (
    mathBigNum.larger(riskAmount, 0) &&
    profitAmount !== undefined &&
    mathBigNum.larger(profitAmount, 0)
  ) {
    // ratio = profitAmount / riskAmount
    riskRewardRatio = divideBig(profitAmount, riskAmount);

    // breakEvenWinRate = (1 / (1 + ratio)) * 100
    breakEvenWinRate = multiplyBig(
      divideBig(1, addBig(1, riskRewardRatio)),
      100
    );
  }

  return {
    isLong: input.isLong,
    includeTradingFee: input.includeTradingFee,
    includeProfitGoal: input.includeProfitGoal,
    entryPrice: entryPrice,
    stopPrice: stopPrice,
    stopPercent: stopPercent,
    profitPrice: profitPrice,
    profitPercent: profitPercent,
    quantity: quantityStr,
    entryAmount: entryAmount,
    grossEntryAmount: input.includeTradingFee ? grossEntryAmount : undefined,
    riskAmount: riskAmount,
    portfolioRisk: portfolioRisk,
    profitAmount: profitAmount,
    portfolioProfit: portfolioProfit,
    riskRewardRatio: riskRewardRatio,
    breakEvenWinRate: breakEvenWinRate,
    entryFee: entryFee,
    stopFee: stopFee,
    profitFee: profitFee,
  };
};

const calculateQuantity = (
  maxLoss: BigNumber,
  stopLossPrice: BigNumber,
  estFeeRate: BigNumber,
  minTradingFee: BigNumber,
  entryPrice: BigNumber,
  isLong: boolean,
  precision: number
): BigNumber => {
  let quantity = mathBigNum.bignumber(0);

  // Compute entry amount without fees
  if (mathBigNum.equal(estFeeRate, 0) && mathBigNum.equal(minTradingFee, 0)) {
    // quantity = maxLoss / Math.abs(entryPrice - stopLossPrice)
    quantity = divideBig(
      maxLoss,
      mathBigNum.abs(subtractBig(entryPrice, stopLossPrice))
    );

    return mathBigNum.floor(quantity, 6);
  }

  // Compute entry amount with fixed fee
  if (mathBigNum.equal(estFeeRate, 0) && mathBigNum.larger(minTradingFee, 0)) {
    // quantity = (maxLoss - minTradingFee * 2) / Math.abs(entryPrice - stopLossPrice)
    quantity = divideBig(
      subtractBig(maxLoss, multiplyBig(minTradingFee, 2)),
      mathBigNum.abs(subtractBig(entryPrice, stopLossPrice))
    );

    return mathBigNum.floor(quantity, 6);
  }

  // Compupte entry amount with estimation fees
  // Attempt 1: Assume both fees exceed minTradingFee

  // quantity = maxLoss / (Math.abs(entryPrice - stopLossPrice) + estFeeRate * (entryPrice + stopLossPrice))
  quantity = divideBig(
    maxLoss,
    addBig(
      mathBigNum.abs(subtractBig(entryPrice, stopLossPrice)),
      multiplyBig(estFeeRate, addBig(entryPrice, stopLossPrice))
    )
  );
  quantity = mathBigNum.floor(quantity, 6);

  // entryFee = quantity * entryPrice * estFeeRate
  let entryFee = multiplyBig(quantity, multiplyBig(entryPrice, estFeeRate));

  // stopLossFee = quantity * stopLossPrice * estFeeRate
  let stopLossFee = multiplyBig(
    quantity,
    multiplyBig(stopLossPrice, estFeeRate)
  );

  if (
    mathBigNum.largerEq(entryFee, minTradingFee) &&
    mathBigNum.largerEq(stopLossFee, minTradingFee)
  ) {
    return quantity;
  }

  // Attempt 2: Assume stop loss fee / entry fee is smaller than minTradingFee
  // quantity = isLong
  //   ? (maxLoss - minTradingFee) /
  //     (entryPrice - stopLossPrice + entryPrice * estFeeRate)
  //   : (maxLoss - minTradingFee) /
  //     (stopLossPrice - entryPrice + stopLossPrice * estFeeRate)
  quantity = isLong
    ? divideBig(
        subtractBig(maxLoss, minTradingFee),
        addBig(
          subtractBig(entryPrice, stopLossPrice),
          multiplyBig(entryPrice, estFeeRate)
        )
      )
    : divideBig(
        subtractBig(maxLoss, minTradingFee),
        addBig(
          subtractBig(stopLossPrice, entryPrice),
          multiplyBig(stopLossPrice, estFeeRate)
        )
      );
  quantity = mathBigNum.floor(quantity, 6);

  // entryFee = quantity * entryPrice * estFeeRate
  entryFee = multiplyBig(quantity, multiplyBig(entryPrice, estFeeRate));

  // stopLossFee = quantity * stopLossPrice * estFeeRate
  stopLossFee = multiplyBig(quantity, multiplyBig(stopLossPrice, estFeeRate));

  if (
    mathBigNum.largerEq(entryFee, minTradingFee) &&
    mathBigNum.largerEq(stopLossFee, minTradingFee)
  ) {
    return quantity;
  }

  // Attempt 3: Assume both fees smaller than minTradingFee
  // quantity = (maxLoss - 2 * minTradingFee) / Math.abs(stopLossPrice - entryPrice);
  quantity = divideBig(
    subtractBig(maxLoss, multiplyBig(minTradingFee, 2)),
    mathBigNum.abs(subtractBig(stopLossPrice, entryPrice))
  );
  return mathBigNum.floor(quantity, 6);
};

const calculateCurrentLoss = (
  quantity: BigNumber,
  entryPrice: BigNumber,
  stopPrice: BigNumber,
  feeRate: BigNumber,
  minFee: BigNumber,
  precision: number
): BigNumber => {
  // grossEntryAmt = quantity * entryPrice
  const grossEntryAmt = multiplyBig(quantity, entryPrice);

  // stopAmt = quantity * stopPrice
  const stopAmt = multiplyBig(quantity, stopPrice);

  // entryFee = grossEntryAmt * feeRate
  let entryFee = multiplyBig(grossEntryAmt, feeRate);
  const roundedEntryFee = mathBigNum.round(entryFee, precision);
  entryFee = mathBigNum.larger(entryFee, roundedEntryFee)
    ? entryFee
    : roundedEntryFee;
  if (mathBigNum.smaller(roundedEntryFee, minFee)) {
    entryFee = minFee;
  }

  // stopFee = stopAmt * feeRate
  let stopFee = multiplyBig(stopAmt, feeRate);
  const roundedStopFee = mathBigNum.round(stopFee, precision);
  stopFee = mathBigNum.larger(stopFee, roundedStopFee)
    ? stopFee
    : roundedStopFee;
  if (mathBigNum.smaller(stopFee, minFee)) {
    stopFee = minFee;
  }

  // currentLoss = Math.abs(grossEntryAmt - stopAmt) + entryFee + stopFee
  const currentLoss = addBig(
    mathBigNum.abs(subtractBig(grossEntryAmt, stopAmt)),
    addBig(entryFee, stopFee)
  );

  return currentLoss;
};

const adjustProfitPrice = (
  profitPrice: BigNumber,
  quantity: BigNumber,
  entryAmt: BigNumber,
  entryFee: BigNumber,
  feeRate: BigNumber,
  minFee: BigNumber,
  minProfit: BigNumber,
  isLong: boolean,
  precision: number
): { exitPrice: BigNumber; exitFee: BigNumber } => {
  if (mathBigNum.equal(entryAmt, 0)) {
    return {
      exitPrice: mathBigNum.bignumber(0),
      exitFee: mathBigNum.bignumber(0),
    };
  }

  // exitAmount = profitPrice * quantity
  let exitAmount = multiplyBig(profitPrice, quantity);

  // exitFee = exitAmount * feeRate
  let exitFee = mathBigNum.bignumber(0);
  if (mathBigNum.larger(exitAmount, 0)) {
    exitFee = multiplyBig(exitAmount, feeRate);
    const roundedExitFee = mathBigNum.round(exitFee, precision);
    exitFee = mathBigNum.larger(exitFee, roundedExitFee)
      ? exitFee
      : roundedExitFee;
  }
  if (exitFee < minFee) exitFee = minFee;

  // profitAmt = Math.abs(exitAmount - entryAmt) - entryFee - exitFee
  let profitAmt = subtractBig(
    subtractBig(mathBigNum.abs(subtractBig(exitAmount, entryAmt)), entryFee),
    exitFee
  );

  while (mathBigNum.smaller(profitAmt, minProfit)) {
    // profitPrice = isLong ? profitPrice + 0.00001: profitPrice - 0.00001
    profitPrice = isLong
      ? addBig(profitPrice, 0.00001)
      : subtractBig(profitPrice, 0.00001);

    // exitAmount = profitPrice * quantity;
    exitAmount = multiplyBig(profitPrice, quantity);

    // exitFee = exitAmount * feeRate
    exitFee = mathBigNum.bignumber(0);
    if (mathBigNum.larger(exitAmount, 0)) {
      exitFee = multiplyBig(exitAmount, feeRate);
      const roundedExitFee = mathBigNum.round(exitFee, precision);
      exitFee = mathBigNum.larger(exitFee, roundedExitFee)
        ? exitFee
        : roundedExitFee;
    }
    if (mathBigNum.smaller(exitFee, minFee)) exitFee = minFee;

    // profitAmt = Math.abs(exitAmount - entryAmt) - entryFee - exitFee
    profitAmt = subtractBig(
      subtractBig(mathBigNum.abs(subtractBig(exitAmount, entryAmt)), entryFee),
      exitFee
    );
  }

  if (mathBigNum.larger(exitFee, minFee)) {
    exitFee = mathBigNum.round(exitFee, precision);
  }

  return { exitPrice: profitPrice, exitFee: exitFee };
};
