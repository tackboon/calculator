import { create, all, BigNumber } from "mathjs";

export const mathBigNum = create(all, {
  number: "BigNumber",
  numberFallback: "BigNumber",
  precision: 64,
});

export const addBig = (x: BigNumber | number, y: BigNumber | number) => {
  return mathBigNum.add(x, y) as BigNumber;
};

export const subtractBig = (x: BigNumber | number, y: BigNumber | number) => {
  return mathBigNum.subtract(x, y) as BigNumber;
};

export const multiplyBig = (x: BigNumber | number, y: BigNumber | number) => {
  return mathBigNum.multiply(x, y) as BigNumber;
};

export const divideBig = (x: BigNumber | number, y: BigNumber | number) => {
  return mathBigNum.divide(x, y) as BigNumber;
};

export const absBig = (x: BigNumber | number) => {
  return mathBigNum.abs(x) as BigNumber;
};

export const sqrtBig = (x: BigNumber) => {
  return mathBigNum.sqrt(x);
};

export const powBig = (x: BigNumber | number, y: BigNumber | number) => {
  return mathBigNum.pow(x, y) as BigNumber;
};

export const MILLION = mathBigNum.bignumber("1000000");
export const QUADRILLION = mathBigNum.bignumber("1000000000000000");
export const QUINTILLION = mathBigNum.bignumber("1000000000000000000");
