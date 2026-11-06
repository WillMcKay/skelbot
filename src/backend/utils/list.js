function pushLimited (list, item, limit) {
  list.push(item)
  if (list.length > limit) list.splice(0, list.length - limit)
}

module.exports = { pushLimited }
