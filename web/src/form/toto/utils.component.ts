import { ERROR_FIELD_TOTO, TotoInputType, TotoResultType } from "./toto.type";

export const validateTotoInput = (
  input: TotoInputType
): { err: string; field: ERROR_FIELD_TOTO | null } => {
  //   // if (!checkMinMax(input.price, { min: 0, maxOrEqual: QUADRILLION })) {
  //   //   return {
  //   //     err: "Please enter a valid price.",
  //   //     field: ERROR_FIELD_PRICE_PERCENTAGE.PRICE,
  //   //   };
  //   // }

  //   // if (
  //   //   !checkMinMax(input.percentage, {
  //   //     minOrEqual: QUADRILLION.negated(),
  //   //     maxOrEqual: QUADRILLION,
  //   //   })
  //   // ) {
  //   //   return {
  //   //     err: "Please enter a valid percentage.",
  //   //     field: ERROR_FIELD_PRICE_PERCENTAGE.PERCENTAGE,
  //   //   };
  //   // }

  return { err: "", field: null };
};

export const calculateResult = (input: TotoInputType): TotoResultType => {
  console.log(input);

  return {
    combinations: [],
  };
};

// const calculateResult = (input: TotoInputType) => {
//   // Build initial pool
//   const allNumbers = Array.from({ length: input.numberRange }, (_, i) => i + 1);
//   const available = allNumbers.filter(
//     (n) => !input.mustExcludes.includes(n) && !input.mustIncludes.includes(n)
//   );

//   // Add must-includes first
//   const result = new Set<number>();
//   input.mustIncludes.forEach((n) => result.add(n));

//   // Conditional groups
//   const validNums = input.conditionalGroups.filter(
//     (n) => !input.mustIncludes.includes(n)
//   );
//   const shuffled = [...validNums].sort(() => Math.random() - 0.5);
//   shuffled
//     .slice(0, input.minConditionalGroupCount)
//     .forEach((n) => result.add(n));

//   // Fill remaining numbers randomly
//   const remaining = available.filter((n) => !result.has(n));
//   while (result.size < input.system && remaining.length > 0) {
//     const idx = Math.floor(Math.random() * remaining.length);
//     result.add(remaining[idx]);
//     remaining.splice(idx, 1);
//   }

//   let finalResult = Array.from(result);

//   // Apply odd/even rule
//   if (input.includeOddEven) {
//     const countOdd = finalResult.filter((n) => n % 2 !== 0).length;
//     const countEven = finalResult.length - countOdd;

//     if (countOdd !== input.oddCount) {
//       const needMoreOdd = countOdd < input.oddCount;
//       const pool = allNumbers.filter(
//         (n) =>
//           !input.mustExcludes.includes(n) &&
//           !finalResult.includes(n) &&
//           (needMoreOdd ? n % 2 !== 0 : n % 2 === 0)
//       );

//       // Define protected numbers to never replace
//       const protectedNums = new Set([
//         ...input.mustIncludes,
//         ...input.conditionalGroups.flatMap((g) => g.),
//       ]);

//       while (
//         (needMoreOdd
//           ? countOdd < input.oddCount
//           : countEven < input.evenCount) &&
//         pool.length > 0
//       ) {
//         const idx = Math.floor(Math.random() * pool.length);
//         const replacement = pool[idx];

//         // replace one opposite parity number
//         const replaceIdx = finalResult.findIndex((n) =>
//           needMoreOdd ? n % 2 === 0 : n % 2 !== 0
//         );
//         if (replaceIdx >= 0) {
//           finalResult[replaceIdx] = replacement;
//         }

//         if (needMoreOdd) {
//           pool.splice(idx, 1);
//         }
//       }
//     }
//   }

//   // ---- Apply big/small rule ----
//   if (bigSmallRule !== "none") {
//     const mid = numberRange / 2;
//     const countBig = finalResult.filter((n) => n > mid).length;
//     const countSmall = finalResult.length - countBig;

//     let targetBig: number;
//     let targetSmall: number;

//     if (bigSmallRule === "balanced") {
//       targetBig = Math.floor(outNum / 2);
//       targetSmall = outNum - targetBig;
//     } else {
//       targetBig = bigSmallRule.big;
//       targetSmall = bigSmallRule.small;
//     }

//     if (countBig !== targetBig) {
//       const needMoreBig = countBig < targetBig;
//       const pool = allNumbers.filter(
//         (n) =>
//           !mustExcludes.includes(n) &&
//           !finalResult.includes(n) &&
//           (needMoreBig ? n > mid : n <= mid)
//       );

//       while (
//         (needMoreBig ? countBig < targetBig : countSmall < targetSmall) &&
//         pool.length > 0
//       ) {
//         const idx = Math.floor(Math.random() * pool.length);
//         const replacement = pool[idx];
//         const replaceIdx = finalResult.findIndex((n) =>
//           needMoreBig ? n <= mid : n > mid
//         );
//         if (replaceIdx >= 0) {
//           finalResult[replaceIdx] = replacement;
//         }
//         pool.splice(idx, 1);
//       }
//     }
//   }

//   // ---- Sort final output ----
//   finalResult.sort((a, b) => a - b);

//   console.log("Generated numbers:", finalResult);
//   return finalResult;
// };

// calculateResult({
//   system: 6,
//   numberRange: 49,
//   mustIncludes: [3],
//   mustExcludes: [1],
//   conditionalGroups: [10, 20, 30, 40],
//   minConditionalGroupCount: 1,
//   includeOddEven: false,
//   oddCount: 0,
//   evenCount: 0,
//   includeLowHigh: false,
//   lowCount: 0,
//   highCount: 0,
// });
