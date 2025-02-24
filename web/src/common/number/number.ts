export const parseNumberFromString = (str: string, locale = "en-US"): number => {
  if (locale === "de-DE") {
    // German format: 1.234.567,89
    str = str.replace(/[.,]/g, (match) => (match === "," ? "." : ""));
  } else if (locale === "en-US") {
    // US format: 1,234,567.89
    str = str.replace(/,/g, "");
  }

  return parseFloat(str);
};
