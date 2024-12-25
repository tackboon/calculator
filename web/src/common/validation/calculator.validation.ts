export const ValidatePrice = (
  field: string,
  value: string,
  decimal: number
): { errorMessage: string; formattedValue: string } => {
  let errorMessage: string = "";
  let formattedValue: string = "";

  // Price validation
  if (!value) {
    errorMessage = field + " is required.";
  } else if (!/^\d+(\.\d+)?$/.test(value)) {
    errorMessage = `Please enter a valid ${field.toLowerCase()}.`;
  } else {
    formattedValue = parseFloat(value).toFixed(decimal);
  }

  return { errorMessage, formattedValue };
};
