const fs = require('fs')
const path = require('path')

function readJson (file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (err) {
    if (err.code === 'ENOENT') return null
    throw new Error(`Could not read ${file}: ${err.message}`)
  }
}

function writeJson (file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(`${file}.tmp`, JSON.stringify(data, null, 2))
  fs.renameSync(`${file}.tmp`, file)
}

module.exports = { readJson, writeJson }
