import { BigNumber } from "mathjs";
import { getBaseAndQuote } from "../../../../common/forex/forex";
import {
  addBig,
  divideBig,
  mathBigNum,
  MILLION,
  multiplyBig,
  QUADRILLION,
  QUINTILLION,
  subtractBig,
} from "../../../../common/number/math";
import {
  parseBigNumberFromString,
  parseNumberFromString,
} from "../../../../common/number/number";
import {
  ERROR_FIELD_POSITION_SIZE,
  ForexPositionSizeInputType,
  PositionSizeResultType,
} from "./position_size.type";
import { FeeTyp, ProfitGoalTyp } from "../forex_calculator_form.type";
import { checkMinMax } from "../../../../common/validation/calculator.validation";
import { LotTyp } from "../../../../component/forex/lot_typ_input_box/lot_typ.component";

export const calculateCrossHeight = (input: ForexPositionSizeInputType) => {
  if (input.basePair === "" && input.quotePair === "") return 0;
  if (input.basePair !== "" && input.quotePair !== "") return 220;
  return 135;
};

export const validatePositionSizeInput = (
  input: ForexPositionSizeInputType
): { err: string; field: ERROR_FIELD_POSITION_SIZE | null } => {
  if (
    !checkMinMax(input.portfolioCapital, { min: 0, maxOrEqual: QUINTILLION })
  ) {
    return {
      err: "Please enter a valid portfolio capital.",
      field: ERROR_FIELD_POSITION_SIZE.PORTFOLIO_CAPITAL,
    };
  }

  if (!checkMinMax(input.maxPortfolioRisk, { min: 0, max: 100 })) {
    return {
      err: "Please enter a valid max portflio risk.",
      field: ERROR_FIELD_POSITION_SIZE.MAX_PORTFOLIO_RISK,
    };
  }

  if (!checkMinMax(input.contractSize, { min: 0, maxOrEqual: MILLION })) {
    return {
      err: "Please enter a valid contract size.",
      field: ERROR_FIELD_POSITION_SIZE.CONTRACT_SIZE,
    };
  }

  if (!checkMinMax(input.pipDecimal, { minOrEqual: 0, maxOrEqual: MILLION })) {
    return {
      err: "Please enter a valid pip decimal.",
      field: ERROR_FIELD_POSITION_SIZE.PIP_DECIMAL,
    };
  }

  if (
    input.basePair !== "" &&
    !checkMinMax(input.baseCrossRate, { min: 0, maxOrEqual: QUADRILLION })
  ) {
    return {
      err: "Please enter a valid cross rate.",
      field: ERROR_FIELD_POSITION_SIZE.BASE_CROSS_RATE,
    };
  }

  if (
    input.quotePair !== "" &&
    !checkMinMax(input.quoteCrossRate, { min: 0, maxOrEqual: QUADRILLION })
  ) {
    return {
      err: "Please enter a valid cross rate.",
      field: ERROR_FIELD_POSITION_SIZE.QUOTE_CROSS_RATE,
    };
  }

  if (!checkMinMax(input.stopPip, { min: 0, maxOrEqual: QUADRILLION })) {
    return {
      err: "Please enter a valid stop loss.",
      field: ERROR_FIELD_POSITION_SIZE.STOP_LOSS,
    };
  }

  if (input.includeProfitGoal) {
    if (!checkMinMax(input.profitGoal, { min: 0, maxOrEqual: QUADRILLION })) {
      return {
        err:
          input.profitGoalTyp === ProfitGoalTyp.PORTFOLIO_BASED
            ? "Please enter a valid min portfolio profit."
            : "Please enter a valid profit target.",
        field: ERROR_FIELD_POSITION_SIZE.PROFIT_TARGET,
      };
    }
  }

  if (input.includeTradingFee) {
    if (
      !checkMinMax(input.estTradingFee, { min: 0, maxOrEqual: QUADRILLION })
    ) {
      return {
        err: "Please enter a valid trading fee.",
        field: ERROR_FIELD_POSITION_SIZE.EST_TRADING_FEE,
      };
    }

    if (
      !checkMinMax(input.swapPerLot, {
        minOrEqual: QUADRILLION.negated(),
        maxOrEqual: QUADRILLION,
      })
    ) {
      return {
        err: "Please enter a valid swap value.",
        field: ERROR_FIELD_POSITION_SIZE.SWAP_PER_LOT,
      };
    }

    if (!checkMinMax(input.period, { min: 0, maxOrEqual: QUADRILLION })) {
      return {
        err: "Please enter a valid period.",
        field: ERROR_FIELD_POSITION_SIZE.PERIOD,
      };
    }
  }

  return { err: "", field: null };
};

export const calculateResult = (
  input: ForexPositionSizeInputType
): PositionSizeResultType => {
  // Parse inputs
  const portfolioCapital = parseBigNumberFromString(input.portfolioCapital);
  const maxPortfolioRiskPercent = parseNumberFromString(input.maxPortfolioRisk);
  const maxPortfolioRiskRate = maxPortfolioRiskPercent / 100;
  const stopPip = parseBigNumberFromString(input.stopPip);
  const profitGoal = parseBigNumberFromString(input.profitGoal);
  const contractSize = parseBigNumberFromString(input.contractSize);
  const pipDecimal = parseBigNumberFromString(input.pipDecimal);
  const commissionFee = parseBigNumberFromString(input.estTradingFee);
  let swapRate = parseBigNumberFromString(input.swapPerLot);
  const period = parseBigNumberFromString(input.period);
  swapRate = multiplyBig(swapRate, period);

  // Get base rate (XXXUSD)
  let baseRate = mathBigNum.bignumber(1);
  if (input.basePair !== "") {
    const baseRateInfo = getBaseAndQuote(input.basePair);
    const baseCrossRate = parseBigNumberFromString(input.baseCrossRate);
    baseRate =
      baseRateInfo.quote === input.accBaseCurrency
        ? baseCrossRate
        : divideBig(1, baseCrossRate);
  }

  // Get quote rate (XXXUSD)
  let quoteRate = mathBigNum.bignumber(1);
  if (input.quotePair !== "") {
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

  // Calculate max loss
  // maxLoss = portfolioCapital * maxPortfolioRiskRate
  const maxLoss = multiplyBig(portfolioCapital, maxPortfolioRiskRate);

  // stopPriceDiff = stopPip * pipDecimal
  const stopPriceDiff = multiplyBig(stopPip, pipDecimal);

  // Calculate lot size
  let lotSize = mathBigNum.bignumber(0);
  let riskAmount = mathBigNum.bignumber(0);
  let entryFee: BigNumber | undefined;
  let stopFee: BigNumber | undefined;
  let swapValue: BigNumber | undefined;
  if (!input.includeTradingFee) {
    // Calculate lot size without commission fee
    lotSize = calcLotSize(
      maxLoss,
      input.lotTyp,
      contractSize,
      quoteRate,
      stopPriceDiff
    );

    // riskAmount = lotSize * contractSize * stopPriceDiff * quoteRate
    riskAmount = multiplyBig(
      multiplyBig(multiplyBig(lotSize, contractSize), stopPriceDiff),
      quoteRate
    );
  } else {
    if (input.feeTyp === FeeTyp.COMMISSION_PER_LOT) {
      // Calculate lot size with commission per lot
      lotSize = calcLotSizeWithLotBasedCommission(
        maxLoss,
        input.lotTyp,
        contractSize,
        quoteRate,
        stopPriceDiff,
        swapRate,
        commissionFee,
        pipDecimal
      );

      const getRiskAmountFn = (lotSize: BigNumber) => {
        // fee = lotSize * commissionFee
        let fee = multiplyBig(lotSize, commissionFee);
        fee = mathBigNum.round(fee, input.precision);

        // Calculate swap value
        const swapValue = calcSwapValue(
          swapRate,
          pipDecimal,
          lotSize,
          contractSize,
          quoteRate,
          input.precision
        );

        // riskAmount = lotSize * contractSize * stopPriceDiff * quoteRate - swapValue + fee * 2
        const riskAmt = subtractBig(
          addBig(
            multiplyBig(
              multiplyBig(multiplyBig(lotSize, contractSize), stopPriceDiff),
              quoteRate
            ),
            multiplyBig(fee, 2)
          ),
          swapValue
        );

        return {
          riskAmount: riskAmt,
          entryFee: fee,
          stopFee: fee,
          swapValue: swapValue,
        };
      };

      // Adjust lot size
      const adjustedRes = adjustLotSize(
        getRiskAmountFn,
        maxLoss,
        lotSize,
        input.lotTyp
      );

      lotSize = adjustedRes.lotSize;
      riskAmount = adjustedRes.riskAmount;
      entryFee = adjustedRes.entryFee;
      stopFee = adjustedRes.stopFee;
      swapValue = adjustedRes.swapValue;
    } else {
      // Calculate lot size with commission per 100k
      const commissionFeeRate = divideBig(commissionFee, 100000);
      lotSize = calcLotSizeWith100KBasedCommission(
        maxLoss,
        input.lotTyp,
        contractSize,
        stopPriceDiff,
        baseRate,
        quoteRate,
        swapRate,
        commissionFeeRate,
        pipDecimal
      );

      const getRiskAmountFn = (lotSize: BigNumber) => {
        // entryFee = lotSize * contractSize * commissionFeeRate * baseRate
        let entryFee = multiplyBig(
          multiplyBig(multiplyBig(lotSize, contractSize), commissionFeeRate),
          baseRate
        );
        entryFee = mathBigNum.round(entryFee, input.precision);
        stopFee = entryFee;

        // Calculate swap value
        const swapValue = calcSwapValue(
          swapRate,
          pipDecimal,
          lotSize,
          contractSize,
          quoteRate,
          input.precision
        );

        /* 
          riskAmount = 
            lotSize * contractSize * stopPriceDiff * quoteRate 
            - swapValue + entryFee + stopFee
        */
        const riskAmt = addBig(
          addBig(
            subtractBig(
              multiplyBig(
                multiplyBig(multiplyBig(lotSize, contractSize), stopPriceDiff),
                quoteRate
              ),
              swapValue
            ),
            entryFee
          ),
          stopFee
        );

        return {
          riskAmount: riskAmt,
          entryFee: entryFee,
          stopFee: stopFee,
          swapValue: swapValue,
        };
      };

      // Adjust lot size
      const adjustedRes = adjustLotSize(
        getRiskAmountFn,
        maxLoss,
        lotSize,
        input.lotTyp
      );

      lotSize = adjustedRes.lotSize;
      riskAmount = adjustedRes.riskAmount;
      entryFee = adjustedRes.entryFee;
      stopFee = adjustedRes.stopFee;
      swapValue = adjustedRes.swapValue;
    }
  }

  // portfolioRisk = (riskAmount / portfolioCapital) * 100
  let portfolioRisk = mathBigNum.bignumber(0);
  if (!mathBigNum.equal(portfolioCapital, 0)) {
    portfolioRisk = multiplyBig(divideBig(riskAmount, portfolioCapital), 100);
  }

  // positionSize = lotSize * contractSize
  let positionSize = multiplyBig(lotSize, contractSize);

  // marginToHold = positionSize * baseRate / leverage
  const marginToHold = input.isLong
    ? multiplyBig(positionSize, divideBig(baseRate, input.leverage))
    : multiplyBig(positionSize, divideBig(baseRate, input.leverage));

  // Calculate profit and profit fee
  let profitPip: BigNumber | undefined;
  let profitAmount: BigNumber | undefined;
  let profitFee: BigNumber | undefined;
  let portfolioProfit: BigNumber | undefined;
  if (input.includeProfitGoal) {
    if (input.profitGoalTyp === ProfitGoalTyp.PIP_BASED) {
      profitPip = profitGoal;

      // profitPriceDiff = profitPip * pipDecimal
      const profitPriceDiff = multiplyBig(profitPip, pipDecimal);

      // profitAmount = profitPriceDiff * positionSize * quoteRate
      profitAmount = multiplyBig(
        multiplyBig(profitPriceDiff, positionSize),
        quoteRate
      );

      if (input.includeTradingFee) {
        if (input.feeTyp === FeeTyp.COMMISSION_PER_LOT) {
          // profitFee = lotSize * commissionFee
          profitFee = multiplyBig(lotSize, commissionFee);
          profitFee = mathBigNum.round(profitFee, input.precision);
        } else {
          const commissionFeeRate = divideBig(commissionFee, 100000);

          // profitFee = lotSize * contractSize * commissionFeeRate * baseRate
          profitFee = multiplyBig(
            multiplyBig(multiplyBig(lotSize, contractSize), commissionFeeRate),
            baseRate
          );
          profitFee = mathBigNum.round(profitFee, input.precision);
        }

        if (
          entryFee !== undefined &&
          profitFee !== undefined &&
          swapValue !== undefined
        ) {
          // Recalculate profit amount
          // profitAmount = profitAmount - entryFee - profitFee + swapValue
          profitAmount = addBig(
            subtractBig(subtractBig(profitAmount, entryFee), profitFee),
            swapValue
          );
        }
      }
    } else {
      // minProfit = portfolioCapital * (profitGoal / 100)
      const minProfit = multiplyBig(
        portfolioCapital,
        divideBig(profitGoal, 100)
      );

      // Calculate profit price
      if (input.includeTradingFee) {
        // including trading fee

        /*
          minProfit = profitPriceDiff * positionSize * quoteRate - entryFee - profitFee + swapValue
          profitPriceDiff = (minProfit + entryFee + profitFee - swapValue) / (positionSize * quoteRate)
        */
        if (
          !mathBigNum.equal(positionSize, 0) &&
          !mathBigNum.equal(quoteRate, 0) &&
          entryFee !== undefined &&
          swapValue !== undefined
        ) {
          profitFee = entryFee;
          const profitPriceDiff = divideBig(
            subtractBig(
              addBig(addBig(minProfit, entryFee), profitFee),
              swapValue
            ),
            multiplyBig(positionSize, quoteRate)
          );

          // profitPip = profitPriceDiff / pipDecimal
          profitPip = mathBigNum.equal(pipDecimal, 0)
            ? mathBigNum.bignumber(0)
            : divideBig(profitPriceDiff, pipDecimal);
          profitPip = mathBigNum.ceil(profitPip);

          const getProfitAmountFn = (profitPip: BigNumber) => {
            if (
              entryFee === undefined ||
              profitFee === undefined ||
              swapValue === undefined
            )
              return {
                profitAmt: mathBigNum.bignumber(0),
                profitFee: mathBigNum.bignumber(0),
              };

            // profitAmt = profitPip * pipDecimal * positionSize * quoteRate - entryFee - profitFee - swapValue
            const profitAmt = subtractBig(
              subtractBig(
                subtractBig(
                  multiplyBig(
                    multiplyBig(
                      multiplyBig(profitPip, pipDecimal),
                      positionSize
                    ),
                    quoteRate
                  ),
                  entryFee
                ),
                profitFee
              ),
              swapValue
            );

            return { profitAmt, profitFee };
          };

          const adjustedRes = adjustProfitPip(
            getProfitAmountFn,
            minProfit,
            profitPip,
            input.isLong
          );
          profitPip = adjustedRes.profitPip;
          profitAmount = adjustedRes.profitAmount;
          profitFee = adjustedRes.profitFee;
        } else {
          profitPip = mathBigNum.bignumber(0);
          profitAmount = mathBigNum.bignumber(0);
          profitFee = mathBigNum.bignumber(0);
        }
      } else {
        // no trading fee

        /*
          minProfit = profitPriceDiff * positionSize * quoteRate
          profitPriceDiff = minProfit / (positionSize * quoteRate)
        */
        if (
          !mathBigNum.equal(positionSize, 0) &&
          !mathBigNum.equal(quoteRate, 0)
        ) {
          const profitPriceDiff = divideBig(
            minProfit,
            multiplyBig(positionSize, quoteRate)
          );

          // profitPip = profitPriceDiff / pipDecimal
          profitPip = divideBig(profitPriceDiff, pipDecimal);
          profitPip = mathBigNum.ceil(profitPip);

          // profitAmount = profitPip * pipDecimal * positionSize * quoteRate
          profitAmount = multiplyBig(
            multiplyBig(multiplyBig(profitPip, pipDecimal), positionSize),
            quoteRate
          );
        } else {
          profitPip = mathBigNum.bignumber(0);
          profitAmount = mathBigNum.bignumber(0);
        }
      }
    }

    if (profitAmount !== undefined) {
      // portfolioProfit = (profitAmount / portfolioCapital) * 100
      portfolioProfit = mathBigNum.equal(portfolioCapital, 0)
        ? mathBigNum.bignumber(0)
        : multiplyBig(divideBig(profitAmount, portfolioCapital), 100);
    }
  }

  // Calculate risk reward ratio and break even win rate
  let riskRewardRatio: BigNumber | undefined;
  let breakEvenWinRate: BigNumber | undefined;
  if (
    mathBigNum.larger(riskAmount, 0) &&
    profitAmount !== undefined &&
    mathBigNum.larger(profitAmount, 0)
  ) {
    // ratio = profitAmount / riskAmount
    riskRewardRatio = divideBig(profitAmount, riskAmount);

    // breakEvenWinRate = (1 / (1 + ratio)) * 100
    breakEvenWinRate = multiplyBig(
      divideBig(1, addBig(1, riskRewardRatio)),
      100
    );
  }

  return {
    isLong: input.isLong,
    includeTradingFee: input.includeTradingFee,
    includeProfitGoal: input.includeProfitGoal,
    accBaseCurrency: input.accBaseCurrency,
    stopPip: stopPip,
    profitPip: profitPip,
    positionSize: positionSize,
    lotSize: lotSize,
    marginToHold: marginToHold,
    riskAmount: riskAmount,
    portfolioRisk: portfolioRisk,
    profitAmount: profitAmount,
    portfolioProfit: portfolioProfit,
    riskRewardRatio: riskRewardRatio,
    breakEvenWinRate: breakEvenWinRate,
    entryFee: entryFee,
    stopFee: stopFee,
    profitFee: profitFee,
    swapValue: swapValue,
  };
};

const calcSwapValue = (
  swapRate: BigNumber,
  pipDecimal: BigNumber,
  lotSize: BigNumber,
  contractSize: BigNumber,
  quoteRate: BigNumber,
  precision: number
) => {
  // swapValue = swapRate * pipDecimal * lotSize * contractSize * quoteRate / 10
  let swapValue = multiplyBig(
    multiplyBig(
      multiplyBig(swapRate, pipDecimal),
      multiplyBig(lotSize, contractSize)
    ),
    divideBig(quoteRate, 10)
  );
  swapValue = mathBigNum.round(swapValue, precision);

  return swapValue;
};

const calcLotSize = (
  maxLoss: BigNumber,
  lotPrecision: number,
  contractSize: BigNumber,
  quoteRate: BigNumber,
  priceDiff: BigNumber
) => {
  let lotSize = mathBigNum.bignumber(0);

  /* 
    maxLoss = priceDiff * lotSize * contractSize * quoteRate
    lotSize = maxLoss / (priceDiff * contractSize * quoteRate)
  */
  const diff = multiplyBig(multiplyBig(priceDiff, quoteRate), contractSize);
  if (mathBigNum.equal(diff, 0)) {
    return lotSize;
  }
  lotSize = divideBig(maxLoss, diff);
  lotSize = mathBigNum.floor(lotSize, lotPrecision);

  return lotSize;
};

const calcLotSizeWithLotBasedCommission = (
  maxLoss: BigNumber,
  lotPrecision: number,
  contractSize: BigNumber,
  quoteRate: BigNumber,
  priceDiff: BigNumber,
  swapRate: BigNumber,
  commissionFee: BigNumber,
  pipDecimal: BigNumber
) => {
  let lotSize = mathBigNum.bignumber(0);

  /* 
    maxLoss = 
      priceDiff * lotSize * contractSize * quoteRate 
      + lotSize * commissionFee * 2 
      - swapRate * pipDecimal * lotSize * contractSize * quoteRate / 10
    
    lotSize = maxLoss /
      (
        priceDiff * contractSize * quoteRate
        + commissionFee * 2
        - swapRate * pipDecimal * contractSize * quoteRate / 10
      )
  */
  const diff = multiplyBig(multiplyBig(priceDiff, contractSize), quoteRate);
  if (mathBigNum.equal(diff, 0)) {
    return lotSize;
  }

  const commissionPart = multiplyBig(commissionFee, 2);
  const swapPart = divideBig(
    multiplyBig(
      multiplyBig(multiplyBig(swapRate, pipDecimal), contractSize),
      quoteRate
    ),
    10
  );
  const divisor = subtractBig(addBig(diff, commissionPart), swapPart);
  if (mathBigNum.equal(divisor, 0)) return lotSize;

  lotSize = divideBig(maxLoss, divisor);
  lotSize = mathBigNum.floor(lotSize, lotPrecision);

  return lotSize;
};

const calcLotSizeWith100KBasedCommission = (
  maxLoss: BigNumber,
  lotPrecision: number,
  contractSize: BigNumber,
  priceDiff: BigNumber,
  baseRate: BigNumber,
  quoteRate: BigNumber,
  swapRate: BigNumber,
  commissionFeeRate: BigNumber,
  pipDecimal: BigNumber
) => {
  let lotSize = mathBigNum.bignumber(0);

  /*
    maxLoss = 
      priceDiff * lotSize * contractSize * quoteRate
      - swapRate * pipDecimal * lotSize * contractSize * quoteRate / 10
      + lotSize * contractSize * commissionFeeRate * baseRate * 2

    lotSize = 
      maxLoss /
      (
        priceDiff * contractSize * quoteRate 
        + contractSize * commissionFeeRate * baseRate * 2
        - swapRate * pipDecimal * contractSize * quoteRate / 10
      )
  */

  const diff = multiplyBig(multiplyBig(priceDiff, contractSize), quoteRate);
  if (mathBigNum.equal(diff, 0)) {
    return lotSize;
  }

  const commissionPart = multiplyBig(
    multiplyBig(contractSize, commissionFeeRate),
    multiplyBig(baseRate, 2)
  );

  const swapPart = divideBig(
    multiplyBig(
      multiplyBig(multiplyBig(swapRate, pipDecimal), contractSize),
      quoteRate
    ),
    10
  );

  const divisor = subtractBig(addBig(diff, commissionPart), swapPart);
  if (mathBigNum.equal(divisor, 0)) return lotSize;

  lotSize = divideBig(maxLoss, divisor);
  lotSize = mathBigNum.floor(lotSize, lotPrecision);

  return lotSize;
};

const adjustLotSize = (
  getRiskAmountFn: (lotSize: BigNumber) => {
    riskAmount: BigNumber;
    entryFee: BigNumber;
    stopFee: BigNumber;
    swapValue: BigNumber;
  },
  maxLoss: BigNumber,
  lotSize: BigNumber,
  lotTyp: LotTyp
) => {
  if (mathBigNum.equal(lotSize, 0)) {
    return {
      lotSize,
      riskAmount: mathBigNum.bignumber(0),
      entryFee: mathBigNum.bignumber(0),
      stopFee: mathBigNum.bignumber(0),
      swapValue: mathBigNum.bignumber(0),
    };
  }

  const res = getRiskAmountFn(lotSize);
  let riskAmount = res.riskAmount;
  let entryFee = res.entryFee;
  let stopFee = res.stopFee;
  let swapValue = res.swapValue;

  const units = [1, 0.1, 0.01, 0.001];
  for (let i = 0; i <= lotTyp; i++) {
    let isSmaller = false;
    let tempLotSize = lotSize;
    let tempRiskAmount = riskAmount;
    let j = 0;

    while (
      !mathBigNum.equal(tempRiskAmount, maxLoss) &&
      mathBigNum.larger(tempLotSize, 0)
    ) {
      if (j >= 10000) {
        console.warn(
          `Max iterations reached (fn=forex_quantity, precision=${units[i]})`
        );
        break;
      }
      j++;

      if (mathBigNum.larger(tempRiskAmount, maxLoss)) {
        if (isSmaller) break;

        tempLotSize = subtractBig(tempLotSize, units[i]);
      } else {
        isSmaller = true;
        tempLotSize = addBig(tempLotSize, units[i]);
      }

      const res = getRiskAmountFn(tempLotSize);
      tempRiskAmount = res.riskAmount;

      if (mathBigNum.smallerEq(tempRiskAmount, maxLoss)) {
        lotSize = tempLotSize;
        entryFee = res.entryFee;
        stopFee = res.stopFee;
        swapValue = res.swapValue;
        riskAmount = res.riskAmount;
      }
    }
  }

  lotSize = mathBigNum.floor(lotSize, lotTyp);

  return { lotSize, riskAmount, entryFee, stopFee, swapValue };
};

const adjustProfitPip = (
  getProfitAmountFn: (profitPip: BigNumber) => {
    profitAmt: BigNumber;
    profitFee: BigNumber;
  },
  minProfit: BigNumber,
  profitPip: BigNumber,
  isLong: boolean
) => {
  const res = getProfitAmountFn(profitPip);
  let profitAmount = res.profitAmt;
  let profitFee = res.profitFee;

  let isLarger = false;
  let tempProfitPip = profitPip;
  let tempProfitAmt = profitAmount;
  let j = 0;

  while (
    !mathBigNum.equal(tempProfitAmt, minProfit) &&
    mathBigNum.larger(tempProfitPip, 0)
  ) {
    if (j >= 10000) {
      console.warn("Max iterations reached (fn=forex_profit, precision=1)");
      break;
    }
    j++;

    if (mathBigNum.larger(tempProfitAmt, minProfit)) {
      isLarger = true;
      tempProfitPip = isLong
        ? subtractBig(tempProfitPip, 1)
        : addBig(tempProfitPip, 1);
    } else {
      if (isLarger) break;
      tempProfitPip = isLong
        ? addBig(tempProfitPip, 1)
        : subtractBig(tempProfitPip, 1);
    }

    const res = getProfitAmountFn(tempProfitPip);
    tempProfitAmt = res.profitAmt;

    if (mathBigNum.largerEq(tempProfitAmt, minProfit)) {
      profitAmount = res.profitAmt;
      profitFee = res.profitFee;
      profitPip = tempProfitPip;
    }
  }

  return { profitAmount, profitPip, profitFee };
};
