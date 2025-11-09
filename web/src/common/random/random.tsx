export const randomFromSet = <T,>(
  set: Set<T>,
  isPop = false
): T | undefined => {
  const size = set.size;
  if (size === 0) return undefined;

  let i = 0;
  let value: T | undefined;

  const randomIndex = Math.floor(Math.random() * size);
  for (const item of set) {
    if (i === randomIndex) {
      value = item;
      break;
    }
    i++;
  }

  if (isPop && value !== undefined) set.delete(value);

  return value;
};

export const randomFromList = <T,>(list: readonly T[]): T | undefined => {
  if (list.length === 0) return undefined;
  
  return list[Math.floor(Math.random() * list.length)];
};
