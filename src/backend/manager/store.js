const path = require('path')
const config = require('../config')
const { readJson, writeJson } = require('../utils/json-file')

const FILE = path.join(config.dataDir, 'bots.json')

function botDataDir (id) {
  return path.join(config.dataDir, 'bots', id)
}

function loadBots () {
  return readJson(FILE)?.bots ?? []
}

function saveBots (bots) {
  writeJson(FILE, { bots })
}

module.exports = { loadBots, saveBots, botDataDir }
