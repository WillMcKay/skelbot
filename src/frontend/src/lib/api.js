const HEADERS = { 'x-skelbot': '1' }

async function request (path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? HEADERS : { ...HEADERS, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export const botsApi = {
  create: input => request('/bots', { method: 'POST', body: input }),
  update: (id, input) => request(`/bots/${id}`, { method: 'PATCH', body: input }),
  remove: id => request(`/bots/${id}`, { method: 'DELETE' }),
  start: id => request(`/bots/${id}/start`, { method: 'POST' }),
  stop: id => request(`/bots/${id}/stop`, { method: 'POST' }),
  restart: id => request(`/bots/${id}/restart`, { method: 'POST' }),
  command: (id, name) => request(`/bots/${id}/command`, { method: 'POST', body: { name } })
}

export const signInApi = {
  start: () => request('/signin', { method: 'POST' }),
  status: id => request(`/signin/${encodeURIComponent(id)}`)
}

export const webhooksApi = {
  create: input => request('/webhooks', { method: 'POST', body: input }),
  update: (id, input) => request(`/webhooks/${id}`, { method: 'PATCH', body: input }),
  remove: id => request(`/webhooks/${id}`, { method: 'DELETE' }),
  test: input => request('/webhooks/test', { method: 'POST', body: input })
}

export const proxiesApi = {
  update: input => request('/proxies', { method: 'PUT', body: input })
}

export const eventsUrl = '/api/events'
