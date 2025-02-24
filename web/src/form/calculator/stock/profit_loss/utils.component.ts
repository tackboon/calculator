import { parseNumberFromString } from "../../../../common/number/number";
import { checkMinMax } from "../../../../common/validation/calculator.validation";
import {
  ERROR_FIELD_PROFIT_LOSS,
  ProfitLossInputType,
  ProfitLossResultType,
} from "./profit_loss_form.component";

export const validateProfitLossInput = (
  input: ProfitLossInputType
): { err: string; field: ERROR_FIELD_PROFIT_LOSS | null } => {
  if (!checkMinMax(input.entryPrice, 0)) {
    return {
      err: "Please enter a valid entry price.",
      field: ERROR_FIELD_PROFIT_LOSS.ENTRY_PRICE,
    };
  }

  if (!checkMinMax(input.quantity, 0)) {
    return {
      err: "Please enter a valid quantity.",
      field: ERROR_FIELD_PROFIT_LOSS.QUANTITY,
    };
  }

  if (!checkMinMax(input.exitPrice, 0)) {
    return {
      err: "Please enter a valid exit price.",
      field: ERROR_FIELD_PROFIT_LOSS.EXIT_PRICE,
    };
  }

  if (input.includeTradingFee) {
    if (!checkMinMax(input.estTradingFee, 0, 100)) {
      return {
        err: "Please estimates a valid trading fee.",
        field: ERROR_FIELD_PROFIT_LOSS.EST_TRADING_FEE,
      };
    }

    if (!checkMinMax(input.minTradingFee, 0)) {
      return {
        err: "Please enter a valid minimum trading fee.",
        field: ERROR_FIELD_PROFIT_LOSS.MIN_TRADING_FEE,
      };
    }
  }

  return { err: "", field: null };
};

export const calculateResult = (
  input: ProfitLossInputType
): ProfitLossResultType => {
  // Parse inputs
  const entryPrice = parseNumberFromString(input.entryPrice);
  const exitPrice = parseNumberFromString(input.exitPrice);
  const quantity = parseNumberFromString(input.quantity);
  const estTradingFee = parseNumberFromString(input.estTradingFee);
  const minTradingFee = parseNumberFromString(input.minTradingFee);

  /* 
  Handle calculation
  */

  // total entry & exit price
  const totalEntryPrice = parseFloat((entryPrice * quantity).toFixed(4));
  const totalExitPrice = parseFloat((exitPrice * quantity).toFixed(4));

  // total fee
  let estimatedEntryFee;
  let estimatedExitFee;
  if (input.includeTradingFee) {
    const estFeeRate = estTradingFee / 100;
    estimatedEntryFee = totalEntryPrice * estFeeRate;
    if (estimatedEntryFee < minTradingFee) {
      estimatedEntryFee = minTradingFee;
    }
    estimatedEntryFee = parseFloat(estimatedEntryFee.toFixed(4));

    estimatedExitFee = totalExitPrice * estFeeRate;
    if (estimatedExitFee < minTradingFee) {
      estimatedExitFee = minTradingFee;
    }
    estimatedExitFee = parseFloat(estimatedExitFee.toFixed(4));
  }

  // gain/loss
  let grossGained = input.isLong
    ? totalExitPrice - totalEntryPrice
    : totalEntryPrice - totalExitPrice;
  let netGained;
  if (estimatedEntryFee !== undefined && estimatedExitFee !== undefined)
    netGained = grossGained - estimatedEntryFee - estimatedExitFee;

  // gain/loss percentage
  let grossPercentage;
  let netPercentage;
  if (entryPrice > 0) {
    grossPercentage =
      grossGained === 0 ? 0 : (grossGained / totalEntryPrice) * 100;

    if (netGained !== undefined)
      netPercentage = netGained === 0 ? 0 : (netGained / totalEntryPrice) * 100;
  }

  return {
    totalEntryAmount: totalEntryPrice,
    totalExitAmount: totalExitPrice,
    grossGained,
    grossPercentage,
    netGained,
    netPercentage,
    estimatedEntryFee,
    estimatedExitFee,
    isLong: input.isLong,
    includeTradingFee: input.includeTradingFee,
  };
};
