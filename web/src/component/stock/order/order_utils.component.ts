import { QUADRILLION } from "../../../common/number/math";
import { parseBigNumberFromString } from "../../../common/number/number";
import {
  checkMinMax,
  CheckMinMaxOption,
} from "../../../common/validation/calculator.validation";
import { ERROR_FIELD_STOCK_ORDER, StockOrderInputType } from "./order.type";

export const validateOrderInput = (
  input: StockOrderInputType
): { err: string; field: ERROR_FIELD_STOCK_ORDER | null } => {
  if (!checkMinMax(input.entryPrice, { min: 0, maxOrEqual: QUADRILLION })) {
    return {
      err: "Please enter a valid entry price.",
      field: ERROR_FIELD_STOCK_ORDER.ENTRY_PRICE,
    };
  }

  if (!checkMinMax(input.quantity, { min: 0, maxOrEqual: QUADRILLION })) {
    return {
      err: "Please enter a valid quantity.",
      field: ERROR_FIELD_STOCK_ORDER.QUANTITY,
    };
  }

  const stopLossMinMaxOpt: CheckMinMaxOption = {};
  if (input.isLong) {
    stopLossMinMaxOpt.min = 0;
    stopLossMinMaxOpt.max = parseBigNumberFromString(input.entryPrice);
  } else {
    stopLossMinMaxOpt.min = parseBigNumberFromString(input.entryPrice);
    stopLossMinMaxOpt.maxOrEqual = QUADRILLION;
  }

  if (!checkMinMax(input.stopLoss, stopLossMinMaxOpt)) {
    return {
      err: "Please enter a valid stop loss.",
      field: ERROR_FIELD_STOCK_ORDER.STOP_LOSS,
    };
  }

  if (input.includeProfitGoal) {
    const profitGoalMinMaxOpt: CheckMinMaxOption = {};
    if (input.isLong) {
      profitGoalMinMaxOpt.min = parseBigNumberFromString(input.entryPrice);
      profitGoalMinMaxOpt.maxOrEqual = QUADRILLION;
    } else {
      profitGoalMinMaxOpt.max = parseBigNumberFromString(input.entryPrice);
      profitGoalMinMaxOpt.min = 0;
    }

    if (!checkMinMax(input.profitGoal, profitGoalMinMaxOpt)) {
      return {
        err: "Please enter a valid profit goal.",
        field: ERROR_FIELD_STOCK_ORDER.PROFIT_TARGET,
      };
    }
  }

  return { err: "", field: null };
};
