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
import {
  convertToLocaleString,
  parseBigNumberFromString,
} from "../../../../common/number/number";
import {
  checkMinMax,
  CheckMinMaxOption,
} from "../../../../common/validation/calculator.validation";
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
  if (!checkMinMax(input.portfolioCapital, { min: 0, maxOrEqual: QUINTILLION })) {
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
  if (input.stopLossTyp === "$") {
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
      if (input.profitGoalUnit === "$") {
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
    if (!checkMinMax(input.estTradingFee, { min: 0, max: 100 })) {
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
  if (input.stopLossTyp === "$") {
    stopPrice = stopLoss;
    if (!mathBigNum.equal(entryPrice, 0)) {
      // stopPercent = (Math.abs(entryPrice - stopLoss) / entryPrice) * 100
      const stopRate = divideBig(
        mathBigNum.abs(subtractBig(entryPrice, stopLoss)),
        entryPrice
      );
      stopPercent = multiplyBig(stopRate, 100);
      stopPercent = mathBigNum.round(stopPercent, 5);
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
        quantity = subtractBig(quantity, 0.000001);
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
      const lot = mathBigNum.floor(divideBig(quantity, 100));
      quantity = multiplyBig(lot, 100);
      quantityStr = lot.toString() + " Lot";
      break;
  }

  // Calculate entry amount
  // entryAmount = entryPrice * quantity
  const entryAmount = multiplyBig(entryPrice, quantity);

  // Calculate risk amount
  // riskAmount = Math.abs(entryPrice - stopPrice) * quantity
  let riskAmount = multiplyBig(
    mathBigNum.abs(subtractBig(entryPrice, stopPrice)),
    quantity
  );

  // Calculate entry fee and stop fee
  let estimatedEntryFee: BigNumber | undefined;
  let estimatedEntryFeeStr: string | undefined;
  let estimatedStopFeeStr: string | undefined;
  if (input.includeTradingFee) {
    // estimatedEntryFee = entryAmount * estFeeRate;
    estimatedEntryFee = multiplyBig(entryAmount, estFeeRate);
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
    let estimatedStopFee = multiplyBig(
      stopPrice,
      multiplyBig(quantity, estFeeRate)
    );
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
    riskAmount = addBig(
      riskAmount,
      addBig(estimatedEntryFee, estimatedStopFee)
    );
  }

  // Calculate portfolio risk
  // portfolioRisk = (riskAmount / portfolioCapital) * 100
  const portfolioRisk = mathBigNum.equal(portfolioCapital, 0)
    ? mathBigNum.bignumber(0)
    : multiplyBig(divideBig(riskAmount, portfolioCapital), 100);

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
          profitPercent = multiplyBig(
            divideBig(
              mathBigNum.abs(subtractBig(entryPrice, profitPrice)),
              entryPrice
            ),
            100
          );
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
        }
      }

      // exitAmount = profitPrice * quantity
      const exitAmount = multiplyBig(profitPrice, quantity);

      // profitAmount = Math.abs(entryAmount - exitAmount)
      profitAmount = mathBigNum.abs(subtractBig(entryAmount, exitAmount));
      if (input.includeTradingFee) {
        // estimatedProfitFee = exitAmount * estFeeRate
        estimatedProfitFee = multiplyBig(exitAmount, estFeeRate);
        estimatedProfitFee = mathBigNum.round(estimatedProfitFee, 5);

        if (
          mathBigNum.smaller(estimatedProfitFee, minTradingFee) &&
          mathBigNum.larger(entryAmount, 0)
        ) {
          estimatedProfitFee = minTradingFee;
        }

        // profitAmount = profitAmount - estimatedEntryFee - estimatedProfitFee
        profitAmount = subtractBig(profitAmount, estimatedProfitFee);
        if (estimatedEntryFee !== undefined) {
          profitAmount = subtractBig(profitAmount, estimatedEntryFee);
        }
      }
    } else {
      // minProfit = portfolioCapital * (profitGoal / 100)
      const minProfit = multiplyBig(
        portfolioCapital,
        divideBig(profitGoal, 100)
      );

      if (estimatedEntryFee !== undefined) {
        // including trading fee
        if (!mathBigNum.equal(quantity, 0)) {
          /* 
            profitPrice = input.isLong 
              ? (minProfit + estimatedEntryFee + entryAmount) / ((1 - estFeeRate) * quantity)
              : (entryAmount - estimatedEntryFee - minProfit) / ((1 + estFeeRate) * quantity)
          */
          if (input.isLong) {
            profitPrice = divideBig(
              addBig(addBig(minProfit, estimatedEntryFee), entryAmount),
              multiplyBig(subtractBig(1, estFeeRate), quantity)
            );
            profitPrice = mathBigNum.ceil(profitPrice, 5);
          } else {
            profitPrice = divideBig(
              subtractBig(
                subtractBig(entryAmount, estimatedEntryFee),
                minProfit
              ),
              multiplyBig(addBig(1, estFeeRate), quantity)
            );
            profitPrice = mathBigNum.floor(profitPrice, 5);
          }
        }

        // estimatedProfitFee = profitPrice * quantity * estFeeRate
        estimatedProfitFee = multiplyBig(
          multiplyBig(profitPrice, quantity),
          estFeeRate
        );
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
            profitPrice = divideBig(
              addBig(
                minProfit,
                addBig(
                  entryAmount,
                  addBig(estimatedEntryFee, estimatedProfitFee)
                )
              ),
              quantity
            );
            profitPrice = mathBigNum.ceil(profitPrice, 5);
          } else {
            profitPrice = divideBig(
              subtractBig(
                subtractBig(
                  subtractBig(entryAmount, estimatedEntryFee),
                  estimatedProfitFee
                ),
                minProfit
              ),
              quantity
            );
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
          profitAmount = subtractBig(
            subtractBig(
              multiplyBig(
                mathBigNum.abs(subtractBig(profitPrice, entryPrice)),
                quantity
              ),
              estimatedEntryFee
            ),
            estimatedProfitFee
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
          entryAmount,
          mathBigNum.bignumber(0),
          mathBigNum.bignumber(0),
          mathBigNum.bignumber(0),
          minProfit,
          input.isLong
        );
        profitPrice = exitPrice;

        // Recompute profit amount
        // profitAmount = Math.abs(profitPrice - entryPrice) * quantity
        profitAmount = multiplyBig(
          mathBigNum.abs(subtractBig(profitPrice, entryPrice)),
          quantity
        );
      }
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
      portfolioProfit = multiplyBig(
        divideBig(profitAmount, portfolioCapital),
        100
      );
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
    let ratio = divideBig(riskAmount, profitAmount);
    let roundedRatio = mathBigNum.round(ratio, 2);

    if (mathBigNum.largerEq(roundedRatio, 1)) {
      riskRewardRatioStr = `${ratio}:1`;
    } else {
      riskRewardRatioStr = `1:${convertToLocaleString(
        divideBig(1, ratio).toString(),
        0,
        2
      )}`;
    }

    // breakEvenWinRate = (1 / (1 + 1 / ratio)) * 100
    const breakEvenWinRate = multiplyBig(
      divideBig(1, addBig(1, divideBig(1, ratio))),
      100
    );
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
  estFeeRate: BigNumber,
  minTradingFee: BigNumber,
  entryPrice: BigNumber,
  isLong: boolean
): BigNumber => {
  let quantity = mathBigNum.bignumber(0);

  // Compute trading amount without fees
  if (mathBigNum.equal(estFeeRate, 0) && mathBigNum.equal(minTradingFee, 0)) {
    // quantity = maxLoss / Math.abs(entryPrice - stopLossPrice)
    quantity = divideBig(
      maxLoss,
      mathBigNum.abs(subtractBig(entryPrice, stopLossPrice))
    );

    return mathBigNum.floor(quantity, 6);
  }

  // Compute trading amount with fixed fee
  if (mathBigNum.equal(estFeeRate, 0) && mathBigNum.larger(minTradingFee, 0)) {
    // quantity = (maxLoss - minTradingFee * 2) / Math.abs(entryPrice - stopLossPrice)
    quantity = divideBig(
      subtractBig(maxLoss, multiplyBig(minTradingFee, 2)),
      mathBigNum.abs(subtractBig(entryPrice, stopLossPrice))
    );

    return mathBigNum.floor(quantity, 6);
  }

  // Compupte trading amount with estimation fees
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
  entryFee = mathBigNum.round(entryFee, 5);

  // stopLossFee = quantity * stopLossPrice * estFeeRate
  let stopLossFee = multiplyBig(
    quantity,
    multiplyBig(stopLossPrice, estFeeRate)
  );
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
    ? divideBig(
        subtractBig(maxLoss, minTradingFee),
        addBig(
          subtractBig(entryPrice, stopLossPrice),
          multiplyBig(entryFee, estFeeRate)
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
  entryFee = mathBigNum.round(entryFee, 5);

  // stopLossFee = quantity * stopLossPrice * estFeeRate
  stopLossFee = multiplyBig(quantity, multiplyBig(stopLossPrice, estFeeRate));
  stopLossFee = mathBigNum.round(stopLossFee, 5);

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
  minFee: BigNumber
): BigNumber => {
  // entryAmt = quantity * entryPrice
  const entryAmt = multiplyBig(quantity, entryPrice);

  // stopAmt = quantity * stopPrice
  const stopAmt = multiplyBig(quantity, stopPrice);

  // entryFee = entryAmt * feeRate
  let entryFee = multiplyBig(entryAmt, feeRate);
  entryFee = mathBigNum.round(entryFee, 5);
  if (mathBigNum.smaller(entryFee, minFee)) {
    entryFee = minFee;
  }

  // stopFee = stopAmt * feeRate
  let stopFee = multiplyBig(stopAmt, feeRate);
  stopFee = mathBigNum.round(stopFee, 5);
  if (mathBigNum.smaller(stopFee, minFee)) {
    stopFee = minFee;
  }

  // currentLoss = Math.abs(entryAmt - stopAmt) + entryFee + stopFee
  const currentLoss = addBig(
    mathBigNum.abs(subtractBig(entryAmt, stopAmt)),
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
  isLong: boolean
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
    exitFee = mathBigNum.round(exitFee, 5);
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
      exitFee = mathBigNum.round(exitFee, 5);
    }
    if (mathBigNum.smaller(exitFee, minFee)) exitFee = minFee;

    // profitAmt = Math.abs(exitAmount - entryAmt) - entryFee - exitFee
    profitAmt = subtractBig(
      subtractBig(mathBigNum.abs(subtractBig(exitAmount, entryAmt)), entryFee),
      exitFee
    );
  }

  return { exitPrice: profitPrice, exitFee: exitFee };
};
