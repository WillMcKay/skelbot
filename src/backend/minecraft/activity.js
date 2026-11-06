let tail = Promise.resolve()

function runExclusive (task) {
  const run = tail.then(task, task)
  tail = run.catch(() => {})
  return run
}

module.exports = { runExclusive }
