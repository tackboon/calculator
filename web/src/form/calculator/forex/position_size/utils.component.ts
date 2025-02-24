export const test = () => {};

// import { parseNumberFromString } from "../../../../common/number/number";
// import { checkMinMax } from "../../../../common/validation/calculator.validation";
// import {
//   ERROR_FIELD_POSITION_SIZE,
//   ForexPositionSizeInputType,
//   PositionSizeResultType,
//   ProfitGoalTyp,
//   UnitType,
// } from "./position_size_form.component";

// export const validatePositionSizeInput = (
//   input: ForexPositionSizeInputType
// ): { err: string; field: ERROR_FIELD_POSITION_SIZE | null } => {
//   if (!checkMinMax(input.portfolioCapital, 0)) {
//     return {
//       err: "Please enter a valid portfolio capital.",
//       field: ERROR_FIELD_POSITION_SIZE.PORTFOLIO_CAPITAL,
//     };
//   }

//   if (!checkMinMax(input.maxPortfolioRisk, 0)) {
//     return {
//       err: "Please enter a valid max portflio risk.",
//       field: ERROR_FIELD_POSITION_SIZE.MAX_PORTFOLIO_RISK,
//     };
//   }

//   if (!checkMinMax(input.entryPrice, 0)) {
//     return {
//       err: "Please enter a valid entry price.",
//       field: ERROR_FIELD_POSITION_SIZE.ENTRY_PRICE,
//     };
//   }

//   let stopLossMin = 0;
//   let stopLossMax;
//   if (input.stopLossTyp === "$") {
//     if (input.isLong) {
//       stopLossMax = parseNumberFromString(input.entryPrice);
//     } else {
//       stopLossMin = parseNumberFromString(input.entryPrice);
//     }
//   } else if (input.isLong) {
//     stopLossMax = 100;
//   }
//   if (!checkMinMax(input.stopLoss, stopLossMin, stopLossMax)) {
//     return {
//       err: "Please enter a valid stop loss.",
//       field: ERROR_FIELD_POSITION_SIZE.STOP_LOSS,
//     };
//   }

//   if (input.includeProfitGoal) {
//     let profitGoalMin = 0;
//     let profitGoalMax;
//     if (input.profitGoalTyp === ProfitGoalTyp.PORTFOLIO_BASED) {
//       if (!checkMinMax(input.profitGoal, profitGoalMin)) {
//         return {
//           err: "Please enter a valid min portfolio profit.",
//           field: ERROR_FIELD_POSITION_SIZE.PROFIT_TARGET,
//         };
//       }
//     } else {
//       if (input.profitGoalUnit === "$") {
//         if (input.isLong) {
//           profitGoalMin = parseNumberFromString(input.entryPrice);
//         } else {
//           profitGoalMax = parseNumberFromString(input.entryPrice);
//         }
//       } else if (!input.isLong) {
//         profitGoalMax = 100;
//       }

//       if (!checkMinMax(input.profitGoal, profitGoalMin, profitGoalMax)) {
//         return {
//           err: "Please enter a valid profit target.",
//           field: ERROR_FIELD_POSITION_SIZE.PROFIT_TARGET,
//         };
//       }
//     }
//   }

//   if (input.includeTradingFee) {
//     if (!checkMinMax(input.estTradingFee, 0, 100)) {
//       return {
//         err: "Please estimates a valid trading fee.",
//         field: ERROR_FIELD_POSITION_SIZE.EST_TRADING_FEE,
//       };
//     }

//     if (!checkMinMax(input.minTradingFee, 0)) {
//       return {
//         err: "Please enter a valid minimum trading fee.",
//         field: ERROR_FIELD_POSITION_SIZE.MIN_TRADING_FEE,
//       };
//     }
//   }

//   return { err: "", field: null };
// };

// export const calculateResult = (
//   input: ForexPositionSizeInputType
// ): PositionSizeResultType => {
//   // Parse inputs
//   const portfolioCapital = parseNumberFromString(input.portfolioCapital);
//   const maxPortfolioRiskPercent = parseNumberFromString(input.maxPortfolioRisk);
//   const maxPortfolioRiskRate = maxPortfolioRiskPercent / 100;
//   const entryPrice = parseNumberFromString(input.entryPrice);
//   const stopLoss = parseNumberFromString(input.stopLoss);
//   const profitGoal = parseNumberFromString(input.profitGoal);
//   const estTradingFeePercent = parseNumberFromString(input.estTradingFee);
//   const minTradingFee = parseNumberFromString(input.minTradingFee);
//   const estFeeRate = estTradingFeePercent / 100;

//   /*
//   Handle calculation
//   */

//   // stop price
//   let stopPrice = 0;
//   let stopPercent = 0;
//   if (input.stopLossTyp === "$") {
//     stopPrice = stopLoss;
//     stopPercent =
//       entryPrice === 0
//         ? 0
//         : (Math.abs(entryPrice - stopLoss) / entryPrice) * 100;
//   } else {
//     stopPrice = input.isLong
//       ? entryPrice * (1 - stopLoss / 100)
//       : entryPrice * (1 + stopLoss / 100);
//     stopPrice = Math.trunc(stopPrice * 1e4) / 1e4;
//     stopPercent =
//       entryPrice === 0
//         ? 0
//         : input.isLong
//         ? ((entryPrice - stopPrice) / entryPrice) * 100
//         : ((stopPrice - entryPrice) / entryPrice) * 100;
//   }

//   // quantity
//   let quantity = 0;
//   if (stopPercent > 0) {
//     quantity = calculateQuantity(
//       portfolioCapital,
//       maxPortfolioRiskRate,
//       stopPrice,
//       estFeeRate,
//       minTradingFee,
//       entryPrice,
//       input.isLong
//     );

//     switch (input.unitType) {
//       case UnitType.FRACTIONAL:
//         quantity = parseFloat(quantity.toFixed(6));
//         break;
//       case UnitType.UNIT:
//         quantity = Math.floor(quantity);
//         break;
//       case UnitType.LOT:
//         const lot = Math.floor(quantity / 100);
//         quantity = lot * 100;
//         break;
//     }
//   }

//   // entry amount
//   const entryAmount = entryPrice * quantity;

//   // risk amount
//   let riskAmount = input.isLong
//     ? (entryPrice - stopPrice) * quantity
//     : (stopPrice - entryPrice) * quantity;

//   // entry fee and stop fee
//   let estimatedEntryFee;
//   let estimatedStopFee;
//   if (input.includeTradingFee) {
//     estimatedEntryFee = entryAmount * estFeeRate;
//     estimatedEntryFee = Math.round(estimatedEntryFee * 1e4) / 1e4;
//     if (estimatedEntryFee < minTradingFee && entryAmount > 0)
//       estimatedEntryFee = minTradingFee;

//     estimatedStopFee = stopPrice * quantity * estFeeRate;
//     estimatedStopFee = Math.round(estimatedStopFee * 1e4) / 1e4;
//     if (estimatedStopFee < minTradingFee && entryAmount > 0) {
//       estimatedStopFee = minTradingFee;
//     }

//     riskAmount = riskAmount + estimatedEntryFee + estimatedStopFee;
//   }

//   // portfolio risk
//   const portfolioRisk =
//     portfolioCapital === 0 ? 0 : (riskAmount / portfolioCapital) * 100;

//   // profit and profit fee
//   let profitPrice;
//   let profitPercent;
//   let profitAmount;
//   let estimatedProfitFee;
//   if (input.includeProfitGoal) {
//     if (input.profitGoalTyp === ProfitGoalTyp.STOCK_BASED) {
//       if (input.profitGoalUnit === "$") {
//         profitPrice = profitGoal;
//         profitPercent =
//           entryPrice === 0
//             ? 0
//             : (Math.abs(entryPrice - profitPrice) / entryPrice) * 100;
//       } else {
//         profitPrice = input.isLong
//           ? entryPrice * (1 + profitGoal / 100)
//           : entryPrice * (1 - profitGoal / 100);
//         profitPrice = Math.trunc(profitPrice * 1e4) / 1e4;
//         profitPercent =
//           entryPrice === 0
//             ? 0
//             : input.isLong
//             ? ((profitPrice - entryPrice) / entryPrice) * 100
//             : ((entryPrice - profitPrice) / entryPrice) * 100;
//       }

//       const exitAmount = profitPrice * quantity;
//       profitAmount = Math.abs(entryAmount - exitAmount);
//       if (input.includeTradingFee) {
//         estimatedProfitFee = exitAmount * estFeeRate;
//         estimatedProfitFee = Math.round(estimatedProfitFee * 1e4) / 1e4;
//         if (estimatedProfitFee < minTradingFee && entryAmount > 0) {
//           estimatedProfitFee = minTradingFee;
//         }

//         if (estimatedEntryFee !== undefined)
//           profitAmount = profitAmount - estimatedEntryFee - estimatedProfitFee;
//       }
//     } else {
//       const minProfit = portfolioCapital * (profitGoal / 100);

//       if (estimatedEntryFee !== undefined) {
//         profitPrice =
//           quantity === 0
//             ? 0
//             : input.isLong
//             ? (minProfit + estimatedEntryFee + entryAmount) /
//               ((1 - estFeeRate) * quantity)
//             : (entryAmount - estimatedEntryFee - minProfit) /
//               ((1 + estFeeRate) * quantity);
//         profitPrice = input.isLong
//           ? Math.round(profitPrice * 1e4) / 1e4
//           : Math.trunc(profitPrice * 1e4) / 1e4;

//         estimatedProfitFee = profitPrice * quantity * estFeeRate;
//         estimatedProfitFee = Math.round(estimatedProfitFee * 1e4) / 1e4;
//         if (estimatedProfitFee < minTradingFee && entryAmount > 0) {
//           estimatedProfitFee = minTradingFee;
//           profitPrice = input.isLong
//             ? (minProfit +
//                 entryAmount +
//                 estimatedEntryFee +
//                 estimatedProfitFee) /
//               quantity
//             : (entryAmount -
//                 estimatedEntryFee -
//                 estimatedProfitFee -
//                 minProfit) /
//               quantity;
//           profitPrice = input.isLong
//             ? Math.round(profitPrice * 1e4) / 1e4
//             : Math.trunc(profitPrice * 1e4) / 1e4;
//         }

//         const { exitPrice, exitFee } = adjustProfitPrice(
//           profitPrice,
//           quantity,
//           entryAmount,
//           estimatedEntryFee,
//           estFeeRate,
//           minTradingFee,
//           minProfit,
//           input.isLong
//         );
//         profitPrice = exitPrice;
//         estimatedProfitFee = exitFee;

//         profitPercent =
//           entryPrice === 0
//             ? 0
//             : (Math.abs(entryPrice - profitPrice) / entryPrice) * 100;
//         if (estimatedProfitFee !== undefined)
//           profitAmount =
//             Math.abs(profitPrice - entryPrice) * quantity -
//             estimatedEntryFee -
//             estimatedProfitFee;
//       } else {
//         profitPrice =
//           quantity === 0
//             ? 0
//             : input.isLong
//             ? parseFloat((minProfit / quantity + entryPrice).toFixed(4))
//             : Math.trunc((entryPrice - minProfit / quantity) * 1e4) / 1e4;

//         const { exitPrice } = adjustProfitPrice(
//           profitPrice,
//           quantity,
//           entryAmount,
//           0,
//           0,
//           0,
//           minProfit,
//           input.isLong
//         );
//         profitPrice = exitPrice;

//         profitPercent =
//           entryPrice === 0
//             ? 0
//             : (Math.abs(entryPrice - profitPrice) / entryPrice) * 100;
//         profitAmount = Math.abs(profitPrice - entryPrice) * quantity;
//       }
//     }
//   }

//   // portfolio profit
//   let portfolioProfit;
//   if (profitAmount !== undefined) {
//     portfolioProfit =
//       portfolioCapital === 0 ? 0 : (profitAmount / portfolioCapital) * 100;
//   }

//   // risk reward ratio
//   // break even win rate
//   let riskRewardRatio;
//   let breakEvenWinRate;

//   if (riskAmount && profitAmount) {
//     const ratio = riskAmount / profitAmount;
//     riskRewardRatio =
//       ratio >= 1
//         ? `${ratio.toLocaleString("en-US", {
//             minimumFractionDigits: 0,
//             maximumFractionDigits: 2,
//           })}:1`
//         : `1:${(1 / ratio).toLocaleString("en-US", {
//             minimumFractionDigits: 0,
//             maximumFractionDigits: 2,
//           })}`;
//     breakEvenWinRate = (1 / (1 + 1 / ratio)) * 100;
//   }

//   // Correct the quantity
//   let quantityStr = "";
//   switch (input.unitType) {
//     case UnitType.FRACTIONAL:
//       quantityStr = quantity.toLocaleString("en-US", {
//         minimumFractionDigits: 0,
//         maximumFractionDigits: 6,
//       });
//       break;
//     case UnitType.UNIT:
//       quantityStr = `${quantity}`;
//       break;
//     case UnitType.LOT:
//       quantityStr = `${quantity / 100} Lot`;
//       break;
//   }

//   return {
//     isLong: input.isLong,
//     includeTradingFee: input.includeTradingFee,
//     includeProfitGoal: input.includeProfitGoal,
//     entryPrice,
//     stopPrice,
//     stopPercent,
//     profitPrice,
//     profitPercent,
//     quantity: quantityStr,
//     tradingAmount: entryAmount,
//     riskAmount,
//     portfolioRisk,
//     profitAmount,
//     portfolioProfit,
//     riskRewardRatio,
//     breakEvenWinRate,
//     estimatedEntryFee,
//     estimatedStopFee,
//     estimatedProfitFee,
//   };
// };

// const calculateQuantity = (
//   capital: number,
//   maxLossRate: number,
//   stopLossPrice: number,
//   estFeeRate: number,
//   minTradingFee: number,
//   entryPrice: number,
//   isLong: boolean
// ): number => {
//   const maxLoss = capital * maxLossRate;
//   let quantity = 0;
//   let entryFee = 0;
//   let stopLossFee = 0;

//   // Compute trading amount without fees
//   if (estFeeRate === 0 && minTradingFee === 0) {
//     quantity = isLong
//       ? maxLoss / (entryPrice - stopLossPrice)
//       : maxLoss / (stopLossPrice - entryPrice);
//     return Math.trunc(quantity * 1e6) / 1e6;
//   }

//   // Compute trading amount with fixed fee
//   if (estFeeRate === 0 && minTradingFee > 0) {
//     quantity = isLong
//       ? (maxLoss - 2 * minTradingFee) / (entryPrice - stopLossPrice)
//       : (maxLoss - 2 * minTradingFee) / (stopLossPrice - entryPrice);
//     return Math.trunc(quantity * 1e6) / 1e6;
//   }

//   /*
//     Compupte trading amount with estimation fees
//   */

//   // Attempt 1: Assume both fees exceed minTradingFee
//   quantity = isLong
//     ? maxLoss /
//       (entryPrice - stopLossPrice + estFeeRate * (entryPrice + stopLossPrice))
//     : maxLoss /
//       (stopLossPrice - entryPrice + estFeeRate * (entryPrice + stopLossPrice));
//   quantity = Math.trunc(quantity * 1e6) / 1e6;
//   entryFee = quantity * entryPrice * estFeeRate;
//   stopLossFee = quantity * stopLossPrice * estFeeRate;

//   if (entryFee >= minTradingFee && stopLossFee >= minTradingFee) {
//     return quantity;
//   }

//   // Attempt 2: Assume stop loss fee is smaller than minTradingFee
//   quantity = isLong
//     ? (maxLoss - minTradingFee) /
//       (entryPrice - stopLossPrice + entryFee * estFeeRate)
//     : (maxLoss - minTradingFee) /
//       (stopLossPrice - entryPrice + stopLossPrice * estFeeRate);

//   quantity = Math.trunc(quantity * 1e6) / 1e6;
//   entryFee = quantity * entryPrice * estFeeRate;
//   stopLossFee = quantity * stopLossPrice * estFeeRate;

//   if (entryFee >= minTradingFee && stopLossFee >= minTradingFee) {
//     return quantity;
//   }

//   // Attempt 3: Assume both fees smaller than minTradingFee
//   // quantity = (maxLoss - 2 * minTradingFee) / stopLossPrice;
//   // quantity = parseFloat(quantity.toFixed(6));
//   return Math.trunc(quantity * 1e6) / 1e6;
// };

// const adjustProfitPrice = (
//   profitPrice: number,
//   quantity: number,
//   entryAmt: number,
//   entryFee: number,
//   feeRate: number,
//   minFee: number,
//   minProfit: number,
//   isLong: boolean
// ): { exitPrice: number; exitFee: number } => {
//   if (entryAmt === 0) {
//     return { exitPrice: 0, exitFee: 0 };
//   }

//   let exitAmount = profitPrice * quantity;
//   let exitFee = exitAmount > 0 ? exitAmount * feeRate : 0;
//   exitFee = Math.round(exitFee * 1e4) / 1e4;
//   if (exitFee < minFee) exitFee = minFee;
//   let profitAmt = Math.abs(exitAmount - entryAmt) - entryFee - exitFee;

//   while (profitAmt < minProfit) {
//     profitPrice = isLong ? profitPrice + 0.0001 : profitPrice - 0.0001;

//     exitAmount = profitPrice * quantity;
//     exitFee = exitAmount > 0 ? exitAmount * feeRate : 0;
//     exitFee = Math.round(exitFee * 1e4) / 1e4;
//     if (exitFee < minFee) exitFee = minFee;
//     profitAmt = Math.abs(exitAmount - entryAmt) - entryFee - exitFee;
//   }

//   return { exitPrice: profitPrice, exitFee: exitFee };
// };
