const crypto = require('crypto')

function newId (bytes = 4) {
  return crypto.randomBytes(bytes).toString('hex')
}

module.exports = { newId }
