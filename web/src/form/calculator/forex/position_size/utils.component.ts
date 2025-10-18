import { BigNumber } from "mathjs";
import { getBaseAndQuote } from "../../../../common/forex/forex";
import {
  absBig,
  addBig,
  divideBig,
  mathBigNum,
  multiplyBig,
  powBig,
  QUADRILLION,
  QUINTILLION,
  sqrtBig,
  subtractBig,
} from "../../../../common/number/math";
import {
  parseBigNumberFromString,
  parseNumberFromString,
} from "../../../../common/number/number";
import {
  ERROR_FIELD_POSITION_SIZE,
  ForexPositionSizeInputType,
} from "./position_size.type";
import { FeeTyp, ProfitGoalTyp } from "../forex_calculator_form.type";
import {
  checkMinMax,
  CheckMinMaxOption,
} from "../../../../common/validation/calculator.validation";
import { LotTyp } from "../../../../component/forex/lot_typ_input_box/lot_typ.component";

export const calculateCrossHeight = (input: ForexPositionSizeInputType) => {
  if (input.basePair === "" && input.quotePair === "") return 0;
  if (input.basePair !== "" && input.quotePair !== "") return 220;
  return 135;
};

export const calculateProfitHeight = (input: ForexPositionSizeInputType) => {
  if (!input.includeProfitGoal) return 0;
  if (input.isProfitPip) return 240;
  return 200;
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

  if (!checkMinMax(input.contractSize, { min: 0, max: 100000 })) {
    return {
      err: "Please enter a valid contract size.",
      field: ERROR_FIELD_POSITION_SIZE.CONTRACT_SIZE,
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

  if (!checkMinMax(input.entryPrice, { min: 0, maxOrEqual: QUADRILLION })) {
    return {
      err: "Please enter a valid open price.",
      field: ERROR_FIELD_POSITION_SIZE.OPEN_PRICE,
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
      field: ERROR_FIELD_POSITION_SIZE.STOP_LOSS,
    };
  }

  if (input.includeProfitGoal) {
    if (input.profitGoalTyp === ProfitGoalTyp.PORTFOLIO_BASED) {
      if (!checkMinMax(input.profitGoal, { min: 0, maxOrEqual: QUADRILLION })) {
        return {
          err: "Please enter a valid min portfolio profit.",
          field: ERROR_FIELD_POSITION_SIZE.PROFIT_TARGET,
        };
      }
    } else {
      const profitGoalMinMaxOpt: CheckMinMaxOption = {};
      if (input.isLong) {
        profitGoalMinMaxOpt.min = parseBigNumberFromString(input.entryPrice);
        profitGoalMinMaxOpt.maxOrEqual = QUADRILLION;
      } else {
        profitGoalMinMaxOpt.min = 0;
        profitGoalMinMaxOpt.max = parseBigNumberFromString(input.entryPrice);
      }

      if (!checkMinMax(input.profitGoal, profitGoalMinMaxOpt)) {
        return {
          err: "Please enter a valid profit target.",
          field: ERROR_FIELD_POSITION_SIZE.PROFIT_TARGET,
        };
      }
    }
  }

  if (input.includeTradingFee) {
    if (
      !checkMinMax(input.estTradingFee, { min: 0, maxOrEqual: QUADRILLION })
    ) {
      return {
        err: "Please estimates a valid trading fee.",
        field: ERROR_FIELD_POSITION_SIZE.EST_TRADING_FEE,
      };
    }

    if (
      !checkMinMax(input.swapFee, {
        minOrEqual: QUADRILLION.negated(),
        maxOrEqual: QUADRILLION,
      })
    ) {
      return {
        err: "Please estimates a valid swap fee.",
        field: ERROR_FIELD_POSITION_SIZE.SWAP_FEE,
      };
    }

    if (!checkMinMax(input.period, { min: 0, maxOrEqual: QUADRILLION })) {
      return {
        err: "Please estimates a valid swap fee.",
        field: ERROR_FIELD_POSITION_SIZE.SWAP_FEE,
      };
    }
  }

  return { err: "", field: null };
};

export const calculateResult = (
  input: ForexPositionSizeInputType
  // ): PositionSizeResultType => {
) => {
  // Parse inputs
  const portfolioCapital = parseBigNumberFromString(input.portfolioCapital);
  const maxPortfolioRiskPercent = parseNumberFromString(input.maxPortfolioRisk);
  const maxPortfolioRiskRate = maxPortfolioRiskPercent / 100;
  const entryPrice = parseBigNumberFromString(input.entryPrice);
  const stopLoss = parseBigNumberFromString(input.stopLoss);
  const profitGoal = parseBigNumberFromString(input.profitGoal);
  const contractSize = parseBigNumberFromString(input.contractSize);
  const commissionFee = parseBigNumberFromString(input.estTradingFee);
  let swapRate = parseBigNumberFromString(input.swapFee);
  const period = parseBigNumberFromString(input.period);
  swapRate = multiplyBig(swapRate, period);

  // Get currency pair info
  const pairInfo = getBaseAndQuote(input.currencyPair);

  // Get base rate (XXXUSD)
  let openBaseRate = mathBigNum.bignumber(1);
  let stopBaseRate = mathBigNum.bignumber(1);
  let profitBaseRate: BigNumber | undefined;
  if (input.basePair === "") {
    // acc base currency in the pair
    if (pairInfo.quote === input.accBaseCurrency) {
      openBaseRate = entryPrice;
      stopBaseRate = stopLoss;

      if (
        input.includeProfitGoal &&
        input.profitGoalTyp === ProfitGoalTyp.PRICE_BASED
      ) {
        profitBaseRate = profitGoal;
      }
    } else {
      profitBaseRate = mathBigNum.bignumber(1);
    }
  } else {
    const baseRateInfo = getBaseAndQuote(input.basePair);
    const baseCrossRate = parseBigNumberFromString(input.baseCrossRate);
    openBaseRate =
      baseRateInfo.quote === input.accBaseCurrency
        ? baseCrossRate
        : divideBig(1, baseCrossRate);
    stopBaseRate = openBaseRate;
    profitBaseRate = openBaseRate;
  }

  // Get quote rate (XXXUSD)
  let stopQuoteRate = mathBigNum.bignumber(1);
  let profitQuoteRate: BigNumber | undefined;
  if (input.quotePair === "") {
    // acc base currency in the pair
    if (pairInfo.base === input.accBaseCurrency) {
      stopQuoteRate = divideBig(1, stopLoss);

      if (
        input.includeProfitGoal &&
        input.profitGoalTyp === ProfitGoalTyp.PRICE_BASED
      ) {
        profitQuoteRate = divideBig(1, profitGoal);
      }
    } else {
      profitQuoteRate = mathBigNum.bignumber(1);
    }
  } else {
    const quoteRateInfo = getBaseAndQuote(input.quotePair);
    const quoteCrossRate = parseBigNumberFromString(input.quoteCrossRate);
    stopQuoteRate =
      quoteRateInfo.quote === input.accBaseCurrency
        ? quoteCrossRate
        : divideBig(1, quoteCrossRate);
    profitQuoteRate = stopQuoteRate;
  }

  /*
  Handle calculation
  */

  // Calculate max loss
  // maxLoss = portfolioCapital * maxPortfolioRiskRate
  const maxLoss = multiplyBig(portfolioCapital, maxPortfolioRiskRate);

  // stopPriceDiff = Math.abs(stopLoss - entryPrice)
  const stopPriceDiff = absBig(subtractBig(stopLoss, entryPrice));

  // stopPip = stopPriceDiff / pipSize
  let stopPip = divideBig(stopPriceDiff, input.pipSize);
  stopPip = mathBigNum.round(stopPip, input.precision);

  // Calculate lot size
  let lotSize = mathBigNum.bignumber(0);
  let riskAmount = mathBigNum.bignumber(0);
  let entryFee: BigNumber | undefined;
  let stopFee: BigNumber | undefined;
  let stopSwapFee: BigNumber | undefined;
  if (!input.includeTradingFee) {
    // Calculate lot size without commission fee
    lotSize = calcLotSize(
      maxLoss,
      input.lotTyp,
      contractSize,
      stopQuoteRate,
      stopPriceDiff
    );

    const getRiskAmountFn = (lotSize: BigNumber) => {
      // riskAmount = lotSize * contractSize * stopPriceDiff * quoteRate
      const riskAmt = multiplyBig(
        multiplyBig(multiplyBig(lotSize, contractSize), stopPriceDiff),
        stopQuoteRate
      );

      return {
        riskAmount: riskAmt,
        entryFee: mathBigNum.bignumber(0),
        stopFee: mathBigNum.bignumber(0),
        swapFee: mathBigNum.bignumber(0),
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
  } else {
    if (input.feeTyp === FeeTyp.COMMISSION_PER_LOT) {
      // Calculate lot size with commission per lot
      lotSize = calcLotSizeWithLotBasedCommission(
        maxLoss,
        input.lotTyp,
        contractSize,
        stopQuoteRate,
        stopPriceDiff,
        swapRate,
        commissionFee,
        input.pipSize
      );

      const getRiskAmountFn = (lotSize: BigNumber) => {
        // fee = lotSize * commissionFee
        let fee = multiplyBig(lotSize, commissionFee);
        fee = mathBigNum.round(fee, input.precision);

        // Calculate swap fee
        const swapFee = calcSwapFee(
          swapRate,
          input.pipSize,
          lotSize,
          contractSize,
          stopQuoteRate,
          input.precision
        );

        // riskAmount = lotSize * contractSize * stopPriceDiff * quoteRate - swapFee + fee * 2
        const riskAmt = subtractBig(
          addBig(
            multiplyBig(
              multiplyBig(multiplyBig(lotSize, contractSize), stopPriceDiff),
              stopQuoteRate
            ),
            multiplyBig(fee, 2)
          ),
          swapFee
        );

        return {
          riskAmount: riskAmt,
          entryFee: fee,
          stopFee: fee,
          swapFee: swapFee,
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
      stopSwapFee = adjustedRes.swapFee;
    } else {
      // Calculate lot size with commission per 100k
      const commissionFeeRate = divideBig(commissionFee, 100000);
      lotSize = calcLotSizeWith100KBasedCommission(
        maxLoss,
        input.lotTyp,
        contractSize,
        stopPriceDiff,
        openBaseRate,
        stopBaseRate,
        stopQuoteRate,
        swapRate,
        commissionFeeRate,
        input.pipSize
      );

      const getRiskAmountFn = (lotSize: BigNumber) => {
        // entryFee = lotSize * contractSize * commissionFeeRate * openBaseRate
        let entryFee = multiplyBig(
          multiplyBig(multiplyBig(lotSize, contractSize), commissionFeeRate),
          openBaseRate
        );
        entryFee = mathBigNum.round(entryFee, input.precision);

        // stopFee = lotSize * contractSize * commissionFeeRate * stopBaseRate
        let stopFee = multiplyBig(
          multiplyBig(multiplyBig(lotSize, contractSize), commissionFeeRate),
          stopBaseRate
        );
        stopFee = mathBigNum.round(stopFee, input.precision);

        // Calculate swap fee
        const swapFee = calcSwapFee(
          swapRate,
          input.pipSize,
          lotSize,
          contractSize,
          stopQuoteRate,
          input.precision
        );

        /* 
          riskAmount = 
            lotSize * contractSize * stopPriceDiff * quoteRate 
            - swapFee + entryFee + stopFee
        */
        const riskAmt = addBig(
          addBig(
            subtractBig(
              multiplyBig(
                multiplyBig(multiplyBig(lotSize, contractSize), stopPriceDiff),
                stopQuoteRate
              ),
              swapFee
            ),
            entryFee
          ),
          stopFee
        );

        return {
          riskAmount: riskAmt,
          entryFee: entryFee,
          stopFee: stopFee,
          swapFee: swapFee,
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
      stopSwapFee = adjustedRes.swapFee;
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
    ? multiplyBig(positionSize, divideBig(openBaseRate, input.leverage))
    : multiplyBig(positionSize, divideBig(stopBaseRate, input.leverage));

  // Calculate profit and profit fee
  let profitPrice: BigNumber | undefined;
  let profitPip: BigNumber | undefined;
  let profitAmount: BigNumber | undefined;
  let profitFee: BigNumber | undefined;
  let profitSwapFee: BigNumber | undefined;
  let portfolioProfit: BigNumber | undefined;
  if (input.includeProfitGoal) {
    if (input.profitGoalTyp === ProfitGoalTyp.PRICE_BASED) {
      profitPrice = profitGoal;

      // profitPriceDiff = abs(profitPrice - entryPrice)
      const profitPriceDiff = subtractBig(profitPrice, entryPrice);

      // profitPip = profitPriceDiff / pipSize
      profitPip = divideBig(profitPriceDiff, input.pipSize);
      profitPip = mathBigNum.round(profitPip, input.precision);

      if (profitQuoteRate) {
        // profitAmount = profitPriceDiff * positionSize * quoteRate
        profitAmount = multiplyBig(
          multiplyBig(profitPriceDiff, positionSize),
          profitQuoteRate
        );

        if (input.includeTradingFee) {
          if (input.feeTyp === FeeTyp.COMMISSION_PER_LOT) {
            // profitFee = lotSize * commissionFee
            profitFee = multiplyBig(lotSize, commissionFee);
            profitFee = mathBigNum.round(profitFee, input.precision);
          } else {
            const commissionFeeRate = divideBig(commissionFee, 100000);
            if (profitBaseRate) {
              // profitFee = lotSize * contractSize * commissionFeeRate * profitBaseRate
              profitFee = multiplyBig(
                multiplyBig(
                  multiplyBig(lotSize, contractSize),
                  commissionFeeRate
                ),
                profitBaseRate
              );
              profitFee = mathBigNum.round(profitFee, input.precision);
            }
          }

          // Calculate swap fee
          profitSwapFee = calcSwapFee(
            swapRate,
            input.pipSize,
            lotSize,
            contractSize,
            profitQuoteRate,
            input.precision
          );

          if (entryFee && profitFee) {
            // Recalculate profit amount
            // profitAmount = profitAmount - entryFee - profitFee + swapFee
            profitAmount = addBig(
              subtractBig(subtractBig(profitAmount, entryFee), profitFee),
              profitSwapFee
            );
          }
        }
      }
    } else {
      // minProfit = portfolioCapital * (profitGoal / 100)
      const minProfit = multiplyBig(
        portfolioCapital,
        divideBig(profitGoal, 100)
      );

      // Calculate profit price
      if (entryFee !== undefined) {
        // including trading fee

        if (input.feeTyp === FeeTyp.COMMISSION_PER_LOT) {
          if (profitQuoteRate !== undefined) {
            /*
              minProfit = isLong ? 
                (profitPrice - entryPrice) * positionSize * quoteRate
                - 2 * entryFee
                + swapRate * pipSize * positionSize * quoteRate / 10 
                :
                (entryPrice - profitPrice) * positionSize * quoteRate
                - 2 * entryFee
                + swapRate * pipSize * positionSize * quoteRate / 10  

              profitPrice = isLong ?
                entryPrice
                + (minProfit + 2 * entryFee) / (positionSize * quoteRate)
                - swapRate * pipSize / 10
                :
                entryPrice 
                - (minProfit + 2 * entryFee) / (positionSize * quoteRate)
                + swapRate * pipSize / 10
            */

            if (
              !mathBigNum.equal(positionSize, 0) &&
              !mathBigNum.equal(profitQuoteRate, 0)
            ) {
              if (input.isLong) {
                profitPrice = subtractBig(
                  addBig(
                    entryPrice,
                    divideBig(
                      addBig(minProfit, multiplyBig(entryFee, 2)),
                      multiplyBig(positionSize, profitQuoteRate)
                    )
                  ),
                  divideBig(multiplyBig(swapRate, input.pipSize), 10)
                );
                profitPrice = mathBigNum.ceil(profitPrice, 5);
              } else {
                profitPrice = addBig(
                  subtractBig(
                    entryPrice,
                    divideBig(
                      addBig(minProfit, multiplyBig(entryFee, 2)),
                      multiplyBig(positionSize, profitQuoteRate)
                    )
                  ),
                  divideBig(multiplyBig(swapRate, input.pipSize), 10)
                );
                profitPrice = mathBigNum.floor(profitPrice, 5);
              }

              const getProfitAmountFn = (profitPrice: BigNumber) => {
                if (profitQuoteRate === undefined || entryFee === undefined)
                  return {
                    profitAmt: mathBigNum.bignumber(0),
                    profitFee: mathBigNum.bignumber(0),
                    swapFee: mathBigNum.bignumber(0),
                  };

                const profitFee = entryFee;
                const swapFee = calcSwapFee(
                  swapRate,
                  input.pipSize,
                  lotSize,
                  contractSize,
                  profitQuoteRate,
                  input.precision
                );

                return getProfitAmount(
                  entryPrice,
                  profitPrice,
                  entryFee,
                  profitFee,
                  swapFee,
                  positionSize,
                  profitQuoteRate
                );
              };

              const adjustedRes = adjustProfitPrice(
                getProfitAmountFn,
                minProfit,
                profitPrice,
                input.isLong
              );
              profitPrice = adjustedRes.profitPrice;
              profitAmount = adjustedRes.profitAmount;
              profitFee = adjustedRes.profitFee;
              profitSwapFee = adjustedRes.swapFee;
            } else {
              profitPrice = mathBigNum.bignumber(0);
              profitAmount = mathBigNum.bignumber(0);
              profitFee = mathBigNum.bignumber(0);
              profitSwapFee = mathBigNum.bignumber(0);
            }
          } else {
            /*
              minProfit = isLong ? 
                (profitPrice - entryPrice) * positionSize / profitPrice 
                - 2 * entryFee
                + swapRate * pipSize * positionSize / (10 * profitPrice)
                :
                (entryPrice - profitPrice) * positionSize / profitPrice
                - 2 * entryFee
                + swapRate * pipSize * positionSize / (10 * profitPrice)            

              profitPrice = isLong ?
                (positionSize * (swapRate * pipSize / 10 - entryPrice)) / (minProfit + 2 * entryFee - positionSize) :
                (positionSize * (swapRate * pipSize / 10 + entryPrice)) / (minProfit + 2 * entryFee + positionSize)
            */

            const divisor = input.isLong
              ? subtractBig(
                  addBig(minProfit, multiplyBig(entryFee, 2)),
                  positionSize
                )
              : addBig(
                  addBig(minProfit, multiplyBig(entryFee, 2)),
                  positionSize
                );

            if (
              !mathBigNum.equal(divisor, 0) &&
              !mathBigNum.equal(positionSize, 0)
            ) {
              if (input.isLong) {
                profitPrice = divideBig(
                  multiplyBig(
                    positionSize,
                    subtractBig(
                      multiplyBig(swapRate, divideBig(input.pipSize, 10)),
                      entryPrice
                    )
                  ),
                  divisor
                );
                profitPrice = mathBigNum.ceil(profitPrice, 5);
              } else {
                profitPrice = divideBig(
                  multiplyBig(
                    positionSize,
                    addBig(
                      multiplyBig(swapRate, divideBig(input.pipSize, 10)),
                      entryPrice
                    )
                  ),
                  divisor
                );
                profitPrice = mathBigNum.floor(profitPrice, 5);
              }

              const getProfitAmountFn = (profitPrice: BigNumber) => {
                if (entryFee === undefined)
                  return {
                    profitAmt: mathBigNum.bignumber(0),
                    profitFee: mathBigNum.bignumber(0),
                    swapFee: mathBigNum.bignumber(0),
                  };

                const profitFee = entryFee;
                const profitQuoteRate = divideBig(1, profitPrice);
                const swapFee = calcSwapFee(
                  swapRate,
                  input.pipSize,
                  lotSize,
                  contractSize,
                  profitQuoteRate,
                  input.precision
                );

                return getProfitAmount(
                  entryPrice,
                  profitPrice,
                  entryFee,
                  profitFee,
                  swapFee,
                  positionSize,
                  profitQuoteRate
                );
              };

              const adjustedRes = adjustProfitPrice(
                getProfitAmountFn,
                minProfit,
                profitPrice,
                input.isLong
              );
              profitPrice = adjustedRes.profitPrice;
              profitAmount = adjustedRes.profitAmount;
              profitFee = adjustedRes.profitFee;
              profitSwapFee = adjustedRes.swapFee;
            } else {
              profitPrice = mathBigNum.bignumber(0);
              profitAmount = mathBigNum.bignumber(0);
              profitFee = mathBigNum.bignumber(0);
              profitSwapFee = mathBigNum.bignumber(0);
            }
          }
        } else {
          const commissionFeeRate = divideBig(commissionFee, 100000);

          if (profitQuoteRate !== undefined) {
            if (profitBaseRate !== undefined) {
              /*
                minProfit = isLong ? 
                  (profitPrice - entryPrice) * positionSize * quoteRate
                  - entryFee
                  - positionSize * commissionFeeRate * exitBaseRate
                  + swapRate * pipSize * positionSize * quoteRate / 10 
                  :
                  (entryPrice - profitPrice) * positionSize * quoteRate
                  - entryFee
                  - positionSize * commissionFeeRate * exitBaseRate
                  + swapRate * pipSize * positionSize * quoteRate / 10  

                profitPrice = isLong ?
                  entryPrice 
                  + (minProfit + entryFee) / (positionSize * quoteRate)
                  + commissionFeeRate * exitBaseRate / quoteRate
                  - swapRate * pipSize / 10
                  :
                  entryPrice 
                  - (minProfit + entryFee) / (positionSize * quoteRate)
                  - commissionFeeRate * exitBaseRate / quoteRate
                  + swapRate * pipSize / 10
              */

              if (
                !mathBigNum.equal(positionSize, 0) &&
                !mathBigNum.equal(profitQuoteRate, 0)
              ) {
                if (input.isLong) {
                  profitPrice = subtractBig(
                    addBig(
                      addBig(
                        entryPrice,
                        divideBig(
                          addBig(minProfit, entryFee),
                          multiplyBig(positionSize, profitQuoteRate)
                        )
                      ),
                      multiplyBig(
                        commissionFeeRate,
                        divideBig(profitBaseRate, profitQuoteRate)
                      )
                    ),
                    multiplyBig(swapRate, divideBig(input.pipSize, 10))
                  );
                  profitPrice = mathBigNum.ceil(profitPrice, 5);
                } else {
                  profitPrice = addBig(
                    subtractBig(
                      subtractBig(
                        entryPrice,
                        divideBig(
                          addBig(minProfit, entryFee),
                          multiplyBig(positionSize, profitQuoteRate)
                        )
                      ),
                      multiplyBig(
                        commissionFeeRate,
                        divideBig(profitBaseRate, profitQuoteRate)
                      )
                    ),
                    multiplyBig(swapRate, divideBig(input.pipSize, 10))
                  );
                  profitPrice = mathBigNum.floor(profitPrice, 5);
                }

                const getProfitAmountFn = (profitPrice: BigNumber) => {
                  if (
                    profitQuoteRate === undefined ||
                    profitBaseRate === undefined ||
                    entryFee === undefined
                  ) {
                    return {
                      profitAmt: mathBigNum.bignumber(0),
                      profitFee: mathBigNum.bignumber(0),
                      swapFee: mathBigNum.bignumber(0),
                    };
                  }

                  const profitFee = multiplyBig(
                    multiplyBig(positionSize, commissionFeeRate),
                    profitBaseRate
                  );
                  const swapFee = calcSwapFee(
                    swapRate,
                    input.pipSize,
                    lotSize,
                    contractSize,
                    profitQuoteRate,
                    input.precision
                  );

                  return getProfitAmount(
                    entryPrice,
                    profitPrice,
                    entryFee,
                    profitFee,
                    swapFee,
                    positionSize,
                    profitQuoteRate
                  );
                };

                const adjustedRes = adjustProfitPrice(
                  getProfitAmountFn,
                  minProfit,
                  profitPrice,
                  input.isLong
                );
                profitPrice = adjustedRes.profitPrice;
                profitAmount = adjustedRes.profitAmount;
                profitFee = adjustedRes.profitFee;
                profitSwapFee = adjustedRes.swapFee;
              } else {
                profitPrice = mathBigNum.bignumber(0);
                profitAmount = mathBigNum.bignumber(0);
                profitFee = mathBigNum.bignumber(0);
                profitSwapFee = mathBigNum.bignumber(0);
              }
            } else {
              /*
                minProfit = isLong ? 
                  (profitPrice - entryPrice) * positionSize * quoteRate
                  - entryFee
                  - positionSize * commissionFeeRate * profitPrice
                  + swapRate * pipSize * positionSize * quoteRate / 10 
                  :
                  (entryPrice - profitPrice) * positionSize * quoteRate
                  - entryFee
                  - positionSize * commissionFeeRate * profitPrice
                  + swapRate * pipSize * positionSize * quoteRate / 10

                profitPrice = isLong ?
                  (
                    positionSize * (
                      entryPrice * quoteRate
                      - swapRate * pipSize * quoteRate / 10 
                    )
                    + minProfit 
                    + entryFee 
                  ) / (
                    positionSize * (quoteRate - commissionFeeRate)
                  )
                  :
                  (
                    positionSize * (
                      entryPrice * quoteRate
                      + swapRate * pipSize * quoteRate / 10 
                    )
                    - minProfit 
                    - entryFee 
                  ) / (
                    positionSize * (quoteRate + commissionFeeRate)
                  )
              */

              const divisor = input.isLong
                ? multiplyBig(
                    positionSize,
                    subtractBig(profitQuoteRate, commissionFeeRate)
                  )
                : multiplyBig(
                    positionSize,
                    addBig(profitQuoteRate, commissionFeeRate)
                  );

              if (!mathBigNum.equal(divisor, 0)) {
                if (input.isLong) {
                  profitPrice = divideBig(
                    addBig(
                      addBig(
                        multiplyBig(
                          positionSize,
                          subtractBig(
                            multiplyBig(entryPrice, profitQuoteRate),
                            multiplyBig(
                              multiplyBig(swapRate, input.pipSize),
                              divideBig(profitQuoteRate, 10)
                            )
                          )
                        ),
                        minProfit
                      ),
                      entryFee
                    ),
                    divisor
                  );
                  profitPrice = mathBigNum.ceil(profitPrice, 5);
                } else {
                  profitPrice = divideBig(
                    subtractBig(
                      subtractBig(
                        multiplyBig(
                          positionSize,
                          addBig(
                            multiplyBig(entryPrice, profitQuoteRate),
                            multiplyBig(
                              multiplyBig(swapRate, input.pipSize),
                              divideBig(profitQuoteRate, 10)
                            )
                          )
                        ),
                        minProfit
                      ),
                      entryFee
                    ),
                    divisor
                  );
                  profitPrice = mathBigNum.floor(profitPrice, 5);
                }

                const getProfitAmountFn = (profitPrice: BigNumber) => {
                  if (profitQuoteRate === undefined || entryFee === undefined) {
                    return {
                      profitAmt: mathBigNum.bignumber(0),
                      profitFee: mathBigNum.bignumber(0),
                      swapFee: mathBigNum.bignumber(0),
                    };
                  }

                  const profitBaseRate = profitPrice;
                  const profitFee = multiplyBig(
                    multiplyBig(positionSize, commissionFeeRate),
                    profitBaseRate
                  );
                  const swapFee = calcSwapFee(
                    swapRate,
                    input.pipSize,
                    lotSize,
                    contractSize,
                    profitQuoteRate,
                    input.precision
                  );

                  return getProfitAmount(
                    entryPrice,
                    profitPrice,
                    entryFee,
                    profitFee,
                    swapFee,
                    positionSize,
                    profitQuoteRate
                  );
                };

                const adjustedRes = adjustProfitPrice(
                  getProfitAmountFn,
                  minProfit,
                  profitPrice,
                  input.isLong
                );
                profitPrice = adjustedRes.profitPrice;
                profitAmount = adjustedRes.profitAmount;
                profitFee = adjustedRes.profitFee;
                profitSwapFee = adjustedRes.swapFee;
              } else {
                profitPrice = mathBigNum.bignumber(0);
                profitAmount = mathBigNum.bignumber(0);
                profitFee = mathBigNum.bignumber(0);
                profitSwapFee = mathBigNum.bignumber(0);
              }
            }
          } else {
            if (profitBaseRate !== undefined) {
              /*
                minProfit = isLong ? 
                  (profitPrice - entryPrice) * positionSize / profitPrice
                  - entryFee
                  - positionSize * commissionFeeRate * exitBaseRate
                  + swapRate * pipSize * positionSize / (10 * profitPrice) 
                  :
                  (entryPrice - profitPrice) * positionSize / profitPrice
                  - entryFee
                  - positionSize * commissionFeeRate * exitBaseRate
                  + swapRate * pipSize * positionSize / (10 * profitPrice)  

                profitPrice = isLong ?
                  positionSize * (swapRate * pipSize / 10 - entryPrice) / (
                    minProfit + entryFee + positionSize * (commissionFeeRate * exitBaseRate - 1)
                  )
                  :
                  positionSize * (swapRate * pipSize / 10 + entryPrice) / (
                    minProfit + entryFee + positionSize * (commissionFeeRate * exitBaseRate + 1)
                  )
              */

              const divisor = input.isLong
                ? addBig(
                    addBig(minProfit, entryFee),
                    multiplyBig(
                      positionSize,
                      subtractBig(
                        multiplyBig(commissionFeeRate, profitBaseRate),
                        1
                      )
                    )
                  )
                : addBig(
                    addBig(minProfit, entryFee),
                    multiplyBig(
                      positionSize,
                      addBig(multiplyBig(commissionFeeRate, profitBaseRate), 1)
                    )
                  );

              if (
                !mathBigNum.equal(divisor, 0) &&
                !mathBigNum.equal(positionSize, 0)
              ) {
                if (input.isLong) {
                  profitPrice = divideBig(
                    multiplyBig(
                      positionSize,
                      subtractBig(
                        multiplyBig(swapRate, divideBig(input.pipSize, 10)),
                        entryPrice
                      )
                    ),
                    divisor
                  );
                  profitPrice = mathBigNum.ceil(profitPrice, 5);
                } else {
                  profitPrice = divideBig(
                    multiplyBig(
                      positionSize,
                      addBig(
                        multiplyBig(swapRate, divideBig(input.pipSize, 10)),
                        entryPrice
                      )
                    ),
                    divisor
                  );
                  profitPrice = mathBigNum.floor(profitPrice, 5);
                }

                const getProfitAmountFn = (profitPrice: BigNumber) => {
                  if (profitBaseRate === undefined || entryFee === undefined) {
                    return {
                      profitAmt: mathBigNum.bignumber(0),
                      profitFee: mathBigNum.bignumber(0),
                      swapFee: mathBigNum.bignumber(0),
                    };
                  }

                  const profitQuoteRate = divideBig(1, profitPrice);
                  const profitFee = multiplyBig(
                    multiplyBig(positionSize, commissionFeeRate),
                    profitBaseRate
                  );
                  const swapFee = calcSwapFee(
                    swapRate,
                    input.pipSize,
                    lotSize,
                    contractSize,
                    profitQuoteRate,
                    input.precision
                  );

                  return getProfitAmount(
                    entryPrice,
                    profitPrice,
                    entryFee,
                    profitFee,
                    swapFee,
                    positionSize,
                    profitQuoteRate
                  );
                };

                const adjustedRes = adjustProfitPrice(
                  getProfitAmountFn,
                  minProfit,
                  profitPrice,
                  input.isLong
                );
                profitPrice = adjustedRes.profitPrice;
                profitAmount = adjustedRes.profitAmount;
                profitFee = adjustedRes.profitFee;
                profitSwapFee = adjustedRes.swapFee;
              } else {
                profitPrice = mathBigNum.bignumber(0);
                profitAmount = mathBigNum.bignumber(0);
                profitFee = mathBigNum.bignumber(0);
                profitSwapFee = mathBigNum.bignumber(0);
              }
            } else {
              /*
                minProfit = isLong ? 
                  (profitPrice - entryPrice) * positionSize / profitPrice
                  - entryFee
                  - positionSize * commissionFeeRate * profitPrice
                  + swapRate * pipSize * positionSize / (10 * profitPrice) 
                  :
                  (entryPrice - profitPrice) * positionSize / profitPrice
                  - entryFee
                  - positionSize * commissionFeeRate * profitPrice
                  + swapRate * pipSize * positionSize / (10 * profitPrice)  

                profitPrice = isLong ?
                  minPositiveProfitPrice(
                    (
                      positionSize - minProfit - entryFee + sqrt(
                        (minProfit + entryFee - positionSize)^2 - 4 * positionSize * commissionFeeRate * positionSize * (entryPrice - swapRate * pipSize / 10)
                      )
                    ) / (
                      2 * positionSize * commissionFeeRate 
                    ),
                    (
                      positionSize - minProfit - entryFee - sqrt(
                        (minProfit + entryFee - positionSize)^2 - 4 * positionSize * commissionFeeRate * positionSize * (entryPrice - swapRate * pipSize / 10)
                      )
                    ) / (
                      2 * positionSize * commissionFeeRate 
                    )
                  )
                  :
                  maxPositiveProfitPrice(
                    (
                      -positionSize - minProfit - entryFee + sqrt(
                        (minProfit + entryFee + positionSize)^2 - 4 * positionSize * commissionFeeRate * -positionSize * (entryPrice + swapRate * pipSize / 10)
                      )
                    ) / (
                      2 * positionSize * commissionFeeRate 
                    ),
                    (
                      -positionSize - minProfit - entryFee - sqrt(
                        (minProfit + entryFee + positionSize)^2 - 4 * positionSize * commissionFeeRate * -positionSize * (entryPrice + swapRate * pipSize / 10)
                      )
                    ) / (
                      2 * positionSize * commissionFeeRate 
                    )
                  )
              */

              const divisor = multiplyBig(
                multiplyBig(2, positionSize),
                commissionFeeRate
              );

              if (
                !mathBigNum.equal(divisor, 0) &&
                !mathBigNum.equal(positionSize, 0)
              ) {
                if (input.isLong) {
                  const sqrtPart = sqrtBig(
                    subtractBig(
                      powBig(
                        subtractBig(addBig(minProfit, entryFee), positionSize),
                        2
                      ),
                      multiplyBig(
                        multiplyBig(
                          multiplyBig(
                            multiplyBig(4, positionSize),
                            commissionFeeRate
                          ),
                          positionSize
                        ),
                        subtractBig(
                          entryPrice,
                          multiplyBig(swapRate, divideBig(input.pipSize, 10))
                        )
                      )
                    )
                  );

                  let profitPrice1 = divideBig(
                    addBig(
                      subtractBig(
                        subtractBig(positionSize, minProfit),
                        entryFee
                      ),
                      sqrtPart
                    ),
                    divisor
                  );
                  profitPrice1 = mathBigNum.ceil(profitPrice1, 5);

                  let profitPrice2 = divideBig(
                    subtractBig(
                      subtractBig(
                        subtractBig(positionSize, minProfit),
                        entryFee
                      ),
                      sqrtPart
                    ),
                    divisor
                  );
                  profitPrice2 = mathBigNum.ceil(profitPrice2, 5);

                  if (mathBigNum.equal(profitPrice1, profitPrice2)) {
                    profitPrice = mathBigNum.larger(profitPrice1, entryPrice)
                      ? profitPrice1
                      : mathBigNum.bignumber(0);
                  } else if (mathBigNum.smaller(profitPrice1, profitPrice2)) {
                    if (mathBigNum.larger(profitPrice1, entryPrice)) {
                      profitPrice = profitPrice1;
                    } else if (mathBigNum.larger(profitPrice2, entryPrice)) {
                      profitPrice = profitPrice2;
                    } else {
                      profitPrice = mathBigNum.bignumber(0);
                    }
                  } else {
                    if (mathBigNum.larger(profitPrice2, entryPrice)) {
                      profitPrice = profitPrice2;
                    } else if (mathBigNum.larger(profitPrice1, entryPrice)) {
                      profitPrice = profitPrice1;
                    } else {
                      profitPrice = mathBigNum.bignumber(0);
                    }
                  }
                } else {
                  // maxPositiveProfitPrice(
                  //   (
                  //     -positionSize - minProfit - entryFee + sqrt(
                  //       (minProfit + entryFee + positionSize)^2 - 4 * positionSize * commissionFeeRate * -positionSize * (entryPrice + swapRate * pipSize / 10)
                  //     )
                  //   ) / (
                  //     2 * positionSize * commissionFeeRate
                  //   ),
                  //   (
                  //     -positionSize - minProfit - entryFee - sqrt(
                  //       (minProfit + entryFee + positionSize)^2 - 4 * positionSize * commissionFeeRate * -positionSize * (entryPrice + swapRate * pipSize / 10)
                  //     )
                  //   ) / (
                  //     2 * positionSize * commissionFeeRate
                  //   )
                  // )

                  const sqrtPart = sqrtBig(
                    subtractBig(
                      powBig(
                        addBig(addBig(minProfit, entryFee), positionSize),
                        2
                      ),
                      multiplyBig(
                        multiplyBig(
                          multiplyBig(
                            multiplyBig(4, positionSize),
                            commissionFeeRate
                          ),
                          positionSize.negated()
                        ),
                        addBig(
                          entryPrice,
                          multiplyBig(swapRate, divideBig(input.pipSize, 10))
                        )
                      )
                    )
                  );

                  let profitPrice1 = divideBig(
                    addBig(
                      subtractBig(
                        subtractBig(positionSize.negated(), minProfit),
                        entryFee
                      ),
                      sqrtPart
                    ),
                    divisor
                  );
                  profitPrice1 = mathBigNum.floor(profitPrice1, 5);

                  let profitPrice2 = divideBig(
                    subtractBig(
                      subtractBig(
                        subtractBig(positionSize.negated(), minProfit),
                        entryFee
                      ),
                      sqrtPart
                    ),
                    divisor
                  );
                  profitPrice2 = mathBigNum.floor(profitPrice2, 5);

                  if (mathBigNum.equal(profitPrice1, profitPrice2)) {
                    profitPrice =
                      mathBigNum.larger(profitPrice1, 0) &&
                      mathBigNum.smaller(profitPrice1, entryPrice)
                        ? profitPrice1
                        : mathBigNum.bignumber(0);
                  } else if (mathBigNum.larger(profitPrice1, profitPrice2)) {
                    if (
                      mathBigNum.larger(profitPrice1, 0) &&
                      mathBigNum.smaller(profitPrice1, entryPrice)
                    ) {
                      profitPrice = profitPrice1;
                    } else if (
                      mathBigNum.larger(profitPrice2, 0) &&
                      mathBigNum.smaller(profitPrice2, entryPrice)
                    ) {
                      profitPrice = profitPrice2;
                    } else {
                      profitPrice = mathBigNum.bignumber(0);
                    }
                  } else {
                    if (
                      mathBigNum.larger(profitPrice2, 0) &&
                      mathBigNum.smaller(profitPrice2, entryPrice)
                    ) {
                      profitPrice = profitPrice2;
                    } else if (
                      mathBigNum.larger(profitPrice1, 0) &&
                      mathBigNum.smaller(profitPrice1, entryPrice)
                    ) {
                      profitPrice = profitPrice1;
                    } else {
                      profitPrice = mathBigNum.bignumber(0);
                    }
                  }
                }

                const getProfitAmountFn = (profitPrice: BigNumber) => {
                  if (entryFee === undefined) {
                    return {
                      profitAmt: mathBigNum.bignumber(0),
                      profitFee: mathBigNum.bignumber(0),
                      swapFee: mathBigNum.bignumber(0),
                    };
                  }

                  const profitBaseRate = profitPrice;
                  const profitQuoteRate = divideBig(1, profitPrice);
                  const profitFee = multiplyBig(
                    multiplyBig(positionSize, commissionFeeRate),
                    profitBaseRate
                  );
                  const swapFee = calcSwapFee(
                    swapRate,
                    input.pipSize,
                    lotSize,
                    contractSize,
                    profitQuoteRate,
                    input.precision
                  );

                  return getProfitAmount(
                    entryPrice,
                    profitPrice,
                    entryFee,
                    profitFee,
                    swapFee,
                    positionSize,
                    profitQuoteRate
                  );
                };

                const adjustedRes = adjustProfitPrice(
                  getProfitAmountFn,
                  minProfit,
                  profitPrice,
                  input.isLong
                );
                profitPrice = adjustedRes.profitPrice;
                profitAmount = adjustedRes.profitAmount;
                profitFee = adjustedRes.profitFee;
                profitSwapFee = adjustedRes.swapFee;
              } else {
                profitPrice = mathBigNum.bignumber(0);
                profitAmount = mathBigNum.bignumber(0);
                profitFee = mathBigNum.bignumber(0);
                profitSwapFee = mathBigNum.bignumber(0);
              }
            }
          }
        }
      } else {
        // no trading fee

        if (profitQuoteRate !== undefined) {
          /*
            minProfit = isLong ? 
              (profitPrice - entryPrice) * positionSize * quoteRate :
              (entryPrice - profitPrice) * positionSize * quoteRate

            profitPrice = isLong ?
              entryPrice + (minProfit / (positionSize * quoteRate)) :
              entryPrice - (minProfit / (positionSize * quoteRate))
          */
          if (
            !mathBigNum.equal(positionSize, 0) &&
            !mathBigNum.equal(profitQuoteRate, 0)
          ) {
            if (input.isLong) {
              profitPrice = addBig(
                entryPrice,
                divideBig(minProfit, multiplyBig(positionSize, profitQuoteRate))
              );
              profitPrice = mathBigNum.ceil(profitPrice, 5);
            } else {
              profitPrice = subtractBig(
                entryPrice,
                divideBig(minProfit, multiplyBig(positionSize, profitQuoteRate))
              );
              profitPrice = mathBigNum.floor(profitPrice, 5);
            }

            // Construct get profit function
            const getProfitAmountFn = (profitPrice: BigNumber) => {
              if (!profitQuoteRate) profitQuoteRate = mathBigNum.bignumber(1);

              // profitAmount = abs(profitPrice - entryPrice) * positionSize * quoteRate
              const profitAmt = multiplyBig(
                multiplyBig(
                  absBig(subtractBig(profitPrice, entryPrice)),
                  positionSize
                ),
                profitQuoteRate
              );

              return {
                profitAmt,
                profitFee: mathBigNum.bignumber(0),
                swapFee: mathBigNum.bignumber(0),
              };
            };

            // Adjust profit price
            const adjustedRes = adjustProfitPrice(
              getProfitAmountFn,
              minProfit,
              profitPrice,
              input.isLong
            );
            profitPrice = adjustedRes.profitPrice;
            profitFee = adjustedRes.profitFee;
            profitSwapFee = adjustedRes.swapFee;
            profitAmount = adjustedRes.profitAmount;
          } else {
            profitPrice = mathBigNum.bignumber(0);
            profitFee = mathBigNum.bignumber(0);
            profitSwapFee = mathBigNum.bignumber(0);
            profitAmount = mathBigNum.bignumber(0);
          }
        } else {
          /*
            minProfit = isLong ? 
              (profitPrice - entryPrice) * positionSize / profitPrice :
              (entryPrice - profitPrice) * positionSize / profitPrice

            profitPrice = isLong ?
              entryPrice * positionSize / (positionSize - minProfit) :
              entryPrice * positionSize / (positionSize + minProfit)
          */

          const divisor = input.isLong
            ? subtractBig(positionSize, minProfit)
            : addBig(positionSize, minProfit);

          if (!mathBigNum.equal(divisor, 0)) {
            if (input.isLong) {
              profitPrice = divideBig(
                multiplyBig(entryPrice, positionSize),
                divisor
              );
              profitPrice = mathBigNum.ceil(profitPrice, 5);
            } else {
              profitPrice = divideBig(
                multiplyBig(entryPrice, positionSize),
                divisor
              );
              profitPrice = mathBigNum.floor(profitPrice, 5);
            }

            // Construct get profit function
            const getProfitAmountFn = (profitPrice: BigNumber) => {
              // profitAmount = abs(profitPrice - entryPrice) * positionSize / profitPrice
              const profitAmt = divideBig(
                multiplyBig(
                  absBig(subtractBig(profitPrice, entryPrice)),
                  positionSize
                ),
                profitPrice
              );

              return {
                profitAmt,
                profitFee: mathBigNum.bignumber(0),
                swapFee: mathBigNum.bignumber(0),
              };
            };

            // Adjust profit price
            const adjustedRes = adjustProfitPrice(
              getProfitAmountFn,
              minProfit,
              profitPrice,
              input.isLong
            );
            profitPrice = adjustedRes.profitPrice;
            profitFee = adjustedRes.profitFee;
            profitSwapFee = adjustedRes.swapFee;
            profitAmount = adjustedRes.profitAmount;
          } else {
            profitPrice = mathBigNum.bignumber(0);
            profitFee = mathBigNum.bignumber(0);
            profitSwapFee = mathBigNum.bignumber(0);
            profitAmount = mathBigNum.bignumber(0);
          }
        }
      }
    }

    if (profitPrice !== undefined && profitAmount !== undefined) {
      const profitPriceDiff = mathBigNum.abs(
        subtractBig(entryPrice, profitPrice)
      );

      // profitPip = profitPriceDiff / pipSize
      profitPip = divideBig(profitPriceDiff, input.pipSize);
      profitPip = mathBigNum.round(profitPip, input.precision);

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
    entryPrice: entryPrice,
    stopPrice: stopLoss,
    stopPip: stopPip,
    profitPrice: profitPrice,
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
    stopSwapFee: stopSwapFee,
    profitSwapFee: profitSwapFee,
  };
};

const calcSwapFee = (
  swapRate: BigNumber,
  pipSize: number,
  lotSize: BigNumber,
  contractSize: BigNumber,
  quoteRate: BigNumber,
  precision: number
) => {
  // swapFee = swapRate * pipSize * lotSize * contractSize * quoteRate / 10
  let swapFee = divideBig(
    multiplyBig(
      multiplyBig(
        multiplyBig(multiplyBig(swapRate, pipSize), lotSize),
        contractSize
      ),
      quoteRate
    ),
    10
  );
  swapFee = mathBigNum.round(swapFee, precision);

  return swapFee;
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
  pipSize: number
) => {
  let lotSize = mathBigNum.bignumber(0);

  /* 
    maxLoss = 
      priceDiff * lotSize * contractSize * quoteRate 
      + lotSize * commissionFee * 2 
      - swapRate * pipSize * lotSize * contractSize * quoteRate / 10
    
    lotSize = maxLoss /
      (
        priceDiff * contractSize * quoteRate
        + commissionFee * 2
        - swapRate * pipSize * contractSize * quoteRate / 10
      )
  */
  const diff = multiplyBig(multiplyBig(priceDiff, contractSize), quoteRate);
  if (mathBigNum.equal(diff, 0)) {
    return lotSize;
  }

  const commissionPart = multiplyBig(commissionFee, 2);
  const swapPart = divideBig(
    multiplyBig(
      multiplyBig(multiplyBig(swapRate, pipSize), contractSize),
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
  entryBaseRate: BigNumber,
  exitBaseRate: BigNumber,
  quoteRate: BigNumber,
  swapRate: BigNumber,
  commissionFeeRate: BigNumber,
  pipSize: number
) => {
  let lotSize = mathBigNum.bignumber(0);

  /*
    maxLoss = 
      priceDiff * lotSize * contractSize * quoteRate
      - swapRate * pipSize * lotSize * contractSize * quoteRate / 10
      + lotSize * contractSize * commissionFeeRate * (entryBaseRate + exitBaseRate)

    lotSize = 
      maxLoss /
      (
        priceDiff * contractSize * quoteRate 
        + contractSize * commissionFeeRate * (entryBaseRate + exitBaseRate)
        - swapRate * pipsize * contractSize * quoteRate / 10
      )
  */

  const diff = multiplyBig(multiplyBig(priceDiff, contractSize), quoteRate);
  if (mathBigNum.equal(diff, 0)) {
    return lotSize;
  }

  const commissionPart = multiplyBig(
    multiplyBig(contractSize, commissionFeeRate),
    addBig(entryBaseRate, exitBaseRate)
  );

  const swapPart = divideBig(
    multiplyBig(
      multiplyBig(multiplyBig(swapRate, pipSize), contractSize),
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
    swapFee: BigNumber;
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
      swapFee: mathBigNum.bignumber(0),
    };
  }

  const res = getRiskAmountFn(lotSize);
  let riskAmount = res.riskAmount;
  let entryFee = res.entryFee;
  let stopFee = res.stopFee;
  let swapFee = res.swapFee;

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
        swapFee = res.swapFee;
        riskAmount = res.riskAmount;
      }
    }
  }

  lotSize = mathBigNum.floor(lotSize, lotTyp);

  return { lotSize, riskAmount, entryFee, stopFee, swapFee };
};

const adjustProfitPrice = (
  getProfitAmountFn: (profitPrice: BigNumber) => {
    profitAmt: BigNumber;
    profitFee: BigNumber;
    swapFee: BigNumber;
  },
  minProfit: BigNumber,
  profitPrice: BigNumber,
  isLong: boolean
) => {
  if (mathBigNum.equal(profitPrice, 0)) {
    return {
      profitAmount: mathBigNum.bignumber(0),
      profitPrice,
      profitFee: mathBigNum.bignumber(0),
      swapFee: mathBigNum.bignumber(0),
    };
  }

  const res = getProfitAmountFn(profitPrice);
  let profitAmount = res.profitAmt;
  let profitFee = res.profitFee;
  let swapFee = res.swapFee;

  const units = [0.1, 0.01, 0.001, 0.0001, 0.00001];
  for (let i = 0; i <= units.length; i++) {
    let isLarger = false;
    let tempProfitPrice = profitPrice;
    let tempProfitAmt = profitAmount;
    let j = 0;

    while (
      !mathBigNum.equal(tempProfitAmt, minProfit) &&
      mathBigNum.larger(tempProfitPrice, 0)
    ) {
      if (j >= 10000) {
        console.warn(
          `Max iterations reached (fn=forex_profit, precision=${units[i]})`
        );
        break;
      }
      j++;

      if (mathBigNum.larger(tempProfitAmt, minProfit)) {
        isLarger = true;
        tempProfitPrice = isLong
          ? subtractBig(tempProfitPrice, units[i])
          : addBig(tempProfitPrice, units[i]);
      } else {
        if (isLarger) break;
        tempProfitPrice = isLong
          ? addBig(tempProfitPrice, units[i])
          : subtractBig(tempProfitPrice, units[i]);
      }

      const res = getProfitAmountFn(tempProfitPrice);
      tempProfitAmt = res.profitAmt;

      if (mathBigNum.largerEq(tempProfitAmt, minProfit)) {
        profitAmount = res.profitAmt;
        profitFee = res.profitFee;
        swapFee = res.swapFee;
      }
    }
  }

  return { profitAmount, profitPrice, profitFee, swapFee };
};

const getProfitAmount = (
  entryPrice: BigNumber,
  profitPrice: BigNumber,
  entryFee: BigNumber,
  profitFee: BigNumber,
  swapFee: BigNumber,
  positionSize: BigNumber,
  quoteRate: BigNumber
) => {
  // profitAmt = abs(profitPrice - entryPrice) * positionSize * quoteRate - entryFee - profitFee - swapFee
  const profitAmt = subtractBig(
    subtractBig(
      subtractBig(
        multiplyBig(
          multiplyBig(
            mathBigNum.abs(subtractBig(profitPrice, entryPrice)),
            positionSize
          ),
          quoteRate
        ),
        entryFee
      ),
      profitFee
    ),
    swapFee
  );

  return { profitAmt, profitFee, swapFee };
};
