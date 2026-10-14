// A headless Chrome page driven over the DevTools protocol, for the landing-page captures. No extra packages:
// Node's own fetch and WebSocket talk to Chrome's remote-debugging port.
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export async function openPage({ port = 9333, viewport, chrome = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' }) {
  const profile = mkdtempSync(join(tmpdir(), 'landing-shots-'))
  const child = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', `--window-size=${viewport.width},${viewport.height}`, 'about:blank'], { stdio: 'ignore' })
  let target
  for (let attempt = 0; attempt < 50 && !target; attempt++) {
    await sleep(200)
    target = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => response.json()).then(list => list.find(item => item.type === 'page')).catch(() => null)
  }
  if (!target) { child.kill(); throw new Error('Chrome did not start') }
  const socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject })
  let id = 0
  const pending = new Map()
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data)
    const waiting = message.id && pending.get(message.id)
    if (!waiting) return
    pending.delete(message.id)
    message.error ? waiting.reject(new Error(message.error.message)) : waiting.resolve(message.result)
  }
  const send = (method, params = {}) => new Promise((resolve, reject) => { const next = ++id; pending.set(next, { resolve, reject }); socket.send(JSON.stringify({ id: next, method, params })) })
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', { mobile: false, ...viewport })

  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression: `(async () => { ${expression} })()`, awaitPromise: true, returnByValue: true })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text)
    return result.result.value
  }
  async function waitFor(condition, label, timeout = 20_000) {
    const until = Date.now() + timeout
    while (Date.now() < until) {
      if (await evaluate(`return Boolean(${condition})`).catch(() => false)) return
      await sleep(250)
    }
    throw new Error(`Timed out waiting for ${label}`)
  }
  async function goto(url, ready, timeout = 40_000) {
    await send('Page.navigate', { url })
    await waitFor(ready, url, timeout)
    await evaluate('await document.fonts.ready')
  }
  /** WebP of the viewport, or of `clip` ({ x, y, width, height, scale }) in page coordinates. */
  async function screenshot({ clip, quality = 86 } = {}) {
    const { data } = await send('Page.captureScreenshot', { format: 'webp', quality, ...(clip ? { clip, captureBeyondViewport: true } : {}) })
    return Buffer.from(data, 'base64')
  }
  function close() {
    socket.close()
    child.kill()
    setTimeout(() => rmSync(profile, { recursive: true, force: true }), 800)
  }
  return { send, evaluate, waitFor, goto, screenshot, close }
}
