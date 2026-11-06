const fs = require('fs')
const path = require('path')
const config = require('../config')

const DIST = path.join(config.root, 'src', 'frontend', 'dist')

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.json': 'application/json'
}

function serveStatic (req, res) {
  if (!fs.existsSync(DIST)) {
    res.writeHead(503, { 'content-type': 'text/plain; charset=utf-8' })
    return res.end('The UI has not been built yet. Run `npm run build`, then reload.')
  }

  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  let file = path.resolve(DIST, `.${urlPath}`)

  if (!file.startsWith(DIST + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(DIST, 'index.html')
  }

  const hashed = file.includes(`${path.sep}assets${path.sep}`)

  res.writeHead(200, {
    'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
    'cache-control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache'
  })
  fs.createReadStream(file).pipe(res)
}

module.exports = { serveStatic }
