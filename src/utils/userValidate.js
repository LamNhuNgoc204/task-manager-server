exports.checkEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

exports.isValidString = (str) => {
  const regex = /^[\p{L}\s()]+$/u;
  return regex.test(str);
};
