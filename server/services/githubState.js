import { randomBytes } from 'node:crypto'

const stateTtlMs = 10 * 60 * 1000
const pendingStates = new Map()

export const githubConnectionStateTtlMs = stateTtlMs

function clearExpiredStates() {
  const expiresBefore = Date.now() - stateTtlMs
  for (const [state, value] of pendingStates.entries()) {
    if (value.createdAt < expiresBefore) pendingStates.delete(state)
  }
}

export function createGitHubConnectionState(firebaseUid) {
  clearExpiredStates()
  const state = randomBytes(32).toString('base64url')
  pendingStates.set(state, { firebaseUid, createdAt: Date.now() })
  return state
}

export function getGitHubConnectionState(state) {
  if (typeof state !== 'string' || state.length < 32) return null
  clearExpiredStates()
  return pendingStates.get(state) ?? null
}

export function consumeGitHubConnectionState(state) {
  const pending = getGitHubConnectionState(state)
  pendingStates.delete(state)
  return pending ?? null
}
