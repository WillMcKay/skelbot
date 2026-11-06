const fs = require('fs')
const path = require('path')
const config = require('../config')

const COMMIT = /^[0-9a-f]{7,40}$/i

function packedRef (gitDir, ref) {
  const line = fs.readFileSync(path.join(gitDir, 'packed-refs'), 'utf8')
    .split('\n')
    .find(entry => entry.endsWith(` ${ref}`))

  return line?.split(' ')[0] ?? null
}

function resolveRef (gitDir, ref) {
  const loose = path.join(gitDir, ref)

  return fs.existsSync(loose) ? fs.readFileSync(loose, 'utf8').trim() : packedRef(gitDir, ref)
}

function gitCommit (gitDir) {
  try {
    const head = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim()

    return head.startsWith('ref: ') ? resolveRef(gitDir, head.slice('ref: '.length)) : head
  } catch {
    return null
  }
}

function buildCommit ({ deployed = process.env.SOURCE_COMMIT, gitDir = path.join(config.root, '.git') } = {}) {
  return COMMIT.test(deployed ?? '') ? deployed : gitCommit(gitDir)
}

module.exports = { buildCommit }
