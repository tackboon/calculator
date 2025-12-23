/* eslint-disable no-restricted-globals */
/// <reference lib="webworker" />

import { WorkerInput } from "./toto.type";
import { verifyCombination } from "./utils";

self.onmessage = (e: MessageEvent) => {
  const {
    system,
    rangeInfo,
    customCounts,
    odd,
    even,
    low,
    high,
    rangeValues,
    mustIncludeSize,
    availableBit,
    selectedBit,
    customIdx,
    totalCustomGroup,
    oddBit,
    lowBit,
    rangeBit,
    startNum,
    endNum,
  }: WorkerInput = e.data;
  let possibleCombination = 0;
  let selectedIncludeCount = 0;
  let selectedOddCount = 0;
  let selectedLowCount = 0;
  const selectedRangeGroupCounts = new Array<number>(rangeInfo.group).fill(0);
  const selectedCustomCounts = new Array<number>(totalCustomGroup).fill(0);

  const backtrack = (depth: number, start: number) => {
    if (depth === 7) {
      if (
        selectedIncludeCount >= mustIncludeSize &&
        verifyCombination(
          system,
          system,
          selectedCustomCounts,
          customCounts,
          selectedOddCount,
          odd,
          6 - selectedOddCount,
          even,
          selectedLowCount,
          low,
          6 - selectedLowCount,
          high,
          selectedRangeGroupCounts,
          rangeValues
        )
      ) {
        possibleCombination++;
      }

      return;
    }

    for (let num = start; num <= rangeInfo.count - (6 - depth); num++) {
      if (!availableBit[num] && !selectedBit[num]) {
        continue;
      }

      if (selectedBit[num]) selectedIncludeCount++;
      if (num in customIdx) selectedCustomCounts[customIdx[num]]++;
      if (oddBit[num]) selectedOddCount++;
      if (lowBit[num]) selectedLowCount++;
      selectedRangeGroupCounts[rangeBit[num]]++;

      backtrack(depth + 1, num + 1);

      if (selectedBit[num]) selectedIncludeCount--;
      if (num in customIdx) selectedCustomCounts[customIdx[num]]--;
      if (oddBit[num]) selectedOddCount--;
      if (lowBit[num]) selectedLowCount--;
      selectedRangeGroupCounts[rangeBit[num]]--;
    }
  };

  for (let num = startNum; num <= endNum; num++) {
    if (!availableBit[num] && !selectedBit[num]) {
      continue;
    }

    if (selectedBit[num]) selectedIncludeCount++;
    if (num in customIdx) selectedCustomCounts[customIdx[num]]++;
    if (oddBit[num]) selectedOddCount++;
    if (lowBit[num]) selectedLowCount++;
    selectedRangeGroupCounts[rangeBit[num]]++;

    backtrack(2, num + 1);

    if (selectedBit[num]) selectedIncludeCount--;
    if (num in customIdx) selectedCustomCounts[customIdx[num]]--;
    if (oddBit[num]) selectedOddCount--;
    if (lowBit[num]) selectedLowCount--;
    selectedRangeGroupCounts[rangeBit[num]]--;
  }

  self.postMessage(possibleCombination);
};

export {};
