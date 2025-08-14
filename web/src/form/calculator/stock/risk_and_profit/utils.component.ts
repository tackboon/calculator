import { BigNumber } from "mathjs";
import {
  addBig,
  divideBig,
  mathBigNum,
  multiplyBig,
  QUADRILLION,
  subtractBig,
} from "../../../../common/number/math";
import {
  convertToLocaleString,
  parseBigNumberFromString,
} from "../../../../common/number/number";
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
  if (!checkMinMax(input.portfolioCapital, { min: 0 })) {
    return {
      err: "Please enter a valid portfolio capital.",
      field: ERROR_FIELD_RISK_AND_PROFIT.PORTFOLIO_CAPITAL,
    };
  }

  if (input.includeTradingFee) {
    if (!checkMinMax(input.estTradingFee, { min: 0, max: 100 })) {
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
    // entryAmt = entryPrice * quantity;
    const entryAmount = multiplyBig(entryPrice, quantity);

    // Calculate total entry amount
    // totalEntryAmount = totalEntryAmount + entryAmount;
    totalEntryAmount = addBig(totalEntryAmount, entryAmount);

    // Calculate stop loss percent
    // stopLossPercent = (Math.abs(entryPrice - stopLoss) / entryPrice) * 100
    let stopLossPercent = mathBigNum.bignumber(0);
    let stopLossPercentStr = "0";
    if (!mathBigNum.equal(entryPrice, 0)) {
      stopLossPercent = multiplyBig(
        divideBig(
          mathBigNum.abs(subtractBig(entryPrice, stopLoss)),
          entryPrice
        ),
        100
      ) as BigNumber;
      stopLossPercentStr = convertToLocaleString(
        stopLossPercent.toString(),
        2,
        5
      );
    }

    // Calculate stop loss amount
    // exitAmount = stopLoss * quantity;
    const exitAmount = mathBigNum.multiply(stopLoss, quantity) as BigNumber;

    // Calculate risk amount
    // riskAmount = Math.abs(entryAmount - exitAmount);
    let riskAmount = mathBigNum.abs(
      mathBigNum.subtract(entryAmount, exitAmount)
    );

    // Calcualte profit
    let profitPercentStr: string | undefined;
    let profitAmount: BigNumber | undefined;
    if (includeProfitGoal) {
      hasProfitGoal = true;

      // Calculate profit percent
      // profitPercent = (Math.abs(entryPrice - profitGoal) / entryPrice) * 100
      let profitPercent = mathBigNum.bignumber(0);
      if (!mathBigNum.equal(entryPrice, 0)) {
        profitPercent = mathBigNum.multiply(
          mathBigNum.divide(
            mathBigNum.abs(mathBigNum.subtract(entryPrice, profitGoal)),
            entryPrice
          ),
          100
        ) as BigNumber;
        profitPercentStr = convertToLocaleString(
          profitPercent.toString(),
          2,
          5
        );
      }

      // Calculate profit amount
      // profitAmount = Math.abs(entryPrice - profitGoal) * quantity
      profitAmount = mathBigNum.multiply(
        mathBigNum.abs(mathBigNum.subtract(entryPrice, profitGoal)),
        quantity
      ) as BigNumber;
    }

    // calculate fees
    let estimatedEntryFeeStr: string | undefined;
    let estimatedStopFeeStr: string | undefined;
    let estimatedProfitFeeStr: string | undefined;
    if (input.includeTradingFee) {
      // Calculate entry fee
      // entryFee = entryAmount * estFeeRate
      let entryFee = mathBigNum.multiply(entryAmount, estFeeRate) as BigNumber;
      entryFee = mathBigNum.round(entryFee, 5);
      if (mathBigNum.smaller(entryFee, minTradingFee)) {
        entryFee = minTradingFee;
      }
      estimatedEntryFeeStr = convertToLocaleString(entryFee.toString(), 2, 5);

      // Calculate stop fee
      // stopFee = exitAmount * estFeeRate
      let stopFee = mathBigNum.multiply(exitAmount, estFeeRate) as BigNumber;
      stopFee = mathBigNum.round(stopFee, 5);
      if (mathBigNum.smaller(stopFee, minTradingFee)) {
        stopFee = minTradingFee;
      }
      estimatedStopFeeStr = convertToLocaleString(stopFee.toString(), 2, 5);

      // Recompute risk amount
      // riskAmount = riskAmount + entryFee + stopFee
      riskAmount = mathBigNum.add(
        mathBigNum.add(riskAmount, entryFee),
        stopFee
      );

      if (profitAmount !== undefined) {
        // Calculate profit fee
        // profitFee = profitAmount * estFeeRate
        let profitFee = mathBigNum.multiply(
          profitAmount,
          estFeeRate
        ) as BigNumber;
        profitFee = mathBigNum.round(profitFee, 5);
        if (mathBigNum.smaller(profitFee, minTradingFee)) {
          profitFee = minTradingFee;
        }
        estimatedProfitFeeStr = convertToLocaleString(
          profitFee.toString(),
          2,
          5
        );

        // Recompute profit amount
        // profitAmount = profitAmount - entryFee - profitFee
        profitAmount = mathBigNum.subtract(
          mathBigNum.subtract(profitAmount, entryFee),
          profitFee
        );
      }
    }

    // Calculate total risk amount
    // totalRiskAmount = totalRiskAmount + riskAmount
    totalRiskAmount = mathBigNum.add(totalRiskAmount, riskAmount);

    // Calculate total profit amount
    if (profitAmount !== undefined) {
      // totalProfitAmount = totalProfitAmount + profitAmount
      totalProfitAmount = mathBigNum.add(totalProfitAmount, profitAmount);
    }

    // Calculate portfolio risk
    let portfolioRisk = mathBigNum.bignumber(0);
    if (!mathBigNum.equal(portfolioCapital, 0)) {
      // portfolioRisk = (riskAmount / portfolioCapital) * 100
      portfolioRisk = mathBigNum.multiply(
        mathBigNum.divide(riskAmount, portfolioCapital),
        100
      ) as BigNumber;
    }
    const portfolioRiskStr = convertToLocaleString(
      portfolioRisk.toString(),
      2,
      5
    );

    // Calculate portfolio profit
    let portfolioProfitStr: string | undefined;
    if (profitAmount !== undefined) {
      // portfolioProfit = (profitAmount / portfolioCapital) * 100
      let portfolioProfit = mathBigNum.bignumber(0);
      portfolioProfit = mathBigNum.multiply(
        mathBigNum.divide(profitAmount, portfolioCapital),
        100
      ) as BigNumber;
      portfolioProfitStr = convertToLocaleString(
        portfolioProfit.toString(),
        2,
        5
      );
    }

    // Calculate risk reward ratio
    let riskRewardRatio: string | undefined;
    if (profitAmount !== undefined && !mathBigNum.equal(profitAmount, 0)) {
      // ratio = riskAmount / profitAmount
      let ratio = mathBigNum.divide(riskAmount, profitAmount) as BigNumber;
      let roundedRatio = mathBigNum.round(ratio, 2);

      if (mathBigNum.largerEq(roundedRatio, 1)) {
        riskRewardRatio = `${roundedRatio}:1`;
      } else {
        ratio = mathBigNum.divide(1, ratio) as BigNumber;
        ratio = mathBigNum.round(ratio, 2);
        riskRewardRatio = `1:${ratio}`;
      }
    }

    const riskAmountStr = convertToLocaleString(riskAmount.toString(), 2, 5);
    let profitAmountStr: string | undefined;
    if (profitAmount !== undefined) {
      profitAmountStr = convertToLocaleString(profitAmount.toString(), 2, 5);
    }

    // update results
    ordersResult.push({
      isLong: isLong,
      entryAmount: entryAmountStr,
      entryPrice: orders[i].entryPrice,
      stopLossPrice: orders[i].stopLoss,
      stopLossPercent: stopLossPercentStr,
      profitPrice: orders[i].profitGoal,
      profitPercent: profitPercentStr,
      riskAmount: riskAmountStr,
      profitAmount: profitAmountStr,
      entryFee: estimatedEntryFeeStr,
      stopLossFee: estimatedStopFeeStr,
      profitFee: estimatedProfitFeeStr,
      portfolioRisk: portfolioRiskStr,
      portfolioProfit: portfolioProfitStr,
      riskRewardRatio: riskRewardRatio,
      quantity: orders[i].quantity,
    });
  }

  // portfolioRisk = (totalRiskAmount / portfolioCapital) * 100
  let portfolioRisk = mathBigNum.bignumber(0);
  if (!mathBigNum.equal(portfolioCapital, 0)) {
    portfolioRisk = mathBigNum.multiply(
      mathBigNum.divide(totalRiskAmount, portfolioCapital),
      100
    ) as BigNumber;
  }

  let portfolioProfitStr: string | undefined;
  let riskRewardRatio: string | undefined;
  if (hasProfitGoal) {
    // portfolioProfit = (totalProfitAmount / portfolioCapital) * 100;
    let portfolioProfit = mathBigNum.bignumber(0);
    if (!mathBigNum.equal(portfolioCapital, 0)) {
      portfolioProfit = mathBigNum.multiply(
        mathBigNum.divide(totalProfitAmount, portfolioCapital),
        100
      ) as BigNumber;
    }
    portfolioProfitStr = convertToLocaleString(
      portfolioProfit.toString(),
      2,
      5
    );

    if (mathBigNum.larger(totalProfitAmount, 0)) {
      // ratio = totalRiskAmount / totalProfitAmount
      let ratio = mathBigNum.divide(
        totalRiskAmount,
        totalProfitAmount
      ) as BigNumber;
      const roundedRatio = mathBigNum.round(ratio, 2);

      if (mathBigNum.largerEq(roundedRatio, 1)) {
        riskRewardRatio = `${roundedRatio}:1`;
      } else {
        riskRewardRatio = `1:${convertToLocaleString(
          mathBigNum.divide(1, ratio).toString(),
          0,
          2
        )}`;
      }
    }
  }

  return {
    hasProfitGoal: hasProfitGoal,
    totalEntryAmount: convertToLocaleString(totalEntryAmount.toString(), 2, 5),
    totalRiskAmount: convertToLocaleString(totalRiskAmount.toString(), 2, 5),
    totalProfitAmount: convertToLocaleString(
      totalProfitAmount.toString(),
      2,
      5
    ),
    portfolioRisk: convertToLocaleString(portfolioRisk.toString(), 2, 5),
    portfolioProfit: portfolioProfitStr,
    riskRewardRatio: riskRewardRatio,
    includeTradingFee: input.includeTradingFee,
    orders: ordersResult,
    totalLong: `${totalLong}`,
    totalShort: `${totalShort}`,
  };
};
