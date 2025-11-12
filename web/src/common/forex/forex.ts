export const getBaseAndQuote = (
  currencyPair: string
): { base: string; quote: string; isCommodity: boolean } => {
  const arr = currencyPair.split("/");
  if (arr.length !== 2) return { base: "", quote: "", isCommodity: false };

  let base = arr[0];
  if (base === "CNH") base = "CNY";

  let isCommodity = false;
  if (base.startsWith("X")) isCommodity = true;

  let quote = arr[1];
  if (quote === "CNH") quote = "CNY";

  return { base, quote, isCommodity };
};

export const generateCurrencyPair = (baseName: string, quoteName: string) => {
  return baseName + "/" + quoteName;
};
