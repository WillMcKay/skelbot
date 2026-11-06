const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { buildCommit } = require('./build-commit')

const DEPLOYED = '2c9c467423e2ab1f561a728bd7c8cc10a471a3f6'
const LOCAL = 'd9ceae93624e78136423b9a6692793bc75f0c270'
const NO_GIT = '/nonexistent/.git'

function gitDirWith (files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skelbot-git-'))

  for (const [name, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true })
    fs.writeFileSync(path.join(dir, name), content)
  }

  return dir
}

test('a deployed commit is used without any git folder', () => {
  assert.equal(buildCommit({ deployed: DEPLOYED, gitDir: NO_GIT }), DEPLOYED)
})

test('the placeholder Coolify sends when it has no commit is not shown', () => {
  assert.equal(buildCommit({ deployed: 'unknown', gitDir: NO_GIT }), null)
})

test('running from a checkout reads the current branch', () => {
  const gitDir = gitDirWith({ HEAD: 'ref: refs/heads/main\n', 'refs/heads/main': `${LOCAL}\n` })
  assert.equal(buildCommit({ deployed: '', gitDir }), LOCAL)
})

test('a branch that git has packed is found', () => {
  const gitDir = gitDirWith({ HEAD: 'ref: refs/heads/main\n', 'packed-refs': `# pack-refs\n${LOCAL} refs/heads/main\n` })
  assert.equal(buildCommit({ deployed: '', gitDir }), LOCAL)
})

test('a detached HEAD is read directly', () => {
  assert.equal(buildCommit({ deployed: '', gitDir: gitDirWith({ HEAD: `${LOCAL}\n` }) }), LOCAL)
})

test('with neither source there is no commit', () => {
  assert.equal(buildCommit({ deployed: '', gitDir: NO_GIT }), null)
})
