export const getBaseAndQuote = (
  currencyPair: string
): { base: string; quote: string } => {
  const arr = currencyPair.split("/");
  if (arr.length !== 2) return { base: "", quote: "" };

  let base = arr[0];
  if (base === "CNH") base = "CNY";

  let quote = arr[1];
  if (quote === "CNH") quote = "CNY";

  return { base, quote };
};

export const generateCurrencyPair = (baseName: string, quoteName: string) => {
  return baseName + "/" + quoteName;
};
