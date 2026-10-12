/** A failed save/load. `kind` tells the autosave what to do: network, auth, conflict, not_found, too_large, invalid, busy, server. */
export class SaveError extends Error {
  constructor(kind, message, extra = {}) {
    super(message)
    this.name = 'SaveError'
    this.kind = kind
    Object.assign(this, extra)
  }
}

/** Which kind of SaveError an HTTP failure is. `code` is the server's own error code when it sent one. */
export const saveErrorKind = (status, code) => {
  if (code === 'conflict' || status === 409) return 'conflict'
  if (code === 'not_found' || status === 404) return 'not_found'
  if (code === 'too_large' || status === 413) return 'too_large'
  if (status === 401 || status === 403) return 'auth'
  if (status === 429) return 'busy'
  if (status === 400) return 'invalid'
  return 'server'
}
