import { ERROR_FIELD_TOTO, RangeValue, TotoPools } from "../toto.type";
import { validateRangeCountInput } from "./validation";

type LowHighInput = {
  includeLowHigh: boolean;
  low: string;
  high: string;
  system: number;
};

export const validateLowHigh = (
  input: LowHighInput,
  remainingCount: number,
  remainingPools: TotoPools,
  mustIncludePools: TotoPools,
  customPools: TotoPools,
  customCount: RangeValue,
  odd: RangeValue,
  even: RangeValue,
  remainingOddCount: number,
  remainingEvenCount: number
): {
  low: RangeValue;
  high: RangeValue;
  remainingLowCount: number;
  remainingHighCount: number;
  err: string;
  field: ERROR_FIELD_TOTO;
} => {
  let low: RangeValue = { min: 0, max: input.system };
  let high: RangeValue = { min: 0, max: input.system };
  let remainingLowCount = 0;
  let remainingHighCount = 0;
  if (input.includeLowHigh) {
    // validate low number count field
    const lowRes = validateRangeCountInput(input.low, input.system);
    if (lowRes.err !== "") {
      return {
        low,
        high,
        remainingLowCount,
        remainingHighCount,
        err: lowRes.err,
        field: ERROR_FIELD_TOTO.LOW,
      };
    }
    low = lowRes.count;

    // validate high number count field
    const highRes = validateRangeCountInput(input.high, input.system);
    if (highRes.err !== "") {
      return {
        low,
        high,
        remainingLowCount,
        remainingHighCount,
        err: highRes.err,
        field: ERROR_FIELD_TOTO.HIGH,
      };
    }
    high = highRes.count;

    // validate low/high distribution
    if (
      low.min + high.min > input.system ||
      low.max + high.max < input.system
    ) {
      return {
        low,
        high,
        remainingLowCount,
        remainingHighCount,
        err: "Please enter a valid low/high distribution that matches your system size.",
        field: ERROR_FIELD_TOTO.LOW,
      };
    }

    // adjust low/high distribution
    const isMinLowUpdated = input.system - high.max > low.min;
    if (isMinLowUpdated) low.min = input.system - high.max;

    const isMaxLowUpdated = input.system - high.min < low.max;
    if (isMaxLowUpdated) low.max = input.system - high.min;

    const isMinHighUpdated = input.system - low.max > high.min;
    if (isMinHighUpdated) high.min = input.system - low.max;

    const isMaxHighUpdated = input.system - low.min < high.max;
    if (isMaxHighUpdated) high.max = input.system - low.min;

    // Ensure low numbers is enough for must include list
    if (low.max < mustIncludePools.allPools.lowPools.size) {
      return {
        low,
        high,
        remainingLowCount,
        remainingHighCount,
        err: "Your low/high setting conflicts with the numbers you've included.",
        field:
          input.low !== "" && !isMaxLowUpdated
            ? ERROR_FIELD_TOTO.LOW
            : ERROR_FIELD_TOTO.HIGH,
      };
    }

    // Ensure high numbers is enough for must include list
    if (high.max < mustIncludePools.allPools.highPools.size) {
      return {
        low,
        high,
        remainingLowCount,
        remainingHighCount,
        err: "Your low/high setting conflicts with the numbers you've included.",
        field:
          input.high !== "" && !isMaxHighUpdated
            ? ERROR_FIELD_TOTO.HIGH
            : ERROR_FIELD_TOTO.LOW,
      };
    }

    // compute remaining low/high number required
    remainingLowCount = Math.max(
      0,
      low.min - mustIncludePools.allPools.lowPools.size
    );
    remainingHighCount = Math.max(
      0,
      high.min - mustIncludePools.allPools.highPools.size
    );

    // Ensure remaining pool is enough for the required low number count
    if (remainingLowCount > remainingPools.allPools.lowPools.size) {
      return {
        low,
        high,
        remainingLowCount,
        remainingHighCount,
        err: "Your low/high setting cannot be satisfied after applying your include and exclude settings.",
        field:
          input.low !== "" && !isMinLowUpdated
            ? ERROR_FIELD_TOTO.LOW
            : ERROR_FIELD_TOTO.HIGH,
      };
    }

    // Ensure remaining pool is enough for the required high number count
    if (remainingHighCount > remainingPools.allPools.highPools.size) {
      return {
        low,
        high,
        remainingLowCount,
        remainingHighCount,
        err: "Your low/high setting cannot be satisfied after applying your include and exclude settings.",
        field:
          input.high !== "" && !isMinHighUpdated
            ? ERROR_FIELD_TOTO.HIGH
            : ERROR_FIELD_TOTO.LOW,
      };
    }

    // compute remaining odd/even + low number required
    const remainingOddLowCount =
      remainingLowCount + remainingOddCount - remainingCount;
    const remainingEvenLowCount =
      remainingLowCount + remainingEvenCount - remainingCount;

    // compute remaining odd/even + high number required
    const remainingOddHighCount =
      remainingHighCount + remainingOddCount - remainingCount;
    const remainingEvenHighCount =
      remainingHighCount + remainingEvenCount - remainingCount;

    // Ensure remaining pool is enough for the required odd/even + low number
    if (
      remainingOddLowCount > remainingPools.allPools.oddLowPools.size ||
      remainingEvenLowCount > remainingPools.allPools.evenLowPools.size
    ) {
      return {
        low,
        high,
        remainingLowCount,
        remainingHighCount,
        err: "Your low/high setting cannot be satisfied after applying your include, exclude, and odd/even settings.",
        field:
          input.low !== "" && !isMinLowUpdated
            ? ERROR_FIELD_TOTO.LOW
            : ERROR_FIELD_TOTO.HIGH,
      };
    }

    // Ensure remaining pool is enough for the required odd/even + high number
    if (
      remainingOddHighCount > remainingPools.allPools.oddHighPools.size ||
      remainingEvenHighCount > remainingPools.allPools.evenHighPools.size
    ) {
      return {
        low,
        high,
        remainingLowCount,
        remainingHighCount,
        err: "Your low/high setting cannot be satisfied after applying your include, exclude, and odd/even settings.",
        field:
          input.high !== "" && !isMinHighUpdated
            ? ERROR_FIELD_TOTO.HIGH
            : ERROR_FIELD_TOTO.LOW,
      };
    }

    // Handle low/high + custom group settings
    if (customPools.allPools.allPools.size > 0) {
      // Ensure there are enough available low numbers left (after applying include, exclude, custom group, and odd/even filters) to satisfy the remaining low requirement.
      if (
        remainingLowCount >
        remainingPools.allPools.lowPools.size -
          customPools.allPools.lowPools.size +
          Math.min(customCount.max, customPools.allPools.lowPools.size)
      ) {
        return {
          low,
          high,
          remainingLowCount,
          remainingHighCount,
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, and custom group settings.",
          field:
            input.low !== "" && !isMinLowUpdated
              ? ERROR_FIELD_TOTO.LOW
              : ERROR_FIELD_TOTO.HIGH,
        };
      }

      // Ensure there are enough available high numbers left (after applying include, exclude, custom group, and odd/even filters) to satisfy the remaining high requirement.
      if (
        remainingHighCount >
        remainingPools.allPools.highPools.size -
          customPools.allPools.highPools.size +
          Math.min(customCount.max, customPools.allPools.highPools.size)
      ) {
        return {
          low,
          high,
          remainingLowCount,
          remainingHighCount,
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, and custom group settings.",
          field:
            input.high !== "" && !isMinHighUpdated
              ? ERROR_FIELD_TOTO.HIGH
              : ERROR_FIELD_TOTO.LOW,
        };
      }

      // Ensure there are enough available low numbers left (after applying include, exclude, custom group, and odd/even filters) to satisfy the remaining low requirement.
      if (
        remainingOddLowCount >
          remainingPools.allPools.oddLowPools.size -
            customPools.allPools.oddLowPools.size +
            Math.min(customCount.max, customPools.allPools.oddLowPools.size) ||
        remainingEvenLowCount >
          remainingPools.allPools.evenLowPools.size -
            customPools.allPools.evenLowPools.size +
            Math.min(customCount.max, customPools.allPools.evenLowPools.size)
      ) {
        return {
          low,
          high,
          remainingLowCount,
          remainingHighCount,
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, custom group, and odd/even settings.",
          field:
            input.low !== "" && !isMinLowUpdated
              ? ERROR_FIELD_TOTO.LOW
              : ERROR_FIELD_TOTO.HIGH,
        };
      }

      // Ensure there are enough available low numbers left (after applying include, exclude, custom group, and odd/even filters) to satisfy the remaining low requirement.
      if (
        minOddHighCount >
          pools.allPools.oddHighPools.size -
            customPool.allPools.oddHighPools.size +
            Math.min(maxCustomCount, customPool.allPools.oddHighPools.size) ||
        minEvenHighCount >
          pools.allPools.evenHighPools.size -
            customPool.allPools.evenHighPools.size +
            Math.min(maxCustomCount, customPool.allPools.evenHighPools.size)
      ) {
        return {
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, custom group, and odd/even settings.",
          field:
            input.high !== "" && !isMinHighUpdated
              ? ERROR_FIELD_TOTO.HIGH
              : ERROR_FIELD_TOTO.LOW,
        };
      }

      const minCustomLowCount = Math.max(
        0,
        minCustomCount - customPool.allPools.highPools.size
      );
      if (
        low.max - mustIncludePool.allPools.lowPools.size <
        minCustomLowCount
      ) {
        return {
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, and custom group settings.",
          field:
            input.low !== "" && !isMaxLowUpdated
              ? ERROR_FIELD_TOTO.LOW
              : ERROR_FIELD_TOTO.HIGH,
        };
      }

      const minCustomHighCount = Math.max(
        0,
        minCustomCount - customPool.allPools.lowPools.size
      );
      if (
        high.max - mustIncludePool.allPools.highPools.size <
        minCustomHighCount
      ) {
        return {
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, and custom group settings.",
          field:
            input.high !== "" && !isMaxHighUpdated
              ? ERROR_FIELD_TOTO.HIGH
              : ERROR_FIELD_TOTO.LOW,
        };
      }

      const skipCount = requiredCount - minCustomCount;
      const minCustomOddLowCount = Math.max(0, minOddLowCount - skipCount);
      const minCustomEvenLowCount = Math.max(0, minEvenLowCount - skipCount);
      if (
        minCustomOddLowCount > customPool.allPools.oddLowPools.size ||
        minCustomEvenLowCount > customPool.allPools.evenLowPools.size
      ) {
        return {
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, custom group, and odd/even settings.",
          field:
            input.low !== "" && !isMinLowUpdated
              ? ERROR_FIELD_TOTO.LOW
              : ERROR_FIELD_TOTO.HIGH,
        };
      }

      const minCustomOddHighCount = Math.max(0, minOddHighCount - skipCount);
      const minCustomEvenHighCount = Math.max(0, minEvenHighCount - skipCount);
      if (
        minCustomOddHighCount > customPool.allPools.oddHighPools.size ||
        minCustomEvenHighCount > customPool.allPools.evenHighPools.size
      ) {
        return {
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, custom group, and odd/even settings.",
          field:
            input.high !== "" && !isMinHighUpdated
              ? ERROR_FIELD_TOTO.HIGH
              : ERROR_FIELD_TOTO.LOW,
        };
      }
    }
  }

  return {
    low,
    high,
    remainingLowCount,
    remainingHighCount,
    err: "",
    field: 0,
  };
};
