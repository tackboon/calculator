import { BigNumber } from "mathjs";
import { mathBigNum } from "../../../../common/number/math";
import {
  convertToLocaleString,
  parseBigNumberFromString,
  parseNumberFromString,
} from "../../../../common/number/number";
import { checkMinMax } from "../../../../common/validation/calculator.validation";
import {
  ERROR_FIELD_PROFIT_LOSS,
  ProfitLossInputType,
  ProfitLossResultType,
} from "./profit_loss.type";

export const validateProfitLossInput = (
  input: ProfitLossInputType
): { err: string; field: ERROR_FIELD_PROFIT_LOSS | null } => {
  if (!checkMinMax(input.entryPrice, 0)) {
    return {
      err: "Please enter a valid open price.",
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
      err: "Please enter a valid close price.",
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
  const entryPrice = parseBigNumberFromString(input.entryPrice);
  const exitPrice = parseBigNumberFromString(input.exitPrice);
  const quantity = parseBigNumberFromString(input.quantity);
  const estTradingFee = parseNumberFromString(input.estTradingFee);
  const estFeeRate = estTradingFee / 100;
  const minTradingFee = parseBigNumberFromString(input.minTradingFee);

  /* 
  Handle calculation
  */

  // Calculate total entry & exit price
  // totalEntryAmount = entryPrice * quantity
  const totalEntryAmount = mathBigNum.multiply(
    entryPrice,
    quantity
  ) as BigNumber;
  const totalEntryAmountStr = convertToLocaleString(
    totalEntryAmount.toString(),
    2,
    5
  );

  // Calculate total exit amount
  // totalExitAmount = exitPrice * quantity
  const totalExitAmount = mathBigNum.multiply(exitPrice, quantity) as BigNumber;
  const totalExitAmountStr = convertToLocaleString(
    totalExitAmount.toString(),
    2,
    5
  );

  // Calculate gain and loss
  // grossGained = isLong ? totalExitAmount - totalEntryAmount: totalEntryAmount - totalExitAmount
  const grossGained = input.isLong
    ? mathBigNum.subtract(totalExitAmount, totalEntryAmount)
    : mathBigNum.subtract(totalEntryAmount, totalExitAmount);
  const grossGainedStr = convertToLocaleString(grossGained.toString(), 2, 5);

  // Calculate gross gained percentage
  let grossPercentageStr = "0";
  if (!mathBigNum.equal(totalEntryAmount, 0)) {
    // grossGainedPercentage = (grossGained / totalEntryAmount) * 100
    let grossPercentage = mathBigNum.multiply(
      mathBigNum.divide(grossGained, totalEntryAmount),
      100
    ) as BigNumber;
    grossPercentageStr = convertToLocaleString(
      grossPercentage.toString(),
      2,
      5
    );
  }

  // Calculate fees
  let totalEntryFeeStr: string | undefined;
  let totalExitFeeStr: string | undefined;
  let netGainedStr: string | undefined;
  let netPercentageStr: string | undefined;
  if (input.includeTradingFee) {
    // Calculate total entry fee
    // totalEntryFee = totalEntryAmount * estFeeRate
    let totalEntryFee = mathBigNum.multiply(
      totalEntryAmount,
      estFeeRate
    ) as BigNumber;
    totalEntryFee = mathBigNum.round(totalEntryFee, 5);
    if (mathBigNum.smaller(totalEntryFee, minTradingFee)) {
      totalEntryFee = minTradingFee;
    }
    totalEntryFeeStr = convertToLocaleString(totalEntryFee.toString(), 2, 5);

    // Calculate total exit fee
    // totalExitFee = totalExitAmount * estFeeRate
    let totalExitFee = mathBigNum.multiply(
      totalExitAmount,
      estFeeRate
    ) as BigNumber;
    totalExitFee = mathBigNum.round(totalExitFee, 5);
    if (mathBigNum.smaller(totalExitFee, minTradingFee)) {
      totalExitFee = minTradingFee;
    }
    totalExitFeeStr = convertToLocaleString(totalExitFee.toString(), 2, 5);

    // Calculate net gained
    // netGained = grossGained - totalEntryFee - totalExitFee
    let netGained = mathBigNum.subtract(
      mathBigNum.subtract(grossGained, totalEntryFee),
      totalExitFee
    );

    // Calculate net gained percentage
    netPercentageStr = "0";
    if (!mathBigNum.equal(totalEntryAmount, 0)) {
      // netGainedPercentage = (Math.abs(netGained) / totalEntryAmount) * 100
      let netPercentage = mathBigNum.multiply(
        mathBigNum.divide(netGained, totalEntryAmount),
        100
      ) as BigNumber;
      netPercentage = mathBigNum.round(netPercentage, 5);
      netPercentageStr = convertToLocaleString(netPercentage.toString(), 2, 5);
    }

    netGained = mathBigNum.round(netGained, 5);
    netGainedStr = convertToLocaleString(netGained.toString(), 2, 5);
  }

  return {
    totalEntryAmount: totalEntryAmountStr,
    totalExitAmount: totalExitAmountStr,
    grossGained: grossGainedStr,
    grossPercentage: grossPercentageStr,
    netGained: netGainedStr,
    netPercentage: netPercentageStr,
    estimatedEntryFee: totalEntryFeeStr,
    estimatedExitFee: totalExitFeeStr,
    isLong: input.isLong,
    includeTradingFee: input.includeTradingFee,
  };
};
