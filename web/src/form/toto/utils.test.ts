import { RangeValue, TOTO_RANGE } from "./toto.type";
import {
  calcCombination,
  extractRangeInput,
  generateCombinations,
} from "./utils";
import { validateTotoInput } from "./validation";

// Mock the global Worker constructor
beforeAll(() => {
  global.Worker = class MockWorker {
    constructor(url: string | URL, options?: WorkerOptions) {
      console.log("Mock Worker created with URL:", url.toString());
      this.url = url;
      this.options = options;
    }

    url: string | URL;
    options?: WorkerOptions;

    postMessage = jest.fn();
    addEventListener = jest.fn();
    removeEventListener = jest.fn();
    terminate = jest.fn();
  } as any;
});

afterAll(() => {
  delete (global as any).Worker;
});

describe("calcCombination", () => {
  it.each([
    { input: { n: 6, k: 6 }, output: 1 },
    { input: { n: 7, k: 6 }, output: 7 },
    { input: { n: 12, k: 6 }, output: 924 },
  ])("$input", ({ input, output }) => {
    const out = calcCombination(input.n, input.k);
    expect(out).toBe(output);
  });
});

describe("generateCombinations", () => {
  it.each([
    {
      input: {
        count: "100",
        system: 6,
        numberRange: TOTO_RANGE.FOURTY_NINE,
        includeNumberFilter: false,
        mustIncludes: "",
        mustExcludes: "",
        includeOddEven: false,
        odd: "",
        even: "",
        includeLowHigh: false,
        low: "",
        high: "",
        includeCustomGroup: false,
        customGroups: [],
        includeRangeGroup: false,
        rangeCount10: "",
        rangeCount20: "",
        rangeCount30: "",
        rangeCount40: "",
        rangeCount50: "",
        rangeCount60: "",
        rangeCount70: "",
        includeConsecutive: false,
        maxConsecutiveLength: "",
        maxConsecutiveGroup: "",
      },
      expectedCount: 100,
    },
    {
      input: {
        count: "100",
        system: 7,
        numberRange: TOTO_RANGE.FOURTY_NINE,
        includeNumberFilter: true,
        mustIncludes: "1,2,3,4,5,6,7",
        mustExcludes: "",
        includeOddEven: false,
        odd: "",
        even: "",
        includeLowHigh: false,
        low: "",
        high: "",
        includeCustomGroup: false,
        customGroups: [],
        includeRangeGroup: false,
        rangeCount10: "",
        rangeCount20: "",
        rangeCount30: "",
        rangeCount40: "",
        rangeCount50: "",
        rangeCount60: "",
        rangeCount70: "",
        includeConsecutive: false,
        maxConsecutiveLength: "",
        maxConsecutiveGroup: "",
      },
      expectedCount: 1,
    },
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
        customGroups: [{ numbers: "46,48", count: "1" }],
        includeRangeGroup: true,
        rangeCount10: "",
        rangeCount20: "",
        rangeCount30: "3",
        rangeCount40: "",
        rangeCount50: "",
        rangeCount60: "",
        rangeCount70: "",
        includeConsecutive: false,
        maxConsecutiveLength: "",
        maxConsecutiveGroup: "",
      },
      expectedCount: 1,
    },
    {
      input: {
        count: "100",
        system: 6,
        numberRange: TOTO_RANGE.FOURTY_NINE,
        includeNumberFilter: true,
        mustIncludes: "",
        mustExcludes: "21,22,26,27,28,29,30",
        includeOddEven: true,
        odd: "",
        even: "0-3",
        includeLowHigh: true,
        low: "3",
        high: "3",
        includeCustomGroup: true,
        customGroups: [{ numbers: "23,24,25,31,32,33,34", count: "2" }],
        includeRangeGroup: true,
        rangeCount10: "",
        rangeCount20: "",
        rangeCount30: "2",
        rangeCount40: "",
        rangeCount50: "",
        rangeCount60: "",
        rangeCount70: "",
        includeConsecutive: false,
        maxConsecutiveLength: "",
        maxConsecutiveGroup: "",
      },
      expectedCount: 100,
    },
    {
      input: {
        count: "100",
        system: 6,
        numberRange: TOTO_RANGE.FOURTY_NINE,
        includeNumberFilter: true,
        mustIncludes: "",
        mustExcludes: "25,27,29,31,33,35,37,39,41,43,45,47,49",
        includeOddEven: true,
        odd: "2",
        even: "4",
        includeLowHigh: false,
        low: "",
        high: "",
        includeCustomGroup: true,
        customGroups: [
          { numbers: "1,2,3,4,5,6,7,9,10,11,13,15,17,19,21,23", count: "2" },
        ],
        includeRangeGroup: false,
        rangeCount10: "",
        rangeCount20: "",
        rangeCount30: "",
        rangeCount40: "",
        rangeCount50: "",
        rangeCount60: "",
        rangeCount70: "",
        includeConsecutive: false,
        maxConsecutiveLength: "",
        maxConsecutiveGroup: "",
      },
      expectedCount: 100,
    },
    {
      input: {
        count: "100",
        system: 6,
        numberRange: TOTO_RANGE.FOURTY_NINE,
        includeNumberFilter: true,
        mustIncludes: "",
        mustExcludes: "4,6,8,10,22,24,26,28,30,32,34,36,38,40,42,44,46,48",
        includeOddEven: true,
        odd: "4",
        even: "2",
        includeLowHigh: false,
        low: "",
        high: "",
        includeCustomGroup: false,
        customGroups: [],
        includeRangeGroup: true,
        rangeCount10: "1",
        rangeCount20: "1",
        rangeCount30: "",
        rangeCount40: "",
        rangeCount50: "",
        rangeCount60: "",
        rangeCount70: "",
        includeConsecutive: false,
        maxConsecutiveLength: "",
        maxConsecutiveGroup: "",
      },
      expectedCount: 100,
    },
    {
      input: {
        count: "100",
        system: 6,
        numberRange: TOTO_RANGE.FOURTY_NINE,
        includeNumberFilter: true,
        mustIncludes: "",
        mustExcludes: "",
        includeOddEven: false,
        odd: "",
        even: "",
        includeLowHigh: false,
        low: "",
        high: "",
        includeCustomGroup: true,
        customGroups: [
          {
            numbers:
              "1,3,4,7,16,17,18,20,21,23,25,26,27,28,29,30,32,33,39,40,41,42,44,48,49",
            count: "0-3",
          },
          {
            numbers: "2,6,8,10,13,15,19,22,24,31,34,35,43",
            count: "1-4",
          },
        ],
        includeRangeGroup: true,
        rangeCount10: "0-3,!2",
        rangeCount20: "0-3",
        rangeCount30: "0-3",
        rangeCount40: "0-3",
        rangeCount50: "0-2",
        rangeCount60: "",
        rangeCount70: "",
        includeConsecutive: true,
        maxConsecutiveLength: "2",
        maxConsecutiveGroup: "1",
      },
      expectedCount: 100,
    },
  ])("$input", async ({ input, expectedCount }) => {
    const { err } = validateTotoInput(input);
    expect(err).toBe("");

    const results = await generateCombinations(input, false);
    expect(results.combinations.length).toBe(expectedCount);

    for (const result of results.combinations) {
      // verify odd/even setting
      const oddEvenParts = result.oddEven.split("/");
      expect(oddEvenParts.length).toBe(2);
      const odd = Number(oddEvenParts[0]);
      const even = Number(oddEvenParts[1]);
      expect(odd + even).toBe(input.system);
      const oddRange = extractRangeInput(input.odd, input.system);
      const evenRange = extractRangeInput(input.even, input.system);
      expect(odd).toBeGreaterThanOrEqual(oddRange.value.min);
      expect(odd).toBeLessThanOrEqual(oddRange.value.max);
      expect(even).toBeGreaterThanOrEqual(evenRange.value.min);
      expect(even).toBeLessThanOrEqual(evenRange.value.max);

      // verify low/high setting
      const lowHighParts = result.lowHigh.split("/");
      expect(lowHighParts.length).toBe(2);
      const low = Number(lowHighParts[0]);
      const high = Number(lowHighParts[1]);
      expect(low + high).toBe(input.system);
      const lowRange = extractRangeInput(input.low, input.system);
      const highRange = extractRangeInput(input.high, input.system);
      expect(low).toBeGreaterThanOrEqual(lowRange.value.min);
      expect(low).toBeLessThanOrEqual(lowRange.value.max);
      expect(high).toBeGreaterThanOrEqual(highRange.value.min);
      expect(high).toBeLessThanOrEqual(highRange.value.max);

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
      for (let i = 0; i < input.customGroups.length; i++) {
        let customCount = 0;
        const customGroups = input.customGroups[i].numbers.split(",");
        for (const val of customGroups) {
          if (val === "") {
            continue;
          }
          const n = Number(val);
          if (selectedPool.has(n)) customCount++;
        }
        const customCountRange = extractRangeInput(
          input.customGroups[i].count,
          input.system
        );
        expect(customCount).toBeGreaterThanOrEqual(customCountRange.value.min);
        expect(customCount).toBeLessThanOrEqual(customCountRange.value.max);
      }

      // verify range group count
      for (const group of result.outputGroups) {
        let rangeValue: RangeValue = {
          min: 0,
          max: input.system,
          excludes: [],
        };
        switch (group.name) {
          case "1-10":
            rangeValue = extractRangeInput(
              input.rangeCount10,
              input.system
            ).value;
            break;
          case "11-20":
            rangeValue = extractRangeInput(
              input.rangeCount20,
              input.system
            ).value;
            break;
          case "21-30":
            rangeValue = extractRangeInput(
              input.rangeCount30,
              input.system
            ).value;
            break;
          case "31-40":
            rangeValue = extractRangeInput(
              input.rangeCount40,
              input.system
            ).value;
            break;
          case "41-50":
            rangeValue = extractRangeInput(
              input.rangeCount50,
              input.system
            ).value;
            break;
          case "51-60":
            rangeValue = extractRangeInput(
              input.rangeCount60,
              input.system
            ).value;
            break;
          case "61-70":
            rangeValue = extractRangeInput(
              input.rangeCount70,
              input.system
            ).value;
            break;
        }

        expect(group.count).toBeGreaterThanOrEqual(rangeValue.min);
        expect(group.count).toBeLessThanOrEqual(rangeValue.max);
      }
    }
  });
});
