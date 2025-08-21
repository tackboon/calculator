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

    // Calculate stop loss amount
    // grossExitAmount = stopLoss * quantity;
    const grossExitAmount = multiplyBig(stopLoss, quantity);

    // Calculate risk amount
    // riskAmount = Math.abs(entryAmount - exitAmount);
    let riskAmount = mathBigNum.abs(
      subtractBig(grossEntryAmount, grossExitAmount)
    );

    // Calcualte profit
    let profitAmount: BigNumber | undefined;
    if (includeProfitGoal) {
      // Calculate profit percent
      // profitPercent = (Math.abs(entryPrice - profitGoal) / entryPrice) * 100
      let profitPercent = mathBigNum.bignumber(0);
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

    // calculate fees
    let entryFee: BigNumber | undefined;
    let stopFee: BigNumber | undefined;
    let profitFee: BigNumber | undefined;
    if (input.includeTradingFee) {
      // Calculate entry fee
      // entryFee = entryAmount * estFeeRate
      let entryFee = multiplyBig(grossEntryAmount, estFeeRate);
      if (mathBigNum.smaller(entryFee, minTradingFee)) {
        entryFee = minTradingFee;
      }

      // Calculate stop fee
      // stopFee = exitAmount * estFeeRate
      let stopFee = multiplyBig(grossExitAmount, estFeeRate);
      if (mathBigNum.smaller(stopFee, minTradingFee)) {
        stopFee = minTradingFee;
      }

      // Recompute total entry amount
      totalEntryAmount = addBig(totalEntryAmount, entryFee);

      // Recompute risk amount
      // riskAmount = riskAmount + entryFee + stopFee
      riskAmount = addBig(addBig(riskAmount, entryFee), stopFee);

      if (profitAmount !== undefined) {
        // Calculate profit fee
        // profitFee = profitAmount * estFeeRate
        let profitFee = multiplyBig(profitAmount, estFeeRate);
        profitFee = mathBigNum.round(profitFee, 5);
        if (mathBigNum.smaller(profitFee, minTradingFee)) {
          profitFee = minTradingFee;
        }

        // Recompute profit amount
        // profitAmount = profitAmount - entryFee - profitFee
        profitAmount = subtractBig(
          subtractBig(profitAmount, entryFee),
          profitFee
        );
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

    // Calculate portfolio risk
    let portfolioRisk = mathBigNum.bignumber(0);
    if (!mathBigNum.equal(portfolioCapital, 0)) {
      // portfolioRisk = (riskAmount / portfolioCapital) * 100
      portfolioRisk = multiplyBig(divideBig(riskAmount, portfolioCapital), 100);
    }

    // Calculate portfolio profit
    let portfolioProfitStr: string | undefined;
    if (profitAmount !== undefined) {
      // portfolioProfit = (profitAmount / portfolioCapital) * 100
      let portfolioProfit = mathBigNum.bignumber(0);
      portfolioProfit = multiplyBig(
        divideBig(profitAmount, portfolioCapital),
        100
      );
    }

    // Calculate risk reward ratio
    let riskRewardRatio: string | undefined;
    if (profitAmount !== undefined && !mathBigNum.equal(profitAmount, 0)) {
      // ratio = riskAmount / profitAmount
      let ratio = divideBig(riskAmount, profitAmount);
      let roundedRatio = mathBigNum.round(ratio, 2);

      if (mathBigNum.largerEq(roundedRatio, 1)) {
        riskRewardRatio = `${roundedRatio}:1`;
      } else {
        ratio = divideBig(1, ratio);
        ratio = mathBigNum.round(ratio, 2);
        riskRewardRatio = `1:${ratio}`;
      }
    }

        // Calculate total entry amount
    // totalEntryAmount = totalEntryAmount + entryAmount;
    totalEntryAmount = addBig(totalEntryAmount, grossEntryAmount);

    // update results
    // ordersResult.push({
    //   isLong: isLong,
    //   entryAmount: entryAmountStr,
    //   entryPrice: orders[i].entryPrice,
    //   stopLossPrice: orders[i].stopLoss,
    //   stopLossPercent: stopLossPercentStr,
    //   profitPrice: orders[i].profitGoal,
    //   profitPercent: profitPercentStr,
    //   riskAmount: riskAmountStr,
    //   profitAmount: profitAmountStr,
    //   entryFee: estimatedEntryFeeStr,
    //   stopLossFee: estimatedStopFeeStr,
    //   profitFee: estimatedProfitFeeStr,
    //   portfolioRisk: portfolioRiskStr,
    //   portfolioProfit: portfolioProfitStr,
    //   riskRewardRatio: riskRewardRatio,
    //   quantity: orders[i].quantity,
    // });
  }

  // portfolioRisk = (totalRiskAmount / portfolioCapital) * 100
  let portfolioRisk = mathBigNum.bignumber(0);
  if (!mathBigNum.equal(portfolioCapital, 0)) {
    portfolioRisk = multiplyBig(
      divideBig(totalRiskAmount, portfolioCapital),
      100
    );
  }

  let portfolioProfitStr: string | undefined;
  let riskRewardRatio: string | undefined;
  // if (hasProfitGoal) {
  //   // portfolioProfit = (totalProfitAmount / portfolioCapital) * 100;
  //   let portfolioProfit = mathBigNum.bignumber(0);
  //   if (!mathBigNum.equal(portfolioCapital, 0)) {
  //     portfolioProfit = multiplyBig(
  //       divideBig(totalProfitAmount, portfolioCapital),
  //       100
  //     );
  //   }

  //   if (mathBigNum.larger(totalProfitAmount, 0)) {
  //     // ratio = totalRiskAmount / totalProfitAmount
  //     let ratio = divideBig(totalRiskAmount, totalProfitAmount);
  //     const roundedRatio = mathBigNum.round(ratio, 2);

  //     if (mathBigNum.largerEq(roundedRatio, 1)) {
  //       riskRewardRatio = `${roundedRatio}:1`;
  //     } else {
  //       riskRewardRatio = `1:${convertToLocaleString(
  //         divideBig(1, ratio).toFixed(2),
  //         0,
  //         2
  //       )}`;
  //     }
  //   }
  // }

  // return {
  //   hasProfitGoal: hasProfitGoal,
  //   totalEntryAmount: convertToLocaleString(totalEntryAmount.toString(), 2, 5),
  //   totalRiskAmount: convertToLocaleString(totalRiskAmount.toString(), 2, 5),
  //   totalProfitAmount: convertToLocaleString(
  //     totalProfitAmount.toString(),
  //     2,
  //     5
  //   ),
  //   portfolioRisk: convertToLocaleString(portfolioRisk.toString(), 2, 5),
  //   portfolioProfit: portfolioProfitStr,
  //   riskRewardRatio: riskRewardRatio,
  //   includeTradingFee: input.includeTradingFee,
  //   orders: ordersResult,
  //   totalLong: `${totalLong}`,
  //   totalShort: `${totalShort}`,
  // };

  return {
    totalEntryAmount: mathBigNum.bignumber(0),
    totalRiskAmount: mathBigNum.bignumber(0),
    totalProfitAmount: mathBigNum.bignumber(0),
    portfolioRisk: mathBigNum.bignumber(0),
    portfolioProfit: mathBigNum.bignumber(0),
    riskRewardRatio: mathBigNum.bignumber(0),
    includeTradingFee: false,
    orders: ordersResult,
    totalShort: 0,
    totalLong: 0,
  };
};
