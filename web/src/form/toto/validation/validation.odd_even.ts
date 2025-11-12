import { ERROR_FIELD_TOTO, RangeValue, TotoPools } from "../toto.type";
import { validateRangeCountInput } from "./validation";

type OddEvenInput = {
  includeOddEven: boolean;
  odd: string;
  even: string;
  system: number;
};

export const validateOddEven = (
  input: OddEvenInput,
  availablePools: TotoPools,
  mustIncludePools: TotoPools,
  customPools: TotoPools,
  customCount: RangeValue
): {
  odd: RangeValue;
  even: RangeValue;
  requiredOddCount: number;
  requiredEvenCount: number;
  err: string;
  field: ERROR_FIELD_TOTO;
} => {
  let odd: RangeValue = { min: 0, max: input.system };
  let even: RangeValue = { min: 0, max: input.system };
  let requiredOddCount = 0;
  let requiredEvenCount = 0;
  if (input.includeOddEven) {
    // validate odd number count field
    const oddRes = validateRangeCountInput(input.odd, input.system);
    if (oddRes.err !== "") {
      return {
        odd,
        even,
        requiredOddCount,
        requiredEvenCount,
        err: oddRes.err,
        field: ERROR_FIELD_TOTO.ODD,
      };
    }
    odd = oddRes.count;

    // validate even number count field
    const evenRes = validateRangeCountInput(input.even, input.system);
    if (evenRes.err !== "") {
      return {
        odd,
        even,
        requiredOddCount,
        requiredEvenCount,
        err: evenRes.err,
        field: ERROR_FIELD_TOTO.EVEN,
      };
    }
    even = evenRes.count;

    // validate odd/even distribution
    if (
      odd.min + even.min > input.system ||
      odd.max + even.max < input.system
    ) {
      return {
        odd,
        even,
        requiredOddCount,
        requiredEvenCount,
        err: "Please enter a valid odd/even distribution that matches your system size.",
        field: ERROR_FIELD_TOTO.ODD,
      };
    }

    // adjust odd/even distribution
    const isMinOddUpdated = input.system - even.max > odd.min;
    if (isMinOddUpdated) odd.min = input.system - even.max;

    const isMaxOddUpdated = input.system - even.min < odd.max;
    if (isMaxOddUpdated) odd.max = input.system - even.min;

    const isMinEvenUpdated = input.system - odd.max > even.min;
    if (isMinEvenUpdated) even.min = input.system - odd.max;

    const isMaxEvenUpdated = input.system - odd.min < even.max;
    if (isMaxEvenUpdated) even.max = input.system - odd.min;

    // Ensure odd numbers are enough for must include list
    if (odd.max < mustIncludePools.allPools.oddPools.size) {
      return {
        odd,
        even,
        requiredOddCount,
        requiredEvenCount,
        err: "Your odd/even setting conflicts with the numbers you've included.",
        field:
          input.odd !== "" && !isMaxOddUpdated
            ? ERROR_FIELD_TOTO.ODD
            : ERROR_FIELD_TOTO.EVEN,
      };
    }

    // Ensure even numbers are enough for must include list
    if (even.max < mustIncludePools.allPools.evenPools.size) {
      return {
        odd,
        even,
        requiredOddCount,
        requiredEvenCount,
        err: "Your odd/even setting conflicts with the numbers you've included.",
        field:
          input.even !== "" && !isMaxEvenUpdated
            ? ERROR_FIELD_TOTO.EVEN
            : ERROR_FIELD_TOTO.ODD,
      };
    }

    // compute remaining odd/even number required
    requiredOddCount = Math.max(
      0,
      odd.min - mustIncludePools.allPools.oddPools.size
    );
    requiredEvenCount = Math.max(
      0,
      even.min - mustIncludePools.allPools.evenPools.size
    );

    // Ensure remaining pool is enough for the required odd number count
    if (requiredOddCount > availablePools.allPools.oddPools.size) {
      return {
        odd,
        even,
        requiredOddCount,
        requiredEvenCount,
        err: "Your odd/even setting cannot be satisfied after applying your include and exclude settings.",
        field:
          input.odd !== "" && !isMinOddUpdated
            ? ERROR_FIELD_TOTO.ODD
            : ERROR_FIELD_TOTO.EVEN,
      };
    }

    // Ensure remaining pool is enough for the required even number count
    if (requiredEvenCount > availablePools.allPools.evenPools.size) {
      return {
        odd,
        even,
        requiredOddCount,
        requiredEvenCount,
        err: "Your odd/even setting cannot be satisfied after applying your include and exclude settings.",
        field:
          input.even !== "" && !isMinEvenUpdated
            ? ERROR_FIELD_TOTO.EVEN
            : ERROR_FIELD_TOTO.ODD,
      };
    }

    // Handle odd/even + custom group settings
    if (customPools.allPools.allPools.size > 0) {
      // Ensure there are enough available odd numbers left (after applying include, exclude, and custom group filters) to satisfy the remaining odd requirement.
      if (
        requiredOddCount >
        availablePools.allPools.oddPools.size -
          customPools.allPools.oddPools.size +
          Math.min(customCount.max, customPools.allPools.oddPools.size)
      ) {
        return {
          odd,
          even,
          requiredOddCount,
          requiredEvenCount,
          err: "Your odd/even setting cannot be satisfied after applying your include, exclude, and custom group settings.",
          field:
            input.odd !== "" && !isMinOddUpdated
              ? ERROR_FIELD_TOTO.ODD
              : ERROR_FIELD_TOTO.EVEN,
        };
      }

      // Ensure there are enough available even numbers left (after applying include, exclude, and custom group filters) to satisfy the remaining even requirement.
      if (
        requiredEvenCount >
        availablePools.allPools.evenPools.size -
          customPools.allPools.evenPools.size +
          Math.min(customCount.max, customPools.allPools.evenPools.size)
      ) {
        return {
          odd,
          even,
          requiredOddCount,
          requiredEvenCount,
          err: "Your odd/even setting cannot be satisfied after applying your include, exclude, and custom group settings.",
          field:
            input.even !== "" && !isMinEvenUpdated
              ? ERROR_FIELD_TOTO.EVEN
              : ERROR_FIELD_TOTO.ODD,
        };
      }

      // calculate minimum odd/even count from custom group
      const minCustomOddCount = Math.max(
        0,
        customCount.min - customPools.allPools.evenPools.size
      );
      const minCustomEvenCount = Math.max(
        0,
        customCount.min - customPools.allPools.oddPools.size
      );

      // Ensure there are enough odd numbers remaining to fulfill the minimum requirement from custom groups.
      if (
        odd.max - mustIncludePools.allPools.oddPools.size <
        minCustomOddCount
      ) {
        return {
          odd,
          even,
          requiredOddCount,
          requiredEvenCount,
          err: "Your odd/even setting cannot be satisfied after applying your include, exclude, and custom group settings.",
          field:
            input.odd !== "" && !isMaxOddUpdated
              ? ERROR_FIELD_TOTO.ODD
              : ERROR_FIELD_TOTO.EVEN,
        };
      }

      // Ensure there are enough even numbers remaining to fulfill the minimum requirement from custom groups.
      if (
        even.max - mustIncludePools.allPools.evenPools.size <
        minCustomEvenCount
      ) {
        return {
          odd,
          even,
          requiredOddCount,
          requiredEvenCount,
          err: "Your odd/even setting cannot be satisfied after applying your include, exclude, and custom group settings.",
          field:
            input.even !== "" && !isMaxEvenUpdated
              ? ERROR_FIELD_TOTO.EVEN
              : ERROR_FIELD_TOTO.ODD,
        };
      }
    }
  }

  return {
    odd,
    even,
    requiredOddCount,
    requiredEvenCount,
    err: "",
    field: 0,
  };
};
