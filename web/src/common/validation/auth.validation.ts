export const validateEmail = (email: string): string => {
  let errorMessage: string = "";

  // Email validation
  if (!email) {
    errorMessage = "Email is required.";
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    errorMessage = "Please enter a valid email address.";
  }

  return errorMessage;
};

export const validatePassword = (password: string): string => {
  let errorMessage: string = "";

  // Password validation
  if (!password) {
    errorMessage = "Password is required.";
  } else if (password.length < 6) {
    errorMessage = "Password must be at least 6 characters long.";
  } else if (password.length > 16) {
    errorMessage = "Password cannot be longer than 16 characters.";
  }

  return errorMessage;
};

export const validateOTP = (otp: string): string => {
  let errorMessage: string = "";

  // Password validation
  if (!otp) {
    errorMessage = "OTP code is required.";
  } else if (otp.length !== 4) {
    errorMessage = "Invalid OTP code.";
  }

  return errorMessage;
};
