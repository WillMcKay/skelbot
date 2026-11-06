const fs = require('fs')
const path = require('path')
const { pushLimited } = require('../utils/list')
const { presentLine } = require('./console-filter')
const { botDataDir } = require('./store')

const MAX_ENTRIES = 500
const MAX_FILE_BYTES = 5 * 1024 * 1024
const STREAM_OF_LEVEL = { info: 'out', warn: 'warn', error: 'err' }

function openFile (file) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    if (fs.existsSync(file) && fs.statSync(file).size > MAX_FILE_BYTES) fs.renameSync(file, `${file}.1`)

    const stream = fs.createWriteStream(file, { flags: 'a' })
    stream.on('error', err => console.error(`[MANAGER] Could not write ${file}:`, err.message))
    return stream
  } catch (err) {
    console.error(`[MANAGER] Could not open ${file}:`, err.message)
    return null
  }
}

class BotLog {
  constructor (id) {
    this.file = path.join(botDataDir(id), 'console.log')
    this.entries = []
    this.stream = null
  }

  open () {
    this.close()
    this.stream = openFile(this.file)
  }

  close () {
    this.stream?.end()
    this.stream = null
  }

  clear () {
    this.entries = []
  }

  add (line, stream) {
    const at = Date.now()
    this.stream?.write(`${new Date(at).toISOString()} ${stream.padEnd(7)} ${line}\n`)

    const entry = stream === 'out' || stream === 'err' ? filtered(at, line, stream) : { at, line, stream }
    if (entry) pushLimited(this.entries, entry, MAX_ENTRIES)
    return entry
  }
}

function filtered (at, line, stream) {
  const shown = presentLine(line, stream)
  return shown && { at, line: shown.line, stream: STREAM_OF_LEVEL[shown.level] }
}

module.exports = { BotLog }
