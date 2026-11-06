const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skelbot-spawners-'))
process.env.SKELBOT_DATA_DIR = dataDir

const { addPlacedSpawners, clearPlacedSpawners, placedSpawners, stacksForSpawners } = require('./spawner-count')

test('spawners take one slot per 64', () => {
  assert.equal(stacksForSpawners(30), 1)
  assert.equal(stacksForSpawners(64), 1)
  assert.equal(stacksForSpawners(65), 2)
  assert.equal(stacksForSpawners(200), 4)
})

test('always keeps at least one slot', () => {
  assert.equal(stacksForSpawners(0), 1)
})

test('counts placed spawners and saves them', () => {
  clearPlacedSpawners()
  addPlacedSpawners(30)
  addPlacedSpawners(40)

  assert.equal(placedSpawners(), 70)
  assert.equal(JSON.parse(fs.readFileSync(path.join(dataDir, 'spawners.json'), 'utf8')).placed, 70)
})

test('ignores a placement that added nothing', () => {
  clearPlacedSpawners()
  addPlacedSpawners(0)
  assert.equal(placedSpawners(), 0)
})

test('picking up resets the count', () => {
  addPlacedSpawners(30)
  clearPlacedSpawners()
  assert.equal(placedSpawners(), 0)
})
