function payableAmount (balance, { minBalance = 0, keep = 0 } = {}) {
  if (balance < minBalance) return 0
  return Math.max(0, Math.floor(balance - keep))
}

module.exports = { payableAmount }
