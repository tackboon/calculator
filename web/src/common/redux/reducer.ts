export function initStateObj<T extends Object, V>(types: T, val: V) {
  const stateObj = {};

  Object.values(types).forEach((type: string) => {
    Object.assign(stateObj, {
      [type]: val,
    });
  });

  return stateObj;
}
