import { BigNumber } from "mathjs";
import {
  addBig,
  divideBig,
  mathBigNum,
  multiplyBig,
  QUADRILLION,
  subtractBig,
} from "../../../../common/number/math";
import { parseBigNumberFromString } from "../../../../common/number/number";
import { checkMinMax } from "../../../../common/validation/calculator.validation";
import {
  ERROR_FIELD_PROFIT_LOSS,
  ProfitLossInputType,
  ProfitLossResultType,
} from "./profit_loss.type";

export const validateProfitLossInput = (
  input: ProfitLossInputType
): { err: string; field: ERROR_FIELD_PROFIT_LOSS | null } => {
  if (!checkMinMax(input.entryPrice, { min: 0, maxOrEqual: QUADRILLION })) {
    return {
      err: "Please enter a valid open price.",
      field: ERROR_FIELD_PROFIT_LOSS.ENTRY_PRICE,
    };
  }

  if (!checkMinMax(input.quantity, { min: 0, maxOrEqual: QUADRILLION })) {
    return {
      err: "Please enter a valid quantity.",
      field: ERROR_FIELD_PROFIT_LOSS.QUANTITY,
    };
  }

  if (!checkMinMax(input.exitPrice, { min: 0, maxOrEqual: QUADRILLION })) {
    return {
      err: "Please enter a valid close price.",
      field: ERROR_FIELD_PROFIT_LOSS.EXIT_PRICE,
    };
  }

  if (input.includeTradingFee) {
    if (!checkMinMax(input.estTradingFee, { min: 0, max: 100 })) {
      return {
        err: "Please estimates a valid trading fee.",
        field: ERROR_FIELD_PROFIT_LOSS.EST_TRADING_FEE,
      };
    }

    if (
      !checkMinMax(input.minTradingFee, { min: 0, maxOrEqual: QUADRILLION })
    ) {
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
  const estTradingFee = parseBigNumberFromString(input.estTradingFee);
  const estFeeRate = divideBig(estTradingFee, 100);
  const minTradingFee = parseBigNumberFromString(input.minTradingFee);

  /* 
  Handle calculation
  */

  // Calculate gross entry amount
  // grossEntryAmount = entryPrice * quantity
  const grossEntryAmount = multiplyBig(entryPrice, quantity);
  let totalEntryAmount = grossEntryAmount;

  // Calculate gross exit amount
  // grossExitAmount = exitPrice * quantity
  const grossExitAmount = multiplyBig(exitPrice, quantity);

  // Calculate fees
  let entryFee: BigNumber | undefined;
  let exitFee: BigNumber | undefined;
  if (input.includeTradingFee) {
    // Calculate total entry fee
    // entryFee = grossEntryAmount * estFeeRate
    entryFee = multiplyBig(grossEntryAmount, estFeeRate);
    if (mathBigNum.smaller(entryFee, minTradingFee)) {
      entryFee = minTradingFee;
    }

    // Calculate total entry amount
    totalEntryAmount = addBig(grossEntryAmount, entryFee);

    // Calculate total exit fee
    // exitFee = grossExitAmount * estFeeRate
    exitFee = multiplyBig(grossExitAmount, estFeeRate);
    if (mathBigNum.smaller(exitFee, minTradingFee)) {
      exitFee = minTradingFee;
    }
  }

  // Calculate gain and loss
  // grossGained = isLong ? grossExitAmount - grossEntryAmount: grossEntryAmount - grossExitAmount
  const grossGained = input.isLong
    ? subtractBig(grossExitAmount, grossEntryAmount)
    : subtractBig(grossEntryAmount, grossExitAmount);

  // Calculate gross gained percentage
  let grossPercentage = mathBigNum.bignumber(0);
  if (!mathBigNum.equal(grossEntryAmount, 0)) {
    // grossGainedPercentage = (grossGained / grossEntryAmount) * 100
    grossPercentage = multiplyBig(
      divideBig(grossGained, grossEntryAmount),
      100
    );
  }

  let netGained: BigNumber | undefined;
  let netPercentage: BigNumber | undefined;
  if (entryFee !== undefined && exitFee !== undefined) {
    // Calculate net gained
    // netGained = grossGained - totalEntryFee - totalExitFee
    netGained = subtractBig(subtractBig(grossGained, entryFee), exitFee);

    // Calculate net gained percentage
    netPercentage = mathBigNum.bignumber(0);
    if (!mathBigNum.equal(totalEntryAmount, 0)) {
      // netGainedPercentage = (netGained / totalEntryAmount) * 100
      netPercentage = multiplyBig(divideBig(netGained, totalEntryAmount), 100);
    }
  }

  return {
    entryAmount: totalEntryAmount,
    grossEntryAmount: grossEntryAmount,
    grossGained: grossGained,
    grossPercentage: grossPercentage,
    netGained: netGained,
    netPercentage: netPercentage,
    entryFee: entryFee,
    exitFee: exitFee,
    isLong: input.isLong,
    includeTradingFee: input.includeTradingFee,
  };
};
