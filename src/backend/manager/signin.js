const { microsoftAuthflow } = require('../minecraft/auth')
const { newId } = require('../utils/id')
const { InputError } = require('./errors')

const KEEP_MS = 15 * 60 * 1000

class SignIns {
  constructor (bots) {
    this.bots = bots
    this.sessions = new Map()
  }

  start () {
    const id = newId(8)
    const session = { id, key: `skelbot-${id}`, status: 'waiting', code: null, url: null, username: null, uuid: null, error: null }
    this.sessions.set(id, session)

    const flow = microsoftAuthflow(session.key, ({ user_code: code, verification_uri: url }) => {
      Object.assign(session, { status: 'code', code, url })
    })

    flow.getMinecraftJavaToken({ fetchProfile: true })
      .then(({ profile }) => {
        if (!profile || profile.error) throw new Error('That Microsoft account does not own Minecraft: Java Edition.')

        const taken = this.bots.botUsing({ uuid: profile.id, username: profile.name })
        if (taken) throw new Error(`${taken} is already a bot. Sign in with a different account.`)

        Object.assign(session, { status: 'done', code: null, url: null, username: profile.name, uuid: profile.id })
      })
      .catch(err => {
        Object.assign(session, { status: 'error', code: null, url: null, error: err.message || 'Sign-in failed.' })
      })

    setTimeout(() => this.sessions.delete(id), KEEP_MS).unref()
    return view(session)
  }

  get (id) {
    const session = this.sessions.get(String(id))
    return session ? view(session) : null
  }

  login (id) {
    const session = this.sessions.get(String(id))
    if (!session || session.status !== 'done') throw new InputError('Sign in with Microsoft first.')
    return { key: session.key, username: session.username, uuid: session.uuid }
  }

  forget (id) {
    this.sessions.delete(String(id))
  }
}

function view ({ id, status, code, url, username, error }) {
  return { id, status, code, url, username, error }
}

module.exports = { SignIns }
