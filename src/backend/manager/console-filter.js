const RULES = [
  [/^\[MC\] Connecting with version: (.+)$/, 'Connecting to the server (Minecraft $1)…', 'info'],
  [/^\[MC\] Bot spawned$/, 'Joined the server.', 'info'],
  [/^\[MC\] (.+ Reconnecting in .+)$/, '$1', 'warn'],
  [/^\[MC KICKED\] (.+)$/, 'Kicked: $1', 'warn'],
  [/^\[MC ERROR\] (.+)$/, 'Connection error: $1', 'error'],
  [/^\[MC AUTH\] (.+)$/, '$1', 'warn'],

  [/^\[AUTO\] Cycle started\.$/, 'Farming cycle started.', 'info'],
  [/^\[AUTO\] (Cycle finished.*|Cycle stopped\.)$/, '$1', 'info'],
  [/^\[AUTO\] (Skipped cycle: .+|Stopped taking items .+)$/, '$1', 'warn'],

  [/^\[INCOME\] \+(.+)$/, 'Earned $1.', 'info'],
  [/^\[ORDER\] (Sold .+)$/, '$1', 'info'],
  [/^\[ORDER\] (No .+ order left .+|Delivery to .+|Expected .+|Stopped moving .+|Failed to click .+|Timed out .+)$/, '$1', 'warn'],

  [/^\[PROXY\] Connected through /, 'Connecting through a proxy.', 'info'],
  [/^\[PROXY\] (None of the .+ worked; connecting directly\.)$/, '$1', 'warn'],

  [/^\[STEALTH\] Enabled/, 'Stealth is on.', 'info'],
  [/^\[STEALTH ERROR\] (.+)$/, 'Stealth watcher error: $1', 'error'],
  [/^\[TELEPORT\] (.+)$/, 'Teleport check failed: $1', 'error'],
  [/^\[SYSTEM\] Shutdown requested\.$/, 'Shutting down…', 'info']
]

const CONTINUATION = /^(\s|[}\])]|$)/

function presentLine (line, stream) {
  for (const [pattern, text, level] of RULES) {
    const match = line.match(pattern)
    if (match) return { line: match[0].replace(pattern, text), level }
  }

  if (stream !== 'err' || CONTINUATION.test(line)) return null
  return { line: line.replace(/^\[[A-Z _]+\]\s*/, ''), level: 'error' }
}

const BANNER = [
  '     _         _  _          _',
  ' ___| |__ ___ | || |__  ___ | |_',
  '(_-<| / // -_)| || \'_ \\/ _ \\|  _|',
  '/__/|_\\_\\\\___||_||_.__/\\___/ \\__|'
]

module.exports = { presentLine, BANNER }
