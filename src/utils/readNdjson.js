import { authHeaders } from './authHeaders.js'

/**
 * POST and read a newline-delimited JSON stream, calling onEvent for every event (heartbeats skipped).
 * Resolves when the stream ends; rejects on HTTP or network errors. Pass an AbortSignal to stop early.
 * Sends the signed-in person's ID token; an explicit Authorization header in `headers` wins.
 */
export async function streamNdjson(url, { body, headers = {}, signal, onEvent }) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()), ...headers },
    body: JSON.stringify(body),
    signal
  })
  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => null)
    const error = new Error(payload?.error || `Request failed (${response.status}).`)
    error.status = response.status
    throw error
  }
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done })
    let newline = buffer.indexOf('\n')
    while (newline >= 0) {
      const line = buffer.slice(0, newline).trim()
      buffer = buffer.slice(newline + 1)
      if (line) {
        const event = JSON.parse(line)
        if (event.type !== 'heartbeat') onEvent(event)
      }
      newline = buffer.indexOf('\n')
    }
    if (done) break
  }
  if (buffer.trim()) onEvent(JSON.parse(buffer))
}
