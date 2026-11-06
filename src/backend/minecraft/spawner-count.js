const path = require('path')
const config = require('../config')
const { readJson, writeJson } = require('../utils/json-file')

const FILE = path.join(config.dataDir, 'spawners.json')
const STACK_SIZE = 64

let placed = readJson(FILE)?.placed ?? 0

function save () {
  try {
    writeJson(FILE, { placed })
  } catch (err) {
    console.error('[SPAWNER] Could not save the count:', err.message)
  }
}

function placedSpawners () {
  return placed
}

function addPlacedSpawners (count) {
  if (count <= 0) return

  placed += count
  save()
}

function clearPlacedSpawners () {
  placed = 0
  save()
}

function stacksForSpawners (count) {
  return Math.max(1, Math.ceil(count / STACK_SIZE))
}

module.exports = { placedSpawners, addPlacedSpawners, clearPlacedSpawners, stacksForSpawners }
