import { checkMinMax } from "../../common/validation/calculator.validation";
import {
  ERROR_FIELD_TOTO,
  TOTO_RANGE,
  TotoInputType,
  TotoResultType,
} from "./toto.type";

const getRangeInfo = (rangeTyp: TOTO_RANGE) => {
  switch (rangeTyp) {
    case TOTO_RANGE.FOURTY_NINE:
      return { min: 1, max: 10, odd: 5, even: 5, count: 10, low: 5 };
    // return { min: 1, max: 49, odd: 25, even: 24, count: 49, low: 24 };
    case TOTO_RANGE.FIFTY:
      return { min: 1, max: 50, odd: 25, even: 25, count: 50, low: 25 };
    case TOTO_RANGE.FIFTY_FIVE:
      return { min: 1, max: 55, odd: 28, even: 27, count: 55, low: 27 };
    case TOTO_RANGE.FIFTY_EIGHT:
      return { min: 1, max: 58, odd: 29, even: 29, count: 58, low: 29 };
    case TOTO_RANGE.SIXTY_NINE:
      return { min: 1, max: 69, odd: 35, even: 34, count: 69, low: 34 };
  }
};

export const validateTotoInput = (
  input: TotoInputType
): { err: string; field: ERROR_FIELD_TOTO | null } => {
  // validate count field
  if (!checkMinMax(input.count, { min: 1, max: 100 })) {
    return {
      err: "You can generate between 1 and 100 combinations only.",
      field: ERROR_FIELD_TOTO.COUNT,
    };
  }

  const rangeInfo = getRangeInfo(input.numberRange);
  let avaiPoolSize = rangeInfo.count;

  // validate must includes field
  let mustIncludesOddCount = 0;
  let mustIncludesEvenCount = 0;
  let mustIncludesLowCount = 0;
  let mustIncludesHighCount = 0;
  let avaiOddCount = rangeInfo.odd;
  let avaiEvenCount = rangeInfo.even;
  let avaiLowCount = rangeInfo.low - rangeInfo.min + 1;
  let avaiHighCount = rangeInfo.count - rangeInfo.low;
  const mustIncludes = new Set<number>();
  const mustIncludeParts = input.mustIncludes.split(",");
  for (const val of mustIncludeParts) {
    if (val === "") {
      continue;
    }

    const n = Number(val);
    if (isNaN(n) || n < rangeInfo.min || n > rangeInfo.max) {
      return {
        err: `Please enter values between ${rangeInfo.min} and ${rangeInfo.max}.`,
        field: ERROR_FIELD_TOTO.MUST_INCLUDES,
      };
    }

    if (!mustIncludes.has(n)) {
      mustIncludes.add(n);

      if (n % 2 !== 0) {
        mustIncludesOddCount++;
        avaiOddCount--;
      } else {
        mustIncludesEvenCount++;
        avaiEvenCount--;
      }

      if (n <= rangeInfo.low) {
        mustIncludesLowCount++;
        avaiLowCount--;
      } else {
        mustIncludesHighCount++;
        avaiHighCount--;
      }
    }
  }
  if (mustIncludes.size > input.system) {
    return {
      err: `You can only include up to ${input.system} numbers.`,
      field: ERROR_FIELD_TOTO.MUST_INCLUDES,
    };
  }
  avaiPoolSize = avaiPoolSize - mustIncludes.size;

  // validate must excludes field
  const mustExcludes = new Set<number>();
  const mustExcludeParts = input.mustExcludes.split(",");
  for (const val of mustExcludeParts) {
    if (val === "") {
      continue;
    }

    const n = Number(val);
    if (isNaN(n) || n < rangeInfo.min || n > rangeInfo.max) {
      return {
        err: `Each number must be between ${rangeInfo.min} and ${rangeInfo.max}.`,
        field: ERROR_FIELD_TOTO.MUST_EXCLUDES,
      };
    }
    if (mustIncludes.has(n)) {
      return {
        err: `Number ${n} cannot be in both include and exclude lists.`,
        field: ERROR_FIELD_TOTO.MUST_EXCLUDES,
      };
    }

    if (!mustExcludes.has(n)) {
      mustExcludes.add(n);

      if (n % 2 !== 0) {
        avaiOddCount--;
      } else {
        avaiEvenCount--;
      }

      if (n <= rangeInfo.low) {
        avaiLowCount--;
      } else {
        avaiHighCount--;
      }
    }
  }
  const maxExclude = rangeInfo.count - input.system;
  if (mustExcludes.size > maxExclude) {
    return {
      err: `You can only exclude up to ${maxExclude} numbers.`,
      field: ERROR_FIELD_TOTO.MUST_EXCLUDES,
    };
  }
  avaiPoolSize = avaiPoolSize - mustExcludes.size;

  // validate conditional group
  let conditionalPoolLowCount = 0;
  let conditionalPoolHighCount = 0;
  const conditionalGroups = new Set<number>();
  const conditionalPoolOdd = new Set<number>();
  const conditionalPoolEven = new Set<number>();
  const conditionalGroupParts = input.conditionalGroups.split(",");
  for (const val of conditionalGroupParts) {
    if (val === "") continue;

    const n = Number(val);
    if (isNaN(n) || n < rangeInfo.min || n > rangeInfo.max) {
      return {
        err: `Please enter values between ${rangeInfo.min} and ${rangeInfo.max}.`,
        field: ERROR_FIELD_TOTO.CONDITIONAL_GROUPS,
      };
    }

    if (mustIncludes.has(n) || mustExcludes.has(n)) {
      return {
        err: `Number ${n} in the conditional group cannot be in either the include or exclude list.`,
        field: ERROR_FIELD_TOTO.CONDITIONAL_GROUPS,
      };
    }

    if (!conditionalGroups.has(n)) {
      conditionalGroups.add(n);

      if (n % 2 !== 0) {
        conditionalPoolOdd.add(n);
      } else {
        conditionalPoolEven.add(n);
      }

      if (n <= rangeInfo.low) {
        conditionalPoolLowCount++;
      } else {
        conditionalPoolHighCount++;
      }
    }
  }

  // validate conditional count
  const conditionalCount = Number(input.conditionalCount);
  if (isNaN(conditionalCount) || conditionalCount < 0) {
    return {
      err: `Please enter a valid minimum count.`,
      field: ERROR_FIELD_TOTO.CONDITIONAL_COUNT,
    };
  }
  if (conditionalCount > conditionalGroups.size) {
    return {
      err: `The minimum count cannot exceed the number of selected group numbers.`,
      field: ERROR_FIELD_TOTO.CONDITIONAL_COUNT,
    };
  }
  if (
    conditionalCount > input.system - mustIncludes.size ||
    conditionalCount > avaiPoolSize
  ) {
    return {
      err: `The minimum count cannot exceed the remaining available numbers or your system size limit.`,
      field: ERROR_FIELD_TOTO.CONDITIONAL_COUNT,
    };
  }

  // validate odd/even
  let forcedOddLowCount = 0;
  let forcedOddHighCount = 0;
  let forcedEvenLowCount = 0;
  let forcedEvenHighCount = 0;
  if (input.oddEven !== "") {
    const oddEvenParts = input.oddEven.split("/");
    if (oddEvenParts.length !== 2) {
      return {
        err: `Please enter a valid odd/even value`,
        field: ERROR_FIELD_TOTO.ODD_EVEN,
      };
    }
    const odd = Number(oddEvenParts[0]);
    const even = Number(oddEvenParts[1]);
    if (isNaN(odd) || isNaN(even) || odd + even !== input.system) {
      return {
        err: "Please enter a valid odd/even distribution format that equal your system size.",
        field: ERROR_FIELD_TOTO.ODD_EVEN,
      };
    }
    if (odd < mustIncludesOddCount || even < mustIncludesEvenCount) {
      return {
        err: "Your odd/even setting conflicts with the numbers you've included.",
        field: ERROR_FIELD_TOTO.ODD_EVEN,
      };
    }

    const remainingOddCount = odd - mustIncludesOddCount;
    const remainingEvenCount = even - mustIncludesEvenCount;
    if (
      remainingOddCount > avaiOddCount ||
      remainingEvenCount > avaiEvenCount
    ) {
      return {
        err: "Your odd/even setting cannot be satisfied after applying your include, exclude, and conditional group settings.",
        field: ERROR_FIELD_TOTO.ODD_EVEN,
      };
    }

    if (conditionalCount > 0) {
      // if minimum odd/even count exists in conditional group
      const forcedOddCount = Math.max(
        0,
        conditionalCount - conditionalPoolEven.size
      );
      const forcedEvenCount = Math.max(
        0,
        conditionalCount - conditionalPoolOdd.size
      );
      if (
        remainingOddCount < forcedOddCount ||
        remainingEvenCount < forcedEvenCount
      ) {
        return {
          err: "Your odd/even setting cannot be satisfied after applying your include, exclude, and conditional group settings.",
          field: ERROR_FIELD_TOTO.ODD_EVEN,
        };
      }

      if (forcedOddCount > 0) {
        for (const oddNum of conditionalPoolOdd) {
          if (oddNum <= rangeInfo.low) {
            forcedOddLowCount++;
          } else {
            forcedOddHighCount++;
          }
        }
      }

      if (forcedEvenCount > 0) {
        for (const evenNum of conditionalPoolEven) {
          if (evenNum <= rangeInfo.low) {
            forcedEvenLowCount++;
          } else {
            forcedEvenHighCount++;
          }
        }
      }
    }
  }

  // validate low/high
  if (input.lowHigh !== "") {
    const lowHighParts = input.lowHigh.split("/");
    if (lowHighParts.length !== 2) {
      return {
        err: `Please enter a valid low/high value`,
        field: ERROR_FIELD_TOTO.LOW_HIGH,
      };
    }
    const low = Number(lowHighParts[0]);
    const high = Number(lowHighParts[1]);
    if (isNaN(low) || isNaN(high) || low + high !== input.system) {
      return {
        err: "Please enter a valid low/high distribution format that equal your system size.",
        field: ERROR_FIELD_TOTO.LOW_HIGH,
      };
    }
    if (low < mustIncludesLowCount || high < mustIncludesHighCount) {
      return {
        err: "Your low/high setting conflicts with the numbers you've included.",
        field: ERROR_FIELD_TOTO.LOW_HIGH,
      };
    }

    const remainingLowCount = low - mustIncludesLowCount;
    const remainingHighCount = high - mustIncludesHighCount;
    if (
      remainingLowCount > avaiLowCount ||
      remainingHighCount > avaiHighCount
    ) {
      return {
        err: "Your low/high setting cannot be satisfied after applying your include, exclude, and conditional group settings.",
        field: ERROR_FIELD_TOTO.LOW_HIGH,
      };
    }

    if (conditionalCount > 0) {
      // if minimum low/high count exists in conditional group
      const forcedLowCount = Math.max(
        0,
        conditionalCount - conditionalPoolHighCount
      );
      const forcedHighCount = Math.max(
        0,
        conditionalCount - conditionalPoolLowCount
      );
      if (
        remainingLowCount < forcedLowCount ||
        remainingHighCount < forcedHighCount
      ) {
        return {
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, and conditional group settings.",
          field: ERROR_FIELD_TOTO.LOW_HIGH,
        };
      }

      if (
        forcedOddLowCount > remainingLowCount ||
        forcedEvenLowCount > remainingLowCount ||
        forcedOddHighCount > remainingHighCount ||
        forcedEvenHighCount > remainingHighCount
      ) {
        return {
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, and conditional group settings.",
          field: ERROR_FIELD_TOTO.LOW_HIGH,
        };
      }
    }
  }

  return { err: "", field: null };
};

export const generateCombinations = (input: TotoInputType): TotoResultType => {
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
