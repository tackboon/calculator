import { RangeValue, TOTO_RANGE } from "./toto.type";
import { extractRangeInput, generateCombinations, getRangeInfo } from "./utils";
import { validateTotoInput } from "./validation/validation";

describe("generateCombinations", () => {
  it.each([
    // {
    //   input: {
    //     count: "100",
    //     system: 6,
    //     numberRange: TOTO_RANGE.FOURTY_NINE,
    //     includeNumberFilter: false,
    //     mustIncludes: "",
    //     mustExcludes: "",
    //     includeOddEven: false,
    //     odd: "",
    //     even: "",
    //     includeLowHigh: false,
    //     low: "",
    //     high: "",
    //     includeCustomGroup: false,
    //     customGroups: "",
    //     customCount: "",
    //     includeRangeGroup: false,
    //     rangeCount10: "",
    //     rangeCount20: "",
    //     rangeCount30: "",
    //     rangeCount40: "",
    //     rangeCount50: "",
    //     rangeCount60: "",
    //     rangeCount70: "",
    //   },
    //   expectedCount: 100,
    // },
    // {
    //   input: {
    //     count: "100",
    //     system: 6,
    //     numberRange: TOTO_RANGE.FOURTY_NINE,
    //     includeNumberFilter: true,
    //     mustIncludes: "1,2,3,4,5,6",
    //     mustExcludes: "",
    //     includeOddEven: false,
    //     odd: "",
    //     even: "",
    //     includeLowHigh: false,
    //     low: "",
    //     high: "",
    //     includeCustomGroup: false,
    //     customGroups: "",
    //     customCount: "",
    //     includeRangeGroup: false,
    //     rangeCount10: "",
    //     rangeCount20: "",
    //     rangeCount30: "",
    //     rangeCount40: "",
    //     rangeCount50: "",
    //     rangeCount60: "",
    //     rangeCount70: "",
    //   },
    //   expectedCount: 1,
    // },
    {
      input: {
        count: "1",
        system: 6,
        numberRange: TOTO_RANGE.FOURTY_NINE,
        includeNumberFilter: true,
        mustIncludes: "21,23",
        mustExcludes: "",
        includeOddEven: true,
        odd: "",
        even: "1",
        includeLowHigh: true,
        low: "",
        high: "0-3",
        includeCustomGroup: true,
        customGroups: "46,48",
        customCount: "1",
        includeRangeGroup: true,
        rangeCount10: "",
        rangeCount20: "",
        rangeCount30: "3",
        rangeCount40: "",
        rangeCount50: "",
        rangeCount60: "",
        rangeCount70: "",
      },
      expectedCount: 1,
    },
    // {
    //   input: {
    //     count: "100",
    //     system: 6,
    //     numberRange: TOTO_RANGE.FOURTY_NINE,
    //     includeNumberFilter: true,
    //     mustIncludes: "",
    //     mustExcludes: "21,22,26,27,28,29,30",
    //     includeOddEven: true,
    //     odd: "",
    //     even: "0-3",
    //     includeLowHigh: true,
    //     low: "3",
    //     high: "3",
    //     includeCustomGroup: true,
    //     customGroups: "23,24,25,31,32,33,34",
    //     customCount: "2",
    //     includeRangeGroup: true,
    //     rangeCount10: "",
    //     rangeCount20: "",
    //     rangeCount30: "2",
    //     rangeCount40: "",
    //     rangeCount50: "",
    //     rangeCount60: "",
    //     rangeCount70: "",
    //   },
    //   expectedCount: 100,
    // },
    // {
    //   input: {
    //     count: "100",
    //     system: 6,
    //     numberRange: TOTO_RANGE.FOURTY_NINE,
    //     includeNumberFilter: true,
    //     mustIncludes: "",
    //     mustExcludes: "25,27,29,31,33,35,37,39,41,43,45,47,49",
    //     includeOddEven: true,
    //     odd: "2",
    //     even: "4",
    //     includeLowHigh: false,
    //     low: "",
    //     high: "",
    //     includeCustomGroup: true,
    //     customGroups: "1,2,3,4,5,6,7,9,10,11,13,15,17,19,21,23",
    //     customCount: "2",
    //     includeRangeGroup: false,
    //     rangeCount10: "",
    //     rangeCount20: "",
    //     rangeCount30: "",
    //     rangeCount40: "",
    //     rangeCount50: "",
    //     rangeCount60: "",
    //     rangeCount70: "",
    //   },
    //   expectedCount: 100,
    // },
    // {
    //   input: {
    //     count: "100",
    //     system: 6,
    //     numberRange: TOTO_RANGE.FOURTY_NINE,
    //     includeNumberFilter: true,
    //     mustIncludes: "",
    //     mustExcludes: "4,6,8,10,22,24,26,28,30,32,34,36,38,40,42,44,46,48",
    //     includeOddEven: true,
    //     odd: "4",
    //     even: "2",
    //     includeLowHigh: false,
    //     low: "",
    //     high: "",
    //     includeCustomGroup: false,
    //     customGroups: "",
    //     customCount: "",
    //     includeRangeGroup: true,
    //     rangeCount10: "1",
    //     rangeCount20: "1",
    //     rangeCount30: "",
    //     rangeCount40: "",
    //     rangeCount50: "",
    //     rangeCount60: "",
    //     rangeCount70: "",
    //   },
    //   expectedCount: 100,
    // },
  ])("$input", ({ input, expectedCount }) => {
    const { err } = validateTotoInput(input);
    expect(err).toBe("");

    const results = generateCombinations(input);
    expect(results.length).toBe(expectedCount);

    for (const result of results) {
      // verify odd/even setting
      const oddEvenParts = result.oddEven.split("/");
      expect(oddEvenParts.length).toBe(2);
      const odd = Number(oddEvenParts[0]);
      const even = Number(oddEvenParts[1]);
      expect(odd + even).toBe(input.system);
      const oddRange = extractRangeInput(input.odd, input.system);
      const evenRange = extractRangeInput(input.even, input.system);
      expect(odd).toBeGreaterThanOrEqual(oddRange.min);
      expect(odd).toBeLessThanOrEqual(oddRange.max);
      expect(even).toBeGreaterThanOrEqual(evenRange.min);
      expect(even).toBeLessThanOrEqual(evenRange.max);

      // verify low/high setting
      const lowHighParts = result.lowHigh.split("/");
      expect(lowHighParts.length).toBe(2);
      const low = Number(lowHighParts[0]);
      const high = Number(lowHighParts[1]);
      expect(low + high).toBe(input.system);
      const lowRange = extractRangeInput(input.low, input.system);
      const highRange = extractRangeInput(input.high, input.system);
      expect(low).toBeGreaterThanOrEqual(lowRange.min);
      expect(low).toBeLessThanOrEqual(lowRange.max);
      expect(high).toBeGreaterThanOrEqual(highRange.min);
      expect(high).toBeLessThanOrEqual(highRange.max);

      // convert combination into a set
      const selectedPool = new Set<number>();
      const combination = result.combination.split(" ");
      for (const val of combination) {
        if (val === "") {
          continue;
        }
        const n = Number(val);
        selectedPool.add(n);
      }

      // verify must include numbers setting
      const mustIncludes = input.mustIncludes
        .split(",")
        .filter((v) => v !== "")
        .map(Number);
      expect(mustIncludes.every((n) => selectedPool.has(n))).toBe(true);

      // verify must exclude numbers setting
      const mustExcludes = input.mustExcludes
        .split(",")
        .filter((v) => v !== "")
        .map(Number);
      expect(mustExcludes.every((n) => !selectedPool.has(n))).toBe(true);

      // verify custom group setting
      let customCount = 0;
      const customGroups = input.customGroups.split(",");
      for (const val of customGroups) {
        if (val === "") {
          continue;
        }
        const n = Number(val);
        if (selectedPool.has(n)) customCount++;
      }
      const customCountRange = extractRangeInput(
        input.customCount,
        input.system
      );
      expect(customCount).toBeGreaterThanOrEqual(customCountRange.min);
      expect(customCount).toBeLessThanOrEqual(customCountRange.max);

      // verify range group count
      for (const group of result.outputGroups) {
        let rangeValue: RangeValue = { min: 0, max: input.system };
        switch (group.name) {
          case "1-10":
            rangeValue = extractRangeInput(input.rangeCount10, input.system);
            break;
          case "11-20":
            rangeValue = extractRangeInput(input.rangeCount20, input.system);
            break;
          case "21-30":
            rangeValue = extractRangeInput(input.rangeCount30, input.system);
            break;
          case "31-40":
            rangeValue = extractRangeInput(input.rangeCount40, input.system);
            break;
          case "41-50":
            rangeValue = extractRangeInput(input.rangeCount50, input.system);
            break;
          case "51-60":
            rangeValue = extractRangeInput(input.rangeCount60, input.system);
            break;
          case "61-70":
            rangeValue = extractRangeInput(input.rangeCount70, input.system);
            break;
        }

        expect(group.count).toBeGreaterThanOrEqual(rangeValue.min);
        expect(group.count).toBeLessThanOrEqual(rangeValue.max);
      }
    }
  });
});
