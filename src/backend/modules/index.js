const { InputError } = require('../manager/errors')
const payout = require('./payout')
const spawners = require('./spawners')
const stealth = require('./stealth')

const definitions = [spawners, payout, stealth]
const byId = new Map(definitions.map(module => [module.id, module]))
const defaultModuleIds = definitions.filter(module => module.enabledByDefault).map(module => module.id)

function normalizeModuleIds (ids) {
  if (ids === undefined) return [...defaultModuleIds]
  if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string')) {
    throw new InputError('Modules must be a list of module IDs.')
  }

  const selected = []
  for (const id of ids) {
    if (!byId.has(id)) throw new InputError(`Unknown module: ${id}.`)
    if (!selected.includes(id)) selected.push(id)
  }
  return selected
}

function activeIn (ids) {
  return ids.filter(id => byId.get(id).kind === 'active')
}

function selectModuleIds (ids) {
  const selected = normalizeModuleIds(ids)
  const active = activeIn(selected)

  if (active.length > 1) {
    const names = active.map(id => byId.get(id).name).join(' or ')
    throw new InputError(`A bot can only run one active job. Choose ${names}.`)
  }

  return selected
}

function withOneActive (ids) {
  const [kept] = activeIn(ids)
  return ids.filter(id => byId.get(id).kind !== 'active' || id === kept)
}

function moduleCatalog () {
  return definitions.map(({ id, name, description, kind, enabledByDefault }) => ({
    id,
    name,
    description,
    kind,
    enabledByDefault
  }))
}

function createRuntimes (ids, context = {}) {
  return normalizeModuleIds(ids).map(id => {
    const definition = byId.get(id)
    return { id, commands: definition.commands ?? {}, ...definition.create(context) }
  })
}

function hasCommand (name, ids) {
  return normalizeModuleIds(ids).some(id => Object.hasOwn(byId.get(id).commands ?? {}, name))
}

module.exports = { createRuntimes, hasCommand, moduleCatalog, normalizeModuleIds, selectModuleIds, withOneActive }
