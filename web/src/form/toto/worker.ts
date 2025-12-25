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
    oddBit,
    lowBit,
    rangeBit,
    startNum,
    endNum,
    maxConsecutiveLength,
    maxConsecutiveGroup,
  }: WorkerInput = e.data;
  let possibleCombination = 0;
  let selectedIncludeCount = 0;
  let selectedOddCount = 0;
  let selectedLowCount = 0;
  const selectedRangeGroupCounts = new Array<number>(rangeInfo.group).fill(0);
  const selectedCustomCounts = new Array<number>(customCounts.length).fill(0);

  const backtrack = (
    depth: number,
    prev: number,
    selectedMaxConsecutiveLength: number,
    selectedConsecutiveLength: number,
    selectedConsecutiveGroup: number
  ) => {
    if (depth === 7) {
      let finalGroup = selectedConsecutiveGroup;
      if (selectedConsecutiveLength > 1) {
        finalGroup++;
      }

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
          rangeValues,
          selectedMaxConsecutiveLength,
          maxConsecutiveLength,
          finalGroup,
          maxConsecutiveGroup
        )
      ) {
        possibleCombination++;
      }

      return;
    }

    const start = prev + 1;
    for (let num = start; num <= rangeInfo.count - (6 - depth); num++) {
      if (!availableBit[num] && !selectedBit[num]) {
        continue;
      }

      if (selectedBit[num]) selectedIncludeCount++;
      if (num in customIdx) selectedCustomCounts[customIdx[num]]++;
      if (oddBit[num]) selectedOddCount++;
      if (lowBit[num]) selectedLowCount++;
      selectedRangeGroupCounts[rangeBit[num]]++;

      let newMax = selectedMaxConsecutiveLength;
      let newLength = selectedConsecutiveLength;
      let newGroup = selectedConsecutiveGroup;
      if (num === start) {
        newLength++;
        if (newLength > newMax) newMax = newLength;
      } else {
        if (selectedConsecutiveLength > 1) newGroup++;
        newLength = 1;
      }
      backtrack(depth + 1, num, newMax, newLength, newGroup);

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

    backtrack(2, num, 1, 1, 0);

    if (selectedBit[num]) selectedIncludeCount--;
    if (num in customIdx) selectedCustomCounts[customIdx[num]]--;
    if (oddBit[num]) selectedOddCount--;
    if (lowBit[num]) selectedLowCount--;
    selectedRangeGroupCounts[rangeBit[num]]--;
  }

  self.postMessage(possibleCombination);
};

export {};
