import { BigNumber } from "mathjs";
import {
  addBig,
  divideBig,
  mathBigNum,
  MILLION,
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
import { getBaseAndQuote } from "../../../../common/forex/forex";
import { FeeTyp } from "../forex_calculator_form.type";

export const calculateCrossHeight = (input: ProfitLossInputType) => {
  if (input.basePair === "" && input.quotePair === "") return 0;
  if (input.basePair !== "" && input.quotePair !== "") return 220;
  return 135;
};

export const validateProfitLossInput = (
  input: ProfitLossInputType
): { err: string; field: ERROR_FIELD_PROFIT_LOSS | null } => {
  if (!checkMinMax(input.lotSize, { min: 0, maxOrEqual: QUADRILLION })) {
    return {
      err: "Please enter a valid lot size.",
      field: ERROR_FIELD_PROFIT_LOSS.LOT_SIZE,
    };
  }

  if (!checkMinMax(input.contractSize, { min: 0, maxOrEqual: MILLION })) {
    return {
      err: "Please enter a valid contract size.",
      field: ERROR_FIELD_PROFIT_LOSS.CONTRACT_SIZE,
    };
  }

  if (!checkMinMax(input.pipDecimal, { minOrEqual: 0, maxOrEqual: MILLION })) {
    return {
      err: "Please enter a valid pip decimal.",
      field: ERROR_FIELD_PROFIT_LOSS.PIP_DECIMAL,
    };
  }

  if (
    input.basePair !== "" &&
    !checkMinMax(input.baseCrossRate, { min: 0, maxOrEqual: QUADRILLION })
  ) {
    return {
      err: "Please enter a valid cross rate.",
      field: ERROR_FIELD_PROFIT_LOSS.BASE_CROSS_RATE,
    };
  }

  if (
    input.quotePair !== "" &&
    !checkMinMax(input.quoteCrossRate, { min: 0, maxOrEqual: QUADRILLION })
  ) {
    return {
      err: "Please enter a valid cross rate.",
      field: ERROR_FIELD_PROFIT_LOSS.QUOTE_CROSS_RATE,
    };
  }

  if (!checkMinMax(input.entryPrice, { min: 0, maxOrEqual: QUADRILLION })) {
    return {
      err: "Please enter a valid open price.",
      field: ERROR_FIELD_PROFIT_LOSS.OPEN_PRICE,
    };
  }

  if (!checkMinMax(input.exitPrice, { min: 0, maxOrEqual: QUADRILLION })) {
    return {
      err: "Please enter a valid close price.",
      field: ERROR_FIELD_PROFIT_LOSS.EXIT_PRICE,
    };
  }

  if (input.includeTradingFee) {
    if (
      !checkMinMax(input.estTradingFee, { min: 0, maxOrEqual: QUADRILLION })
    ) {
      return {
        err: "Please estimates a valid trading fee.",
        field: ERROR_FIELD_PROFIT_LOSS.EST_TRADING_FEE,
      };
    }

    if (
      !checkMinMax(input.swapPerLot, {
        minOrEqual: QUADRILLION.negated(),
        maxOrEqual: QUADRILLION,
      })
    ) {
      return {
        err: "Please estimates a valid swap value.",
        field: ERROR_FIELD_PROFIT_LOSS.SWAP_PER_LOT,
      };
    }

    if (!checkMinMax(input.period, { min: 0, maxOrEqual: QUADRILLION })) {
      return {
        err: "Please estimates a valid period.",
        field: ERROR_FIELD_PROFIT_LOSS.PERIOD,
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
  const lotSize = parseBigNumberFromString(input.lotSize);
  const contractSize = parseBigNumberFromString(input.contractSize);
  const pipDecimal = parseBigNumberFromString(input.pipDecimal);
  const commissionFee = parseBigNumberFromString(input.estTradingFee);
  let swapRate = parseBigNumberFromString(input.swapPerLot);
  const period = parseBigNumberFromString(input.period);
  swapRate = multiplyBig(swapRate, period);

  // Get currency pair info
  const pairInfo = getBaseAndQuote(input.currencyPair);

  // Get base rate (XXXUSD)
  let openBaseRate = mathBigNum.bignumber(1);
  let exitBaseRate = mathBigNum.bignumber(1);
  if (input.basePair === "") {
    // acc base currency in the pair
    if (pairInfo.quote === input.accBaseCurrency) {
      openBaseRate = entryPrice;
      exitBaseRate = exitPrice;
    }
  } else {
    const baseRateInfo = getBaseAndQuote(input.basePair);
    const baseCrossRate = parseBigNumberFromString(input.baseCrossRate);
    openBaseRate =
      baseRateInfo.quote === input.accBaseCurrency
        ? baseCrossRate
        : divideBig(1, baseCrossRate);
    exitBaseRate = openBaseRate;
  }

  // Get quote rate (XXXUSD)
  let quoteRate = mathBigNum.bignumber(1);
  if (input.quotePair === "") {
    // acc base currency in the pair
    if (pairInfo.base === input.accBaseCurrency) {
      quoteRate = divideBig(1, exitPrice);
    }
  } else {
    const quoteRateInfo = getBaseAndQuote(input.quotePair);
    const quoteCrossRate = parseBigNumberFromString(input.quoteCrossRate);
    quoteRate =
      quoteRateInfo.quote === input.accBaseCurrency
        ? quoteCrossRate
        : divideBig(1, quoteCrossRate);
  }

  /* 
  Handle calculation
  */

  // priceDiff = input.isLong ? exitPrice - entryPrice : entryPrice - exitPrice
  const priceDiff = input.isLong
    ? subtractBig(exitPrice, entryPrice)
    : subtractBig(entryPrice, exitPrice);

  // positionSize = lotSize * contractSize
  let positionSize = multiplyBig(lotSize, contractSize);
  positionSize = mathBigNum.round(positionSize, 0);

  // pipSize = priceDiff / pipDecimal
  let pipSize = mathBigNum.bignumber(0);
  if (!mathBigNum.equal(pipDecimal, 0)) {
    pipSize = divideBig(priceDiff, pipDecimal);
    pipSize = mathBigNum.round(pipSize, input.precision);
  }

  // grossGained = priceDiff * positionSize * quoteRate
  const grossGained = multiplyBig(
    multiplyBig(priceDiff, positionSize),
    quoteRate
  );

  // Calculate fees
  let entryFee: BigNumber | undefined;
  let exitFee: BigNumber | undefined;
  let swapValue: BigNumber | undefined;
  let netGained: BigNumber | undefined;
  if (input.includeTradingFee) {
    swapValue = calcSwapValue(
      swapRate,
      pipDecimal,
      positionSize,
      quoteRate,
      input.precision
    );

    if (input.feeTyp === FeeTyp.COMMISSION_PER_LOT) {
      // fee = lotSize * commissionFee
      entryFee = multiplyBig(lotSize, commissionFee);
      entryFee = mathBigNum.round(entryFee, input.precision);
      exitFee = entryFee;
    } else {
      const commissionFeeRate = divideBig(commissionFee, 100000);

      // entryFee = positionSize * commissionFeeRate * openBaseRate
      entryFee = multiplyBig(
        multiplyBig(positionSize, commissionFeeRate),
        openBaseRate
      );
      entryFee = mathBigNum.round(entryFee, input.precision);

      // exitFee = lotSize * contractSize * commissionFeeRate * exitBaseRate
      exitFee = multiplyBig(
        multiplyBig(multiplyBig(lotSize, contractSize), commissionFeeRate),
        exitBaseRate
      );
      exitFee = mathBigNum.round(exitFee, input.precision);
    }

    // Calculate net gained
    // netGained = grossGained + swapValue - entryFee - exitFee
    netGained = subtractBig(
      subtractBig(addBig(grossGained, swapValue), entryFee),
      exitFee
    );
  }

  return {
    isLong: input.isLong,
    includeTradingFee: input.includeTradingFee,
    accBaseCurrency: input.accBaseCurrency,
    entryPrice: entryPrice,
    exitPrice: exitPrice,
    pipSize: pipSize,
    positionSize: positionSize,
    grossGained: grossGained,
    netGained: netGained,
    entryFee: entryFee,
    exitFee: exitFee,
    swapValue: swapValue,
  };
};

const calcSwapValue = (
  swapRate: BigNumber,
  pipDecimal: BigNumber,
  positionSize: BigNumber,
  quoteRate: BigNumber,
  precision: number
) => {
  // swapValue = swapRate * pipDecimal * positionSize * quoteRate / 10
  let swapValue = multiplyBig(
    multiplyBig(multiplyBig(swapRate, pipDecimal), positionSize),
    divideBig(quoteRate, 10)
  );
  swapValue = mathBigNum.round(swapValue, precision);

  return swapValue;
};
