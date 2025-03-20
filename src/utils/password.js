const bcrypt = require("bcryptjs");

exports.hashPassword = async (password) => {
  const hash = await bcrypt.hash(password, 10);
  return hash;
};

exports.comparePassword = async (password, hash) => {
  if (!password || !hash) {
    throw new Error("Password or hash is missing");
  }
  const matchPass = await bcrypt.compare(password, hash);
  return matchPass;
};

exports.generateRandomPassword = () => {
  return Math.random().toString(36).slice(-8);
};
