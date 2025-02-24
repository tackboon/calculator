import { parseNumberFromString } from "../../../../common/number/number";
import { checkMinMax } from "../../../../common/validation/calculator.validation";
import { StockOrderInputType } from "../../../../component/order/stock/order.component";
import {
  ERROR_FIELD_RISK_AND_PROFIT,
  OrderResultType,
  RiskAndProfitInputType,
  RiskAndProfitResultType,
} from "./risk_and_profit.component";

export const validateRiskAndProfitInput = (
  input: RiskAndProfitInputType
): { err: string; field: ERROR_FIELD_RISK_AND_PROFIT | null } => {
  if (!checkMinMax(input.portfolioCapital, 0)) {
    return {
      err: "Please enter a valid portfolio capital.",
      field: ERROR_FIELD_RISK_AND_PROFIT.PORTFOLIO_CAPITAL,
    };
  }

  if (input.includeTradingFee) {
    if (!checkMinMax(input.estTradingFee, 0, 100)) {
      return {
        err: "Please estimates a valid trading fee.",
        field: ERROR_FIELD_RISK_AND_PROFIT.EST_TRADING_FEE,
      };
    }

    if (!checkMinMax(input.minTradingFee, 0)) {
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
  const portfolioCapital = parseNumberFromString(input.portfolioCapital);
  const tradingFee = parseNumberFromString(input.estTradingFee);
  const minTradingFee = parseNumberFromString(input.minTradingFee);
  const estFeeRate = tradingFee / 100;

  let totalEntryAmount = 0;
  let totalRiskAmount = 0;
  let totalProfitAmount = 0;
  let totalLong = 0;
  let totalShort = 0;
  let hasProfitGoal = false;

  for (let i = 0; i < orders.length; i++) {
    // Process input for each order
    const entryPrice = parseNumberFromString(orders[i].entryPrice);
    const quantity = parseNumberFromString(orders[i].quantity);
    const stopLoss = parseNumberFromString(orders[i].stopLoss);
    const profitGoal = parseNumberFromString(orders[i].profitGoal);
    const includeProfitGoal = orders[i].includeProfitGoal;
    const isLong = orders[i].isLong;

    if (isLong) {
      totalLong = totalLong + 1;
    } else {
      totalShort = totalShort + 1;
    }

    // calculate entry amount
    const entryAmt = entryPrice * quantity;
    totalEntryAmount = totalEntryAmount + entryAmt;

    // calculate stop loss percent
    const stopLossPercent =
      entryPrice === 0 ? 0 : Math.abs(entryPrice - stopLoss) / entryPrice;

    // calculate stop loss amount
    const exitAmt = stopLoss * quantity;

    // calculate risk amount
    let riskAmt = Math.abs(entryAmt - exitAmt);
    totalRiskAmount = totalRiskAmount + riskAmt;

    // calcualte profit
    let profitPercent;
    let profitAmt;
    if (includeProfitGoal) {
      hasProfitGoal = true;

      profitPercent =
        entryPrice === 0 ? 0 : Math.abs(entryPrice - profitGoal) / entryPrice;
      profitAmt = Math.abs(entryPrice - profitGoal) * quantity;
    }

    // calculate fees
    let estimatedEntryFee;
    let estimatedStopFee;
    let estimatedProfitFee;
    if (input.includeTradingFee) {
      estimatedEntryFee = entryAmt * estFeeRate;
      if (estimatedEntryFee < minTradingFee) estimatedEntryFee = minTradingFee;

      estimatedStopFee = exitAmt * estFeeRate;
      if (estimatedStopFee < minTradingFee) estimatedStopFee = minTradingFee;

      riskAmt = riskAmt - estimatedEntryFee - estimatedStopFee;

      if (profitAmt !== undefined) {
        estimatedProfitFee = profitAmt * estFeeRate;
        if (estimatedProfitFee < minTradingFee)
          estimatedProfitFee = minTradingFee;
        profitAmt = profitAmt - estimatedEntryFee - estimatedProfitFee;
      }
    }

    if (profitAmt) totalProfitAmount = totalProfitAmount + profitAmt;

    // calculate portfolio risk and profit
    const portfolioRisk =
      portfolioCapital === 0 ? 0 : (riskAmt / portfolioCapital) * 100;
    let portfolioProfit;
    if (profitAmt !== undefined) {
      portfolioProfit =
        portfolioCapital === 0 ? 0 : (profitAmt / portfolioCapital) * 100;
    }

    // calculate risk reward ratio
    let riskRewardRatio;
    if (riskAmt && profitAmt) {
      const ratio = riskAmt / profitAmt;
      riskRewardRatio =
        ratio >= 1
          ? `${ratio.toLocaleString("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}:1`
          : `1:${(1 / ratio).toLocaleString("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}`;
    }

    // update results
    ordersResult.push({
      isLong: isLong,
      entryAmount: entryAmt,
      entryPrice: entryPrice,
      stopLossPrice: stopLoss,
      stopLossPercent: stopLossPercent,
      profitPrice: profitGoal,
      profitPercent: profitPercent,
      riskAmount: riskAmt,
      profitAmount: profitAmt,
      entryFee: estimatedEntryFee,
      stopLossFee: estimatedStopFee,
      profitFee: estimatedProfitFee,
      portfolioRisk: portfolioRisk,
      portfolioProfit: portfolioProfit,
      riskRewardRatio: riskRewardRatio,
      quantity: quantity,
    });
  }

  const portfolioRisk =
    portfolioCapital === 0 ? 0 : (totalRiskAmount / portfolioCapital) * 100;
  let portfolioProfit;
  let riskRewardRatio;
  if (hasProfitGoal) {
    portfolioProfit =
      portfolioCapital === 0 ? 0 : (totalProfitAmount / portfolioCapital) * 100;

    if (totalProfitAmount > 0) {
      const ratio = totalRiskAmount / totalProfitAmount;
      riskRewardRatio =
        ratio >= 1
          ? `${ratio.toLocaleString("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}:1`
          : `1:${(1 / ratio).toLocaleString("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}`;
    }
  }

  return {
    hasProfitGoal: hasProfitGoal,
    totalEntryAmount: totalEntryAmount,
    totalRiskAmount: totalRiskAmount,
    totalProfitAmount: totalProfitAmount,
    portfolioRisk: portfolioRisk,
    portfolioProfit: portfolioProfit,
    riskRewardRatio: riskRewardRatio,
    includeTradingFee: input.includeTradingFee,
    orders: ordersResult,
    totalLong: totalLong,
    totalShort: totalShort,
  };
};
