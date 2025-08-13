import { create, all, BigNumber } from "mathjs";

export const mathBigNum = create(all, { number: "BigNumber", precision: 64 });

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

export const QUADRILLION = mathBigNum.bignumber("1000000000");
