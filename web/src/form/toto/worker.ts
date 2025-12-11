/* eslint-disable no-restricted-globals */
/// <reference lib="webworker" />

import { WorkerInput } from "./toto.type";
import { verifyCombination } from "./utils";

self.onmessage = (e: MessageEvent) => {
  const {
    system,
    rangeInfo,
    customCount,
    odd,
    even,
    low,
    high,
    rangeValues,
    mustIncludeSize,
    availableBit,
    selectedBit,
    customBit,
    oddBit,
    lowBit,
    rangeBit,
    startNum,
    endNum,
  }: WorkerInput = e.data;
  let possibleCombination = 0;
  let selectedIncludeCount = 0;
  let selectedCustomCount = 0;
  let selectedOddCount = 0;
  let selectedLowCount = 0;
  const selectedRangeGroupCounts = new Array<number>(rangeInfo.group).fill(0);

  const backtrack = (depth: number, start: number) => {
    if (depth === system) {
      // if (
      //   mustIncludeSize === selectedIncludeCount &&
      //   verifyCombination(
      //     system,
      //     system,
      //     selectedCustomCount,
      //     customCount,
      //     selectedOddCount,
      //     odd,
      //     system - selectedOddCount,
      //     even,
      //     selectedLowCount,
      //     low,
      //     system - selectedLowCount,
      //     high,
      //     selectedRangeGroupCounts,
      //     rangeValues
      //   )
      // ) {
      possibleCombination++;
      // }

      return;
    }

    for (
      let num = start;
      num <= rangeInfo.count - (system - depth);
      num++
    ) {
      // if (!availableBit[num] && !selectedBit[num]) {
      //   continue;
      // }

      // if (selectedBit[num]) selectedIncludeCount++;
      // if (customBit[num]) selectedCustomCount++;
      // if (oddBit[num]) selectedOddCount++;
      // if (lowBit[num]) selectedLowCount++;
      // selectedRangeGroupCounts[rangeBit[num]]++;

      backtrack(depth + 1, num + 1);

      // if (selectedBit[num]) selectedIncludeCount--;
      // if (customBit[num]) selectedCustomCount--;
      // if (oddBit[num]) selectedOddCount--;
      // if (lowBit[num]) selectedLowCount--;
      // selectedRangeGroupCounts[rangeBit[num]]--;
    }
  };

	console.log(startNum, endNum)
  for (let start = startNum; start <= endNum; start++) {
    backtrack(2, startNum + 1);
  }

  self.postMessage(possibleCombination);
};

export {};
