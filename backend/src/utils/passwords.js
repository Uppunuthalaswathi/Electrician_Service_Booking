const MIN_PASSWORD_LENGTH = 8;

function validatePasswordStrength(password) {
  const normalizedPassword = String(password || "");

  if (normalizedPassword.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
  }

  return "";
}

module.exports = {
  MIN_PASSWORD_LENGTH,
  validatePasswordStrength,
};
