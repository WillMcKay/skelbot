const test = require('node:test')
const assert = require('node:assert/strict')
const { loginMicrosoft, loginRetryDelay } = require('./auth')

const PROFILE = { name: 'CHRRD', id: 'abc123' }

function fakeFlow (...profileResults) {
  const flow = {
    tokensIssued: 0,
    mca: {
      forceRefresh: false,
      fetchProfile: async () => {
        const result = profileResults.shift()
        if (result instanceof Error) throw result
        return result
      }
    },
    getMinecraftJavaToken: async () => ({ token: `token-${++flow.tokensIssued}` })
  }

  return flow
}

test('a successful login returns the session for the profile', async () => {
  const account = await loginMicrosoft('ok', fakeFlow(PROFILE))
  assert.deepEqual(account, { accessToken: 'token-1', username: 'CHRRD', uuid: 'abc123' })
})

test('only a 404 is reported as not owning Minecraft', async () => {
  await assert.rejects(loginMicrosoft('unowned', fakeFlow(new Error('404 Not Found {}'))), /Does the account own Minecraft/)
})

test('a rate limit is reported as it is, not as a missing profile', async () => {
  await assert.rejects(loginMicrosoft('limited', fakeFlow(new Error('429 Too Many Requests {}'))), err => {
    assert.match(err.message, /429 Too Many Requests/)
    assert.doesNotMatch(err.message, /own Minecraft/)
    return true
  })
})

test('a rejected token is replaced once, instead of being reused until it expires', async () => {
  const flow = fakeFlow(new Error('401 Unauthorized {}'), PROFILE)
  const account = await loginMicrosoft('expired', flow)

  assert.equal(flow.mca.forceRefresh, true)
  assert.equal(account.accessToken, 'token-2')
})

test('a token that is rejected twice fails the login', async () => {
  const flow = fakeFlow(PROFILE, new Error('401 Unauthorized {}'), new Error('401 Unauthorized {}'))

  await loginMicrosoft('revoked', flow)
  await assert.rejects(loginMicrosoft('revoked', flow), /401 Unauthorized/)
})

test('the last known profile carries a reconnect through a profile outage', async () => {
  await loginMicrosoft('outage', fakeFlow(PROFILE))

  const account = await loginMicrosoft('outage', fakeFlow(new Error('503 Service Unavailable <html>')))

  assert.deepEqual(account, { accessToken: 'token-1', username: 'CHRRD', uuid: 'abc123' })
})

test('login retries back off and level out at five minutes', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map(loginRetryDelay), [15000, 30000, 60000, 120000, 240000, 300000, 300000])
})
