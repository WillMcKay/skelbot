const path = require('path')
const minecraftFolderPath = require('minecraft-folder-path')
const { Authflow, Titles } = require('prismarine-auth')
const { sendToManager } = require('../ipc')

const CACHE_DIR = path.join(minecraftFolderPath, 'nmp-cache')
const UNAUTHORIZED = 401
const NOT_FOUND = 404
const MAX_REASON_LENGTH = 200
const LOGIN_RETRY_BASE_MS = 15000
const LOGIN_RETRY_MAX_MS = 5 * 60 * 1000

const knownProfiles = new Map()

function showSignInCode ({ user_code: code, verification_uri: url, message }) {
  console.log(`[MC AUTH] ${message}`)
  sendToManager('auth', { code, url })
}

function microsoftAuthflow (account, onCode) {
  return new Authflow(account, CACHE_DIR, {
    authTitle: Titles.MinecraftNintendoSwitch,
    deviceType: 'Nintendo',
    flow: 'live'
  }, onCode)
}

function statusOf (err) {
  return Number(err.message.match(/^(\d{3}) /)?.[1])
}

function loginRetryDelay (failures) {
  return Math.min(LOGIN_RETRY_BASE_MS * 2 ** (failures - 1), LOGIN_RETRY_MAX_MS)
}

async function readProfile (flow, token) {
  try {
    return { token, profile: await flow.mca.fetchProfile(token) }
  } catch (err) {
    if (statusOf(err) !== UNAUTHORIZED) throw err
  }

  flow.mca.forceRefresh = true
  const refreshed = await flow.getMinecraftJavaToken()

  return { token: refreshed.token, profile: await flow.mca.fetchProfile(refreshed.token) }
}

function session (token, profile) {
  return { accessToken: token, username: profile.name, uuid: profile.id }
}

async function loginMicrosoft (account, flow = microsoftAuthflow(account, showSignInCode)) {
  const { token } = await flow.getMinecraftJavaToken()
  sendToManager('auth', { code: null, url: null })

  try {
    const fresh = await readProfile(flow, token)
    knownProfiles.set(account, fresh.profile)
    return session(fresh.token, fresh.profile)
  } catch (err) {
    const status = statusOf(err)
    const reason = err.message.slice(0, MAX_REASON_LENGTH)

    if (status === NOT_FOUND) throw new Error(`No Minecraft profile for ${account}. Does the account own Minecraft?`)

    const known = knownProfiles.get(account)
    if (!known || status === UNAUTHORIZED) throw new Error(`Could not read the Minecraft profile for ${account}: ${reason}`)

    console.log(`[MC AUTH] Profile lookup failed (${reason}); using the last known profile.`)
    return session(token, known)
  }
}

module.exports = { loginMicrosoft, loginRetryDelay, microsoftAuthflow }
