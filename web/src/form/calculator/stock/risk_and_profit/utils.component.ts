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
import { checkMinMax } from "../../../../common/validation/calculator.validation";
import { StockOrderInputType } from "../../../../component/stock/order/order.type";
import {
  ERROR_FIELD_RISK_AND_PROFIT,
  OrderResultType,
  RiskAndProfitInputType,
  RiskAndProfitResultType,
} from "./risk_and_profit.type";

export const validateRiskAndProfitInput = (
  input: RiskAndProfitInputType
): { err: string; field: ERROR_FIELD_RISK_AND_PROFIT | null } => {
  if (
    !checkMinMax(input.portfolioCapital, { min: 0, maxOrEqual: QUINTILLION })
  ) {
    return {
      err: "Please enter a valid portfolio capital.",
      field: ERROR_FIELD_RISK_AND_PROFIT.PORTFOLIO_CAPITAL,
    };
  }

  if (input.includeTradingFee) {
    if (!checkMinMax(input.estTradingFee, { min: 0, maxOrEqual: 100 })) {
      return {
        err: "Please estimates a valid trading fee.",
        field: ERROR_FIELD_RISK_AND_PROFIT.EST_TRADING_FEE,
      };
    }

    if (
      !checkMinMax(input.minTradingFee, { min: 0, maxOrEqual: QUADRILLION })
    ) {
      return {
        err: "Please enter a valid minimum trading fee.",
        field: ERROR_FIELD_RISK_AND_PROFIT.MIN_TRADING_FEE,
      };
    }
  }

  return { err: "", field: null };
};

export const calculateResult = (
  input: RiskAndProfitInputType,
  orders: StockOrderInputType[]
): RiskAndProfitResultType => {
  const ordersResult: OrderResultType[] = [];

  // Parse inputs
  const portfolioCapital = parseBigNumberFromString(input.portfolioCapital);
  const tradingFee = parseBigNumberFromString(input.estTradingFee);
  const minTradingFee = parseBigNumberFromString(input.minTradingFee);
  const estFeeRate = divideBig(tradingFee, 100);

  let totalGrossEntryAmount = mathBigNum.bignumber(0);
  let totalEntryAmount = mathBigNum.bignumber(0);
  let totalRiskAmount = mathBigNum.bignumber(0);
  let totalProfitAmount = mathBigNum.bignumber(0);
  let totalLong = 0;
  let totalShort = 0;
  let hasProfitGoal = false;

  for (let i = 0; i < orders.length; i++) {
    // Process input for each order
    const entryPrice = parseBigNumberFromString(orders[i].entryPrice);
    const quantity = parseBigNumberFromString(orders[i].quantity);
    const stopLoss = parseBigNumberFromString(orders[i].stopLoss);
    const profitGoal = parseBigNumberFromString(orders[i].profitGoal);
    const includeProfitGoal = orders[i].includeProfitGoal;
    const isLong = orders[i].isLong;

    if (isLong) {
      totalLong = totalLong + 1;
    } else {
      totalShort = totalShort + 1;
    }

    // Calculate entry amount
    // grossEntryAmt = entryPrice * quantity;
    const grossEntryAmount = multiplyBig(entryPrice, quantity);
    let entryAmount = grossEntryAmount;

    // Calculate stop loss percent
    // stopLossPercent = (Math.abs(entryPrice - stopLoss) / entryPrice) * 100
    let stopLossPercent = mathBigNum.bignumber(0);
    if (!mathBigNum.equal(entryPrice, 0)) {
      stopLossPercent = multiplyBig(
        divideBig(
          mathBigNum.abs(subtractBig(entryPrice, stopLoss)),
          entryPrice
        ),
        100
      );
    }

    // Calculate stop loss exit amount
    // stopExitAmount = stopLoss * quantity;
    const stopExitAmount = multiplyBig(stopLoss, quantity);

    // Calculate risk amount
    // riskAmount = Math.abs(grossEntryAmount - exitAmount);
    let riskAmount = mathBigNum.abs(
      subtractBig(grossEntryAmount, stopExitAmount)
    );

    // Calculate profit exit amount
    // profitExitAmount = profitGoal * quantity
    const profitExitAmount = multiplyBig(profitGoal, quantity);

    // Calcualte profit
    let profitAmount: BigNumber | undefined;
    let profitPercent: BigNumber | undefined;
    if (includeProfitGoal) {
      hasProfitGoal = true;

      // Calculate profit percent
      // profitPercent = (Math.abs(entryPrice - profitGoal) / entryPrice) * 100
      profitPercent = mathBigNum.bignumber(0);
      if (!mathBigNum.equal(entryPrice, 0)) {
        profitPercent = multiplyBig(
          divideBig(
            mathBigNum.abs(subtractBig(entryPrice, profitGoal)),
            entryPrice
          ),
          100
        );
      }

      // Calculate profit amount
      // profitAmount = Math.abs(entryPrice - profitGoal) * quantity
      profitAmount = multiplyBig(
        mathBigNum.abs(subtractBig(entryPrice, profitGoal)),
        quantity
      );
    }

    // calculate fees and entry amount
    let entryFee: BigNumber | undefined;
    let stopFee: BigNumber | undefined;
    let profitFee: BigNumber | undefined;
    if (input.includeTradingFee) {
      // Calculate entry fee
      // entryFee = entryAmount * estFeeRate
      entryFee = multiplyBig(grossEntryAmount, estFeeRate);
      entryFee = mathBigNum.round(entryFee, input.precision);
      if (mathBigNum.smaller(entryFee, minTradingFee)) {
        entryFee = minTradingFee;
      }

      // Recompute entry amount
      entryAmount = addBig(grossEntryAmount, entryFee);

      // Calculate stop fee
      // stopFee = stopExitAmount * estFeeRate
      stopFee = multiplyBig(stopExitAmount, estFeeRate);
      stopFee = mathBigNum.round(stopFee, input.precision);
      if (mathBigNum.smaller(stopFee, minTradingFee)) {
        stopFee = minTradingFee;
      }

      // Recompute risk amount
      // riskAmount = riskAmount + entryFee + stopFee
      riskAmount = addBig(addBig(riskAmount, entryFee), stopFee);

      if (profitAmount !== undefined) {
        // Calculate profit fee
        // profitFee = profitExitAmount * estFeeRate
        profitFee = multiplyBig(profitExitAmount, estFeeRate);
        profitFee = mathBigNum.round(profitFee, input.precision);
        if (mathBigNum.smaller(profitFee, minTradingFee)) {
          profitFee = minTradingFee;
        }

        // Recompute profit amount
        // profitAmount = profitAmount - entryFee - profitFee
        profitAmount = subtractBig(
          subtractBig(profitAmount, entryFee),
          profitFee
        );

        if (mathBigNum.smaller(profitAmount, 0)) {
          profitAmount = mathBigNum.bignumber(0);
        }
      }
    }

    // Calculate total risk amount
    // totalRiskAmount = totalRiskAmount + riskAmount
    totalRiskAmount = addBig(totalRiskAmount, riskAmount);

    // Calculate total profit amount
    if (profitAmount !== undefined) {
      // totalProfitAmount = totalProfitAmount + profitAmount
      totalProfitAmount = addBig(totalProfitAmount, profitAmount);
    }

    // Calculate portfolio risk and profit
    let portfolioRisk = mathBigNum.bignumber(0);
    let portfolioProfit = mathBigNum.bignumber(0);
    if (mathBigNum.unequal(portfolioCapital, 0)) {
      // portfolioRisk = (riskAmount / portfolioCapital) * 100
      portfolioRisk = multiplyBig(divideBig(riskAmount, portfolioCapital), 100);

      // portfolioProfit = (profitAmount / portfolioCapital) * 100
      if (profitAmount !== undefined) {
        portfolioProfit = multiplyBig(
          divideBig(profitAmount, portfolioCapital),
          100
        );
      }
    }

    // Calculate risk reward ratio and break even win rate
    let ratio: BigNumber | undefined;
    let breakEvenWinRate: BigNumber | undefined;
    if (
      profitAmount !== undefined &&
      mathBigNum.larger(riskAmount, 0) &&
      mathBigNum.larger(profitAmount, 0)
    ) {
      // ratio = profitAmount / riskAmount
      ratio = divideBig(profitAmount, riskAmount);

      // breakEvenWinRate = (1 / (1 + ratio)) * 100
      breakEvenWinRate = multiplyBig(divideBig(1, addBig(1, ratio)), 100);
    }

    // Calculate total entry amount
    // totalGrossEntryAmount = totalEntryAmount + entryAmount;
    totalGrossEntryAmount = addBig(totalGrossEntryAmount, grossEntryAmount);

    // Calculate total entry amount
    // totalEntryAmount = totalEntryAmount + entryAmount;
    totalEntryAmount = addBig(totalEntryAmount, entryAmount);

    // update results
    ordersResult.push({
      isLong: isLong,
      entryPrice: entryPrice,
      stopLossPrice: stopLoss,
      stopLossPercent: stopLossPercent,
      profitPrice: includeProfitGoal ? profitGoal : undefined,
      profitPercent: profitPercent,
      grossEntryAmount: input.includeTradingFee ? grossEntryAmount : undefined,
      entryAmount: entryAmount,
      riskAmount: riskAmount,
      profitAmount: profitAmount,
      entryFee: entryFee,
      stopLossFee: stopFee,
      profitFee: profitFee,
      portfolioRisk: portfolioRisk,
      portfolioProfit: portfolioProfit,
      riskRewardRatio: ratio,
      breakEvenWinRate: breakEvenWinRate,
      quantity: quantity,
    });
  }

  // portfolioRisk = (totalRiskAmount / portfolioCapital) * 100
  let portfolioRisk = mathBigNum.bignumber(0);
  if (!mathBigNum.equal(portfolioCapital, 0)) {
    portfolioRisk = multiplyBig(
      divideBig(totalRiskAmount, portfolioCapital),
      100
    );
  }

  let portfolioProfit: BigNumber | undefined;
  let riskRewardRatio: BigNumber | undefined;
  let breakEvenWinRate: BigNumber | undefined;
  if (hasProfitGoal) {
    // portfolioProfit = (totalProfitAmount / portfolioCapital) * 100;
    portfolioProfit = mathBigNum.bignumber(0);
    if (!mathBigNum.equal(portfolioCapital, 0)) {
      portfolioProfit = multiplyBig(
        divideBig(totalProfitAmount, portfolioCapital),
        100
      );
    }
    if (
      mathBigNum.larger(totalRiskAmount, 0) &&
      mathBigNum.larger(totalProfitAmount, 0)
    ) {
      // ratio = totalProfitAmount / totalRiskAmount
      riskRewardRatio = divideBig(totalProfitAmount, totalRiskAmount);

      // breakEvenWinRate = (1 / (1 + ratio)) * 100
      breakEvenWinRate = multiplyBig(
        divideBig(1, addBig(1, riskRewardRatio)),
        100
      );
    }
  }

  return {
    totalEntryAmount: totalEntryAmount,
    totalGrossEntryAmount: input.includeTradingFee
      ? totalGrossEntryAmount
      : undefined,
    totalRiskAmount: totalRiskAmount,
    totalProfitAmount: hasProfitGoal ? totalProfitAmount : undefined,
    portfolioRisk: portfolioRisk,
    portfolioProfit: portfolioProfit,
    riskRewardRatio: riskRewardRatio,
    breakEvenWinRate: breakEvenWinRate,
    includeTradingFee: input.includeTradingFee,
    orders: ordersResult,
    totalLong: totalLong,
    totalShort: totalShort,
  };
};
