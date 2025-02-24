import { parseNumberFromString } from "../../../common/number/number";
import { checkMinMax } from "../../../common/validation/calculator.validation";
import {
  ERROR_FIELD_STOCK_ORDER,
  StockOrderInputType,
} from "./order.component";

export const validateOrderInput = (
  input: StockOrderInputType
): { err: string; field: ERROR_FIELD_STOCK_ORDER | null } => {
  if (!checkMinMax(input.entryPrice, 0)) {
    return {
      err: "Please enter a valid entry price.",
      field: ERROR_FIELD_STOCK_ORDER.ENTRY_PRICE,
    };
  }

  if (!checkMinMax(input.quantity, 0)) {
    return {
      err: "Please enter a valid quantity.",
      field: ERROR_FIELD_STOCK_ORDER.QUANTITY,
    };
  }

  let stopLossMin = 0;
  let stopLossMax;
  if (input.isLong) {
    stopLossMax = parseNumberFromString(input.entryPrice);
  } else {
    stopLossMin = parseNumberFromString(input.entryPrice);
  }

  if (!checkMinMax(input.stopLoss, stopLossMin, stopLossMax)) {
    return {
      err: "Please enter a valid stop loss.",
      field: ERROR_FIELD_STOCK_ORDER.STOP_LOSS,
    };
  }

  if (input.includeProfitGoal) {
    let profitGoalMin = 0;
    let profitGoalMax;
    if (input.isLong) {
      profitGoalMin = parseNumberFromString(input.entryPrice);
    } else {
      profitGoalMax = parseNumberFromString(input.entryPrice);
    }

    if (!checkMinMax(input.profitGoal, profitGoalMin, profitGoalMax)) {
      return {
        err: "Please enter a valid profit goal.",
        field: ERROR_FIELD_STOCK_ORDER.PROFIT_TARGET,
      };
    }
  }

  return { err: "", field: null };
};
