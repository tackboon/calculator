import { TOTO_RANGE } from "../toto.type";
import { getRangeInfo } from "../utils";
import { validateListInput, validateRangeCountInput } from "./validation";

describe("validateListInput", () => {
  const rangeInfo = getRangeInfo(TOTO_RANGE.THIRTY);

  it("should call fn for valid numbers and return empty string", () => {
    const mockFn = jest.fn(() => "");
    const err = validateListInput("1,2,3", rangeInfo, mockFn);

    expect(err).toBe("");
    expect(mockFn).toHaveBeenCalledTimes(3);
    expect(mockFn).toHaveBeenCalledWith(1);
    expect(mockFn).toHaveBeenCalledWith(2);
    expect(mockFn).toHaveBeenCalledWith(3);
  });

  it("should return error message when a number is out of range", () => {
    const mockFn = jest.fn(() => "");
    const err = validateListInput("0,2,3", rangeInfo, mockFn);

    expect(err).toBe("Please enter values between 1 and 30.");
    expect(mockFn).toHaveBeenCalledTimes(0);
  });

  it("returns error from callback when fn detects custom error", () => {
    const mockFn = jest.fn((n: number) => (n === 13 ? "13 not allowed" : ""));
    const err = validateListInput("1,13,14", rangeInfo, mockFn);

    expect(err).toBe("13 not allowed");
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenCalledWith(1);
    expect(mockFn).toHaveBeenCalledWith(13);
  });
});

describe("validateRangeCountInput", () => {
  const max = 6;

  it.each([
    {
      countStr: "1",
      expectedMin: 1,
      expectedMax: 1,
      expectedError: "",
    },
    {
      countStr: "",
      expectedMin: 0,
      expectedMax: 6,
      expectedError: "",
    },
    {
      countStr: "0-7",
      expectedMin: 0,
      expectedMax: 7,
      expectedError: "Please enter a valid number or range value.",
    },
    {
      countStr: "6-5",
      expectedMin: 6,
      expectedMax: 5,
      expectedError: "Please enter a valid number or range value.",
    },
    {
      countStr: "8",
      expectedMin: 8,
      expectedMax: 8,
      expectedError: "Please enter a valid number or range value.",
    },
  ])(
    "returns correct result for input: $countStr",
    ({ countStr, expectedMin, expectedMax, expectedError }) => {
      const result = validateRangeCountInput(countStr, max);

      expect(result.err).toBe(expectedError);
      expect(result.count.min).toBe(expectedMin);
      expect(result.count.max).toBe(expectedMax);
    }
  );
});
