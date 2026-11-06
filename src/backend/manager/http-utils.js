const { InputError } = require('./errors')

const MAX_BODY_BYTES = 10 * 1024

function send (res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}

function readBody (req) {
  return new Promise((resolve, reject) => {
    if (!String(req.headers['content-type']).startsWith('application/json')) {
      return reject(new InputError('Expected a JSON body.'))
    }

    let size = 0
    const chunks = []

    req.on('data', chunk => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new InputError('Body too large.'))
        req.destroy()
      } else {
        chunks.push(chunk)
      }
    })

    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {})
      } catch {
        reject(new InputError('Body is not valid JSON.'))
      }
    })

    req.on('error', reject)
  })
}

module.exports = { send, readBody }
