import { auth } from '../firebase.js'

/**
 * `Authorization: Bearer <Firebase ID token>` for the signed-in person, or no header when signed out
 * (browser test fixtures) or the token can't be refreshed; the server then answers 401 with a sign-in message.
 * getIdToken() refreshes an expired token by itself.
 */
export async function authHeaders() {
  try {
    const token = await auth?.currentUser?.getIdToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}
