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
  requiredCount: number,
  availablePools: TotoPools,
  mustIncludePools: TotoPools,
  customPools: TotoPools,
  customCount: RangeValue,
  requiredOddCount: number,
  requiredEvenCount: number
): {
  low: RangeValue;
  high: RangeValue;
  requiredLowCount: number;
  requiredHighCount: number;
  requiredOddLowCount: number;
  requiredOddHighCount: number;
  requiredEvenLowCount: number;
  requiredEvenHighCount: number;
  err: string;
  field: ERROR_FIELD_TOTO;
} => {
  let low: RangeValue = { min: 0, max: input.system };
  let high: RangeValue = { min: 0, max: input.system };
  let requiredLowCount = 0;
  let requiredHighCount = 0;
  let requiredOddLowCount = 0;
  let requiredOddHighCount = 0;
  let requiredEvenLowCount = 0;
  let requiredEvenHighCount = 0;
  if (input.includeLowHigh) {
    // validate low number count field
    const lowRes = validateRangeCountInput(input.low, input.system);
    if (lowRes.err !== "") {
      return {
        low,
        high,
        requiredLowCount,
        requiredHighCount,
        requiredOddLowCount,
        requiredOddHighCount,
        requiredEvenLowCount,
        requiredEvenHighCount,
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
        requiredLowCount,
        requiredHighCount,
        requiredOddLowCount,
        requiredOddHighCount,
        requiredEvenLowCount,
        requiredEvenHighCount,
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
        requiredLowCount,
        requiredHighCount,
        requiredOddLowCount,
        requiredOddHighCount,
        requiredEvenLowCount,
        requiredEvenHighCount,
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
        requiredLowCount,
        requiredHighCount,
        requiredOddLowCount,
        requiredOddHighCount,
        requiredEvenLowCount,
        requiredEvenHighCount,
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
        requiredLowCount,
        requiredHighCount,
        requiredOddLowCount,
        requiredOddHighCount,
        requiredEvenLowCount,
        requiredEvenHighCount,
        err: "Your low/high setting conflicts with the numbers you've included.",
        field:
          input.high !== "" && !isMaxHighUpdated
            ? ERROR_FIELD_TOTO.HIGH
            : ERROR_FIELD_TOTO.LOW,
      };
    }

    // compute remaining low/high number required
    requiredLowCount = Math.max(
      0,
      low.min - mustIncludePools.allPools.lowPools.size
    );
    requiredHighCount = Math.max(
      0,
      high.min - mustIncludePools.allPools.highPools.size
    );

    // Ensure remaining pool is enough for the required low number count
    if (requiredLowCount > availablePools.allPools.lowPools.size) {
      return {
        low,
        high,
        requiredLowCount,
        requiredHighCount,
        requiredOddLowCount,
        requiredOddHighCount,
        requiredEvenLowCount,
        requiredEvenHighCount,
        err: "Your low/high setting cannot be satisfied after applying your include and exclude settings.",
        field:
          input.low !== "" && !isMinLowUpdated
            ? ERROR_FIELD_TOTO.LOW
            : ERROR_FIELD_TOTO.HIGH,
      };
    }

    // Ensure remaining pool is enough for the required high number count
    if (requiredHighCount > availablePools.allPools.highPools.size) {
      return {
        low,
        high,
        requiredLowCount,
        requiredHighCount,
        requiredOddLowCount,
        requiredOddHighCount,
        requiredEvenLowCount,
        requiredEvenHighCount,
        err: "Your low/high setting cannot be satisfied after applying your include and exclude settings.",
        field:
          input.high !== "" && !isMinHighUpdated
            ? ERROR_FIELD_TOTO.HIGH
            : ERROR_FIELD_TOTO.LOW,
      };
    }

    // compute remaining odd/even + low number required
    requiredOddLowCount = Math.max(
      0,
      requiredLowCount + requiredOddCount - requiredCount
    );
    requiredEvenLowCount = Math.max(
      0,
      requiredLowCount + requiredEvenCount - requiredCount
    );

    // compute remaining odd/even + high number required
    requiredOddHighCount = Math.max(
      0,
      requiredHighCount + requiredOddCount - requiredCount
    );
    requiredEvenHighCount = Math.max(
      0,
      requiredHighCount + requiredEvenCount - requiredCount
    );

    // Ensure remaining pool is enough for the required odd/even + low number
    if (
      requiredOddLowCount > availablePools.allPools.oddLowPools.size ||
      requiredEvenLowCount > availablePools.allPools.evenLowPools.size
    ) {
      return {
        low,
        high,
        requiredLowCount,
        requiredHighCount,
        requiredOddLowCount,
        requiredOddHighCount,
        requiredEvenLowCount,
        requiredEvenHighCount,
        err: "Your low/high setting cannot be satisfied after applying your include, exclude, and odd/even settings.",
        field:
          input.low !== "" && !isMinLowUpdated
            ? ERROR_FIELD_TOTO.LOW
            : ERROR_FIELD_TOTO.HIGH,
      };
    }

    // Ensure remaining pool is enough for the required odd/even + high number
    if (
      requiredOddHighCount > availablePools.allPools.oddHighPools.size ||
      requiredEvenHighCount > availablePools.allPools.evenHighPools.size
    ) {
      return {
        low,
        high,
        requiredLowCount,
        requiredHighCount,
        requiredOddLowCount,
        requiredOddHighCount,
        requiredEvenLowCount,
        requiredEvenHighCount,
        err: "Your low/high setting cannot be satisfied after applying your include, exclude, and odd/even settings.",
        field:
          input.high !== "" && !isMinHighUpdated
            ? ERROR_FIELD_TOTO.HIGH
            : ERROR_FIELD_TOTO.LOW,
      };
    }

    // Handle low/high + custom group settings
    if (customPools.allPools.allPools.size > 0) {
      // Ensure there are enough available low numbers left (after applying include, exclude, and custom group filters) to satisfy the remaining low requirement.
      if (
        requiredLowCount >
        availablePools.allPools.lowPools.size -
          customPools.allPools.lowPools.size +
          Math.min(customCount.max, customPools.allPools.lowPools.size)
      ) {
        return {
          low,
          high,
          requiredLowCount,
          requiredHighCount,
          requiredOddLowCount,
          requiredOddHighCount,
          requiredEvenLowCount,
          requiredEvenHighCount,
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, and custom group settings.",
          field:
            input.low !== "" && !isMinLowUpdated
              ? ERROR_FIELD_TOTO.LOW
              : ERROR_FIELD_TOTO.HIGH,
        };
      }

      // Ensure there are enough available high numbers left (after applying include, exclude, and custom group filters) to satisfy the remaining high requirement.
      if (
        requiredHighCount >
        availablePools.allPools.highPools.size -
          customPools.allPools.highPools.size +
          Math.min(customCount.max, customPools.allPools.highPools.size)
      ) {
        return {
          low,
          high,
          requiredLowCount,
          requiredHighCount,
          requiredOddLowCount,
          requiredOddHighCount,
          requiredEvenLowCount,
          requiredEvenHighCount,
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, and custom group settings.",
          field:
            input.high !== "" && !isMinHighUpdated
              ? ERROR_FIELD_TOTO.HIGH
              : ERROR_FIELD_TOTO.LOW,
        };
      }

      // Ensure there are enough available low numbers left (after applying include, exclude, custom group, and odd/even filters) to satisfy the remaining low requirement.
      if (
        requiredOddLowCount >
          availablePools.allPools.oddLowPools.size -
            customPools.allPools.oddLowPools.size +
            Math.min(customCount.max, customPools.allPools.oddLowPools.size) ||
        requiredEvenLowCount >
          availablePools.allPools.evenLowPools.size -
            customPools.allPools.evenLowPools.size +
            Math.min(customCount.max, customPools.allPools.evenLowPools.size)
      ) {
        return {
          low,
          high,
          requiredLowCount,
          requiredHighCount,
          requiredOddLowCount,
          requiredOddHighCount,
          requiredEvenLowCount,
          requiredEvenHighCount,
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, custom group, and odd/even settings.",
          field:
            input.low !== "" && !isMinLowUpdated
              ? ERROR_FIELD_TOTO.LOW
              : ERROR_FIELD_TOTO.HIGH,
        };
      }

      // Ensure there are enough available high numbers left (after applying include, exclude, custom group, and odd/even filters) to satisfy the remaining high requirement.
      if (
        requiredOddHighCount >
          availablePools.allPools.oddHighPools.size -
            customPools.allPools.oddHighPools.size +
            Math.min(customCount.max, customPools.allPools.oddHighPools.size) ||
        requiredEvenHighCount >
          availablePools.allPools.evenHighPools.size -
            customPools.allPools.evenHighPools.size +
            Math.min(customCount.max, customPools.allPools.evenHighPools.size)
      ) {
        return {
          low,
          high,
          requiredLowCount,
          requiredHighCount,
          requiredOddLowCount,
          requiredOddHighCount,
          requiredEvenLowCount,
          requiredEvenHighCount,
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, custom group, and odd/even settings.",
          field:
            input.high !== "" && !isMinHighUpdated
              ? ERROR_FIELD_TOTO.HIGH
              : ERROR_FIELD_TOTO.LOW,
        };
      }

      // calculate minimum low/high count from custom group
      const minCustomLowCount = Math.max(
        0,
        customCount.min - customPools.allPools.highPools.size
      );
      const minCustomHighCount = Math.max(
        0,
        customCount.min - customPools.allPools.lowPools.size
      );

      // Ensure there are enough low numbers remaining to fulfill the minimum requirement from custom groups.
      if (
        low.max - mustIncludePools.allPools.lowPools.size <
        minCustomLowCount
      ) {
        return {
          low,
          high,
          requiredLowCount,
          requiredHighCount,
          requiredOddLowCount,
          requiredOddHighCount,
          requiredEvenLowCount,
          requiredEvenHighCount,
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, and custom group settings.",
          field:
            input.low !== "" && !isMaxLowUpdated
              ? ERROR_FIELD_TOTO.LOW
              : ERROR_FIELD_TOTO.HIGH,
        };
      }

      // Ensure there are enough high numbers remaining to fulfill the minimum requirement from custom groups.
      if (
        high.max - mustIncludePools.allPools.highPools.size <
        minCustomHighCount
      ) {
        return {
          low,
          high,
          requiredLowCount,
          requiredHighCount,
          requiredOddLowCount,
          requiredOddHighCount,
          requiredEvenLowCount,
          requiredEvenHighCount,
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, and custom group settings.",
          field:
            input.high !== "" && !isMaxHighUpdated
              ? ERROR_FIELD_TOTO.HIGH
              : ERROR_FIELD_TOTO.LOW,
        };
      }

      // Calculate minimum odd/even + low numbers in custom group
      const skipCount = requiredCount - customCount.min;
      const minCustomOddLowCount = Math.max(0, requiredOddLowCount - skipCount);
      const minCustomEvenLowCount = Math.max(
        0,
        requiredEvenLowCount - skipCount
      );

      // Calculate minimum odd/even + high numbers in custom group
      const minCustomOddHighCount = Math.max(
        0,
        requiredOddHighCount - skipCount
      );
      const minCustomEvenHighCount = Math.max(
        0,
        requiredEvenHighCount - skipCount
      );

      // Ensure custom pools has sufficient numbers for the odd/even + low settings
      if (
        minCustomOddLowCount > customPools.allPools.oddLowPools.size ||
        minCustomEvenLowCount > customPools.allPools.evenLowPools.size
      ) {
        return {
          low,
          high,
          requiredLowCount,
          requiredHighCount,
          requiredOddLowCount,
          requiredOddHighCount,
          requiredEvenLowCount,
          requiredEvenHighCount,
          err: "Your low/high setting cannot be satisfied after applying your include, exclude, custom group, and odd/even settings.",
          field:
            input.low !== "" && !isMinLowUpdated
              ? ERROR_FIELD_TOTO.LOW
              : ERROR_FIELD_TOTO.HIGH,
        };
      }

      // Ensure custom pools has sufficient numbers for the odd/even + low settings
      if (
        minCustomOddHighCount > customPools.allPools.oddHighPools.size ||
        minCustomEvenHighCount > customPools.allPools.evenHighPools.size
      ) {
        return {
          low,
          high,
          requiredLowCount,
          requiredHighCount,
          requiredOddLowCount,
          requiredOddHighCount,
          requiredEvenLowCount,
          requiredEvenHighCount,
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
    requiredLowCount,
    requiredHighCount,
    requiredOddLowCount,
    requiredOddHighCount,
    requiredEvenLowCount,
    requiredEvenHighCount,
    err: "",
    field: 0,
  };
};
