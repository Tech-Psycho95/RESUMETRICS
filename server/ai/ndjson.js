/**
 * Newline-delimited JSON streaming for long tasks (NIMBUS steps, GitHub scan progress, JD stages).
 * Each event is one JSON object per line. A heartbeat keeps proxies from closing idle connections.
 */
export function startNdjson(_request, response) {
  response.status(200)
  response.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
  response.setHeader('Cache-Control', 'no-cache, no-transform')
  response.setHeader('X-Accel-Buffering', 'no')
  response.flushHeaders?.()
  let closed = false
  const controller = new AbortController()
  // The request's own 'close' fires once its body is read; the response's fires on client disconnect.
  response.on('close', () => {
    if (!response.writableFinished) {
      closed = true
      controller.abort()
      clearInterval(heartbeat)
    }
  })
  const heartbeat = setInterval(() => { if (!closed) response.write('{"type":"heartbeat"}\n') }, 10_000)
  return {
    signal: controller.signal,
    get closed() { return closed },
    send(event) {
      if (closed) return false
      response.write(`${JSON.stringify(event)}\n`)
      return true
    },
    end(event) {
      clearInterval(heartbeat)
      if (closed) return
      if (event) response.write(`${JSON.stringify(event)}\n`)
      response.end()
    }
  }
}
