// import { FormEvent, useEffect, useRef, useState } from "react";
// import { useSpring, animated } from "@react-spring/web";

// import { calculateResult, validatePositionSizeInput } from "./utils.component";
// import { parseNumberFromString } from "../../../../common/number/number";

// import styles from "../forex_calculator_form.module.scss";
// import Switch from "../../../../component/common/switch/switch.component";
// import Button from "../../../../component/common/button/button.component";
// import Container from "../../../../component/common/container/container.component";
// import NumberInput from "../../../../component/common/input/number_input.component";
// import SelectBox from "../../../../component/common/select_box/select_box.component";
// import Checkbox from "../../../../component/common/checkbox/checkbox.component";

// export enum UnitType {
//   STANDARD_LOT,
//   MINI_LOT,
//   MICRO_LOT,
//   NANO_LOT,
// }

// export enum ProfitGoalTyp {
//   PIP_BASED,
//   PRICE_BASED,
//   PORTFOLIO_BASED,
// }

// export enum StopLossTyp {
//   PIP,
//   PRICE,
//   PERCENT,
// }

// export type ForexPositionSizeInputType = {
//   portfolioCapital: string;
//   maxPortfolioRisk: string;
//   accCurrencyRate: string;
//   openPrice: string;
//   unitType: UnitType;
//   pipPrecision: string;
//   stopLoss: string;
//   stopLossTyp: StopLossTyp;
//   includeProfitGoal: boolean;
//   profitGoalTyp: ProfitGoalTyp;
//   profitGoal: string;
//   profitGoalUnit: "$" | "%";
//   isLong: boolean;
//   includeTradingFee: boolean;
//   estTradingFee: string;
//   minTradingFee: string;
// };

// const DEFAULT_INPUT: ForexPositionSizeInputType = {
//   portfolioCapital: "0",
//   maxPortfolioRisk: "0",
//   accCurrencyRate: "1",
//   openPrice: "0",
//   unitType: UnitType.STANDARD_LOT,
//   pipPrecision: "0.0001",
//   stopLoss: "0",
//   stopLossTyp: StopLossTyp.PIP,
//   includeProfitGoal: false,
//   profitGoal: "0",
//   profitGoalTyp: ProfitGoalTyp.PRICE_BASED,
//   profitGoalUnit: "%",
//   isLong: true,
//   includeTradingFee: false,
//   estTradingFee: "0",
//   minTradingFee: "0",
// };

// export enum ERROR_FIELD_POSITION_SIZE {
//   PORTFOLIO_CAPITAL,
//   MAX_PORTFOLIO_RISK,
//   ACC_CURRENCY_RATE,
//   PIP_PRECISION,
//   STOP_LOSS,
//   PROFIT_TARGET,
//   OPEN_PRICE,
//   EST_TRADING_FEE,
//   MIN_TRADING_FEE,
// }

// export type PositionSizeResultType = {
//   isLong: boolean;
//   includeTradingFee: boolean;
//   includeProfitGoal: boolean;
//   entryPrice: number;
//   stopPrice: number;
//   stopPercent: number;
//   profitPrice?: number;
//   profitPercent?: number;
//   quantity: string;
//   tradingAmount: number;
//   riskAmount: number;
//   portfolioRisk: number;
//   profitAmount?: number;
//   portfolioProfit?: number;
//   riskRewardRatio?: string;
//   breakEvenWinRate?: number;
//   estimatedEntryFee?: number;
//   estimatedStopFee?: number;
//   estimatedProfitFee?: number;
// };

// const ForexPositionSizeForm = () => {
//   const [errorMessage, setErrorMessage] = useState("");
//   const [errorField, setErrorField] =
//     useState<ERROR_FIELD_POSITION_SIZE | null>(null);
//   const [input, setInput] = useState<ForexPositionSizeInputType>(DEFAULT_INPUT);

//   const [result, setResult] = useState<PositionSizeResultType | null>(null);
//   const resultRef = useRef<HTMLDivElement>(null);

//   // Scroll to result after it is updated
//   useEffect(() => {
//     if (result && resultRef.current) {
//       resultRef.current.scrollIntoView({ behavior: "smooth" });
//     }
//   }, [result]);

//   // Form submission handler
//   const handleSubmit = (e: FormEvent) => {
//     e.preventDefault();

//     // Handle validation
//     const { err, field } = validatePositionSizeInput(input);
//     setErrorMessage(err);
//     setErrorField(field);
//     if (err !== "") return;

//     // Handle calculation
//     setResult(calculateResult(input));
//   };

//   const handleReset = (e: FormEvent) => {
//     e.preventDefault();

//     setErrorMessage("");
//     setInput({
//       ...DEFAULT_INPUT,
//       isLong: input.isLong,
//       stopLossTyp: input.stopLossTyp,
//       includeProfitGoal: input.includeProfitGoal,
//       profitGoalTyp: input.profitGoalTyp,
//       profitGoalUnit: input.profitGoalUnit,
//       unitType: input.unitType,
//       includeTradingFee: input.includeTradingFee,
//     });
//     setErrorField(null);
//     setResult(null);
//   };

//   const handleSwitch = (idx: number) => {
//     setInput({ ...input, isLong: idx === 0 });
//   };

//   const profitGoalStyles = useSpring({
//     height: input.includeProfitGoal ? 200 : 0,
//     opacity: input.includeProfitGoal ? 1 : 0,
//     overflow: "hidden",
//   });

//   const tradingFeeStyles = useSpring({
//     height: input.includeTradingFee ? 200 : 0,
//     opacity: input.includeTradingFee ? 1 : 0,
//     overflow: "hidden",
//   });

//   return (
//     <form className={styles["form-wrapper"]} onSubmit={handleSubmit}>
//       <p className={styles["description"]}>
//         This calculator helps you to determine the optimal position size and
//         stop-loss price for your trades. By inputting parameters such as total
//         capital, maximum allowable loss, stop-loss percentage, profit ratio, and
//         trade-in price, the calculator computes position size, stop price, and
//         profit target for you.
//       </p>

//       <div className={styles["switch-wrapper"]}>
//         <Switch
//           height={33}
//           borderRadius={20}
//           childWidth={161}
//           names={["Long", "Short"]}
//           defaultIndex={0}
//           onSwitch={handleSwitch}
//         />
//       </div>

//       <div>
//         <div className={styles["form-group"]}>
//           <label htmlFor="portfolio-capital">Portfolio Capital</label>
//           <NumberInput
//             id="portfolio-capital"
//             preUnit="$"
//             isInvalid={
//               errorField === ERROR_FIELD_POSITION_SIZE.PORTFOLIO_CAPITAL
//             }
//             minDecimalPlace={2}
//             maxDecimalPlace={4}
//             value={input.portfolioCapital}
//             onChangeHandler={(val) =>
//               setInput({ ...input, portfolioCapital: val })
//             }
//           />
//         </div>

//         <div className={styles["form-group"]}>
//           <label htmlFor="max-portfolio-risk">Max Portfolio Risk (%)</label>
//           <NumberInput
//             step="0.1"
//             id="max-portfolio-risk"
//             minDecimalPlace={2}
//             maxDecimalPlace={4}
//             postUnit="%"
//             isInvalid={
//               errorField === ERROR_FIELD_POSITION_SIZE.MAX_PORTFOLIO_RISK
//             }
//             value={input.maxPortfolioRisk}
//             onChangeHandler={(val) =>
//               setInput({ ...input, maxPortfolioRisk: val })
//             }
//           />
//         </div>

//         <div className={styles["form-group"]}>
//           <label htmlFor="acc-convertion-rate">
//             Account Currency Exchange Rate
//           </label>
//           <NumberInput
//             id="acc-convertion-rate"
//             preUnit="$"
//             minDecimalPlace={2}
//             maxDecimalPlace={5}
//             isInvalid={
//               errorField === ERROR_FIELD_POSITION_SIZE.ACC_CURRENCY_RATE
//             }
//             value={input.accCurrencyRate}
//             onChangeHandler={(val) =>
//               setInput({ ...input, accCurrencyRate: val })
//             }
//           />
//         </div>

//         <div className={styles["form-group"]}>
//           <label htmlFor="entry-price">Open Price</label>
//           <NumberInput
//             id="entry-price"
//             preUnit="$"
//             minDecimalPlace={2}
//             maxDecimalPlace={4}
//             isInvalid={errorField === ERROR_FIELD_POSITION_SIZE.OPEN_PRICE}
//             value={input.openPrice}
//             onChangeHandler={(val) => setInput({ ...input, openPrice: val })}
//           />
//         </div>

//         <div className={styles["form-group"]}>
//           <label htmlFor="unit-type">Unit Type</label>
//           <SelectBox
//             name="unit-type"
//             options={["Standard Lot", "Mini Lot", "Micro Lot", "Nano Lot"]}
//             defaultIndex={UnitType.STANDARD_LOT}
//             onChangeHandler={(idx) => setInput({ ...input, unitType: idx })}
//           />
//         </div>

//         <div className={styles["form-group"]}>
//           <label htmlFor="pip-precision">Pip Precision</label>
//           <NumberInput
//             id="pip-precision"
//             preUnit="$"
//             minDecimalPlace={2}
//             maxDecimalPlace={5}
//             isInvalid={errorField === ERROR_FIELD_POSITION_SIZE.PIP_PRECISION}
//             value={input.pipPrecision}
//             onChangeHandler={(val) => setInput({ ...input, pipPrecision: val })}
//           />
//         </div>

//         <div className={styles["form-group"]}>
//           <label htmlFor="stop-loss">Stop Loss</label>
//           <div className={styles["input-with-switch"]}>
//             <NumberInput
//               id="stop-loss"
//               preUnit={input.stopLossTyp === StopLossTyp.PRICE ? "$" : ""}
//               postUnit={
//                 input.stopLossTyp === StopLossTyp.PIP
//                   ? "pip"
//                   : StopLossTyp.PERCENT
//                   ? "%"
//                   : ""
//               }
//               isInvalid={errorField === ERROR_FIELD_POSITION_SIZE.STOP_LOSS}
//               minDecimalPlace={2}
//               maxDecimalPlace={4}
//               value={input.stopLoss}
//               onChangeHandler={(val) => setInput({ ...input, stopLoss: val })}
//             />
//             <Switch
//               height={46}
//               borderRadius={5}
//               names={["PIP", "$", "%"]}
//               defaultIndex={input.stopLossTyp}
//               childWidth={50}
//               onSwitch={(idx: number) => {
//                 setInput({
//                   ...input,
//                   stopLossTyp: idx,
//                   stopLoss:
//                     input.stopLoss === "0"
//                       ? input.stopLoss
//                       : parseNumberFromString(input.stopLoss).toLocaleString(
//                           "en-US",
//                           {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 4,
//                           }
//                         ),
//                 });
//               }}
//             />
//           </div>
//         </div>

//         <div
//           className={styles["form-group"]}
//           style={{
//             marginTop: "2rem",
//             marginBottom: input.includeProfitGoal ? "1.5rem" : "0.6rem",
//           }}
//         >
//           <div className={styles["checkbox-wrapper"]}>
//             <Checkbox
//               isCheck={input.includeProfitGoal}
//               onCheck={() =>
//                 setInput({
//                   ...input,
//                   includeProfitGoal: !input.includeProfitGoal,
//                   profitGoal: DEFAULT_INPUT.profitGoal,
//                   profitGoalTyp: DEFAULT_INPUT.profitGoalTyp,
//                 })
//               }
//             />
//             <span>Include Profit Goal</span>
//           </div>
//         </div>

//         <animated.div style={profitGoalStyles}>
//           {input.includeProfitGoal && (
//             <>
//               <div className={styles["form-group"]}>
//                 <label htmlFor="profit-strategy">Profit Strategy</label>
//                 <SelectBox
//                   name="profit-strategy"
//                   options={["Pip-Based", "Price-Based", "Portfolio-Based"]}
//                   defaultIndex={ProfitGoalTyp.PRICE_BASED}
//                   onChangeHandler={(idx) => {
//                     setInput({ ...input, profitGoalTyp: idx, profitGoal: "0" });
//                     if (
//                       errorField === ERROR_FIELD_POSITION_SIZE.PROFIT_TARGET
//                     ) {
//                       setErrorField(null);
//                       setErrorMessage("");
//                     }
//                   }}
//                 />
//               </div>

//               <div className={styles["form-group"]}>
//                 <label htmlFor="profit-goal">
//                   {input.profitGoalTyp === ProfitGoalTyp.PORTFOLIO_BASED
//                     ? "Min Portfolio Profit (%)"
//                     : "Profit Target"}
//                 </label>
//                 <div className={styles["input-with-switch"]}>
//                   <NumberInput
//                     id="profit-goal"
//                     step={0.1}
//                     preUnit={input.profitGoalUnit === "$" ? "$" : ""}
//                     postUnit={
//                       input.profitGoalTyp === ProfitGoalTyp.PIP_BASED
//                         ? "pip"
//                         : input.profitGoalTyp === ProfitGoalTyp.PRICE_BASED
//                         ? input.profitGoalUnit === "%"
//                           ? "%"
//                           : ""
//                         : "%"
//                     }
//                     isInvalid={
//                       errorField === ERROR_FIELD_POSITION_SIZE.PROFIT_TARGET
//                     }
//                     minDecimalPlace={2}
//                     maxDecimalPlace={4}
//                     value={input.profitGoal}
//                     onChangeHandler={(val) =>
//                       setInput({ ...input, profitGoal: val })
//                     }
//                   />
//                   {input.profitGoalTyp === ProfitGoalTyp.PRICE_BASED && (
//                     <Switch
//                       height={46}
//                       borderRadius={5}
//                       names={["$", "%"]}
//                       defaultIndex={input.profitGoalUnit === "$" ? 0 : 1}
//                       childWidth={50}
//                       onSwitch={(idx: number) => {
//                         setInput({
//                           ...input,
//                           profitGoalUnit: idx === 0 ? "$" : "%",
//                           profitGoal:
//                             input.profitGoal === "0"
//                               ? input.profitGoal
//                               : parseNumberFromString(
//                                   input.profitGoal
//                                 ).toLocaleString("en-US", {
//                                   minimumFractionDigits: 2,
//                                   maximumFractionDigits: 4,
//                                 }),
//                         });
//                       }}
//                     />
//                   )}
//                 </div>
//               </div>
//             </>
//           )}
//         </animated.div>

//         <div
//           className={styles["form-group"]}
//           style={{
//             marginBottom: input.includeTradingFee ? "1.5rem" : "0.6rem",
//           }}
//         >
//           <div className={styles["checkbox-wrapper"]}>
//             <Checkbox
//               isCheck={input.includeTradingFee}
//               onCheck={() =>
//                 setInput({
//                   ...input,
//                   includeTradingFee: !input.includeTradingFee,
//                   estTradingFee: DEFAULT_INPUT.estTradingFee,
//                   minTradingFee: DEFAULT_INPUT.minTradingFee,
//                 })
//               }
//             />
//             <span>Include Trading Fee</span>
//           </div>
//         </div>

//         <animated.div style={tradingFeeStyles}>
//           {input.includeTradingFee && (
//             <>
//               <div className={styles["form-group"]}>
//                 <label htmlFor="trading-fee">
//                   Estimated Trading Fee Per Order
//                 </label>
//                 <NumberInput
//                   id="trading-fee"
//                   postUnit="%"
//                   isInvalid={
//                     errorField === ERROR_FIELD_POSITION_SIZE.EST_TRADING_FEE
//                   }
//                   minDecimalPlace={2}
//                   maxDecimalPlace={4}
//                   value={input.estTradingFee}
//                   onChangeHandler={(val) =>
//                     setInput({ ...input, estTradingFee: val })
//                   }
//                 />
//               </div>

//               <div className={styles["form-group"]}>
//                 <label htmlFor="min-trading-fee">
//                   Minimum Trading Fee Per Order
//                 </label>
//                 <NumberInput
//                   id="min-trading-fee"
//                   preUnit="$"
//                   isInvalid={
//                     errorField === ERROR_FIELD_POSITION_SIZE.MIN_TRADING_FEE
//                   }
//                   minDecimalPlace={2}
//                   maxDecimalPlace={4}
//                   value={input.minTradingFee}
//                   onChangeHandler={(val) =>
//                     setInput({ ...input, minTradingFee: val })
//                   }
//                 />
//               </div>
//             </>
//           )}
//         </animated.div>

//         <p className={styles["error"]}>{errorMessage}</p>
//       </div>

//       <div className={styles["form-btn"]}>
//         <Button
//           className={styles["reset-btn"]}
//           type="reset"
//           tabIndex={-1}
//           onClick={handleReset}
//         >
//           Reset
//         </Button>
//         <Button className={styles["submit-btn"]} type="submit">
//           Calculate
//         </Button>
//       </div>

//       <div ref={resultRef}>
//         {result && (
//           <Container
//             className={`${styles["result-container"]} ${styles["position-size"]}`}
//           >
//             <div className={styles["result-wrapper"]}>
//               <div className={styles["row"]}>
//                 <div>Open Price:</div>
//                 <div>
//                   $
//                   {result.entryPrice.toLocaleString("en-US", {
//                     minimumFractionDigits: 2,
//                     maximumFractionDigits: 4,
//                   })}
//                 </div>
//               </div>

//               <div className={styles["row"]}>
//                 <div>Stop Price:</div>
//                 <div>
//                   $
//                   {result.stopPrice.toLocaleString("en-US", {
//                     minimumFractionDigits: 2,
//                     maximumFractionDigits: 4,
//                   })}
//                 </div>
//               </div>

//               <div className={styles["row"]}>
//                 <div>Stop Loss (%):</div>
//                 <div>
//                   {result.stopPercent.toLocaleString("en-US", {
//                     minimumFractionDigits: 2,
//                     maximumFractionDigits: 4,
//                   })}
//                   %
//                 </div>
//               </div>

//               {result.profitPrice !== undefined && (
//                 <>
//                   <div className={styles["row"]}>
//                     <div>Profit Price:</div>
//                     <div>
//                       $
//                       {result.profitPrice.toLocaleString("en-US", {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 4,
//                       })}
//                     </div>
//                   </div>

//                   <div className={styles["row"]}>
//                     <div>Profit (%):</div>
//                     <div>
//                       {result.profitPercent?.toLocaleString("en-US", {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 4,
//                       })}
//                       %
//                     </div>
//                   </div>
//                 </>
//               )}

//               <div className={styles["row"]}>
//                 <div>Quantity:</div>
//                 <div>{result.quantity}</div>
//               </div>

//               <br />

//               <div className={styles["row"]}>
//                 <div>Entry Amount:</div>
//                 <div>
//                   $
//                   {result.tradingAmount.toLocaleString("en-US", {
//                     minimumFractionDigits: 2,
//                     maximumFractionDigits: 4,
//                   })}
//                 </div>
//               </div>

//               <div className={styles["row"]}>
//                 <div>Risk Amount:</div>
//                 <div>
//                   $
//                   {result.riskAmount.toLocaleString("en-US", {
//                     minimumFractionDigits: 2,
//                     maximumFractionDigits: 4,
//                   })}
//                 </div>
//               </div>

//               <div className={styles["row"]}>
//                 <div>Portfolio Risk (%):</div>
//                 <div>
//                   {result.portfolioRisk.toLocaleString("en-US", {
//                     minimumFractionDigits: 2,
//                     maximumFractionDigits: 4,
//                   })}
//                   %
//                 </div>
//               </div>

//               {result.profitAmount !== undefined && (
//                 <div className={styles["row"]}>
//                   <div>Potential Profit:</div>
//                   <div>
//                     $
//                     {result.profitAmount.toLocaleString("en-US", {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 4,
//                     })}
//                   </div>
//                 </div>
//               )}

//               {result.portfolioProfit !== undefined && (
//                 <div className={styles["row"]}>
//                   <div>Potential Portfolio Return (%):</div>
//                   <div>
//                     {result.portfolioProfit.toLocaleString("en-US", {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 4,
//                     })}
//                     %
//                   </div>
//                 </div>
//               )}

//               {result.estimatedEntryFee !== undefined && (
//                 <div className={styles["row"]}>
//                   <div>Opening Fee:</div>
//                   <div>
//                     $
//                     {result.estimatedEntryFee.toLocaleString("en-US", {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 4,
//                     })}
//                   </div>
//                 </div>
//               )}

//               {result.estimatedStopFee !== undefined && (
//                 <div className={styles["row"]}>
//                   <div>Stop Loss Execution Fee:</div>
//                   <div>
//                     $
//                     {result.estimatedStopFee.toLocaleString("en-US", {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 4,
//                     })}
//                   </div>
//                 </div>
//               )}

//               {result.estimatedProfitFee !== undefined && (
//                 <div className={styles["row"]}>
//                   <div>Profit-Taking Fee:</div>
//                   <div>
//                     $
//                     {result.estimatedProfitFee.toLocaleString("en-US", {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 4,
//                     })}
//                   </div>
//                 </div>
//               )}

//               {result.riskRewardRatio && (
//                 <>
//                   <br />
//                   <div className={styles["row"]}>
//                     <div>Risk/Reward Ratio:</div>
//                     <div>{result.riskRewardRatio}</div>
//                   </div>
//                 </>
//               )}

//               {result.breakEvenWinRate && (
//                 <div className={styles["row"]}>
//                   <div>Breakeven Win Rate:</div>
//                   <div>
//                     {result.breakEvenWinRate.toLocaleString("en-US", {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 4,
//                     })}
//                     %
//                   </div>
//                 </div>
//               )}
//             </div>
//           </Container>
//         )}
//       </div>
//     </form>
//   );
// };

const ForexPositionSizeForm = () => {
  return <div>Position size</div>;
};

export default ForexPositionSizeForm;
