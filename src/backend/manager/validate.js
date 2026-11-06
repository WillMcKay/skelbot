const { InputError } = require('./errors')

function cleanText (value, label, { required = false, max = 64 } = {}) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (required && !text) throw new InputError(`${label} is required.`)
  if (text.length > max || /[\x00-\x1f]/.test(text)) throw new InputError(`${label} is not valid.`)
  return text
}

module.exports = { cleanText }
