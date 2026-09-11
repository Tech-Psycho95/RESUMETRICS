import { Router } from 'express'
import { env, GitHubConfigurationError } from '../config/env.js'
import { requireFirebaseUser, FirebaseServerConfigurationError } from '../services/firebaseAdmin.js'
import { getGitHubAuthorizationIdentity, getGitHubInstallationUrl, getGitHubUserForAuthorizationCode, getInstallationProfile, getUserRepositories } from '../services/githubApp.js'
import { getGitHubConnection, removeGitHubConnection, saveGitHubConnection } from '../services/githubConnectionStore.js'
import { analyzeResumeWithGitHubEvidence } from '../services/githubEvidence.js'
import { consumeGitHubConnectionState, createGitHubConnectionState, getGitHubConnectionState, githubConnectionStateTtlMs } from '../services/githubState.js'

const router = Router()

function publicConfigurationMessage() {
  return 'GitHub connection is not configured on the server yet. Add the required GitHub and Firebase Admin values to server/.env.local.'
}

function isConfigurationError(error) {
  return error instanceof GitHubConfigurationError || error instanceof FirebaseServerConfigurationError
}

function isFirestoreUnavailable(error) {
  const message = String(error?.message ?? '')
  return Number(error?.code) === 7 && /cloud firestore api|firestore.*(?:disabled|not been used)/i.test(message)
}

function isMissingGitHubInstallation(error) {
  return Number(error?.status) === 404
}

function publicPersistenceMessage() {
  return 'GitHub could not be saved because Cloud Firestore is not enabled for Resumetrics yet. Create a Cloud Firestore database in Firebase Console, then try again.'
}

const connectionStateCookie = 'resumetrics_github_connection_state'

function readCookie(request, name) {
  const header = request.get('cookie') ?? ''
  const cookie = header.split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`))
  if (!cookie) return ''
  try {
    return decodeURIComponent(cookie.slice(name.length + 1))
  } catch {
    return ''
  }
}

function storeConnectionStateCookie(response, state) {
  response.cookie(connectionStateCookie, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.github.frontendUrl.startsWith('https://'),
    maxAge: githubConnectionStateTtlMs,
    path: '/'
  })
}

function clearConnectionStateCookie(response) {
  response.clearCookie(connectionStateCookie, { path: '/' })
}

function redirectToWorkspace(response, outcome, parameters = {}) {
  try {
    const url = new URL('/workspace', env.github.frontendUrl)
    url.searchParams.set('github', outcome)
    Object.entries(parameters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
    })
    return response.redirect(302, url.toString())
  } catch {
    return response.status(500).send('GitHub connection could not return to Resumetrics. Check FRONTEND_URL in server/.env.local.')
  }
}

function selectAuthorizedInstallation(installationId, authorizationIdentity) {
  const accessibleInstallationIds = authorizationIdentity.installationIds ?? []
  if (typeof installationId === 'string' && /^\d+$/.test(installationId)) {
    if (!accessibleInstallationIds.includes(installationId)) {
      throw new Error('The authorized GitHub user cannot access this installation.')
    }
    return installationId
  }
  if (accessibleInstallationIds.length === 1) return accessibleInstallationIds[0]
  if (!accessibleInstallationIds.length) throw new Error('No accessible Resumetrics GitHub App installation was found. Install the App, then try again.')
  throw new Error('More than one GitHub App installation is available. Choose one installation in GitHub, then try connecting again.')
}

router.get('/connect', requireFirebaseUser, (request, response) => {
  try {
    const state = createGitHubConnectionState(request.firebaseUser.uid)
    storeConnectionStateCookie(response, state)
    return response.json({ ok: true, authorizationUrl: getGitHubInstallationUrl(state) })
  } catch (error) {
    console.error('GitHub connection start failed:', error?.message)
    const message = isConfigurationError(error) ? publicConfigurationMessage() : 'Could not start the GitHub connection. Please try again.'
    return response.status(isConfigurationError(error) ? 503 : 502).json({ ok: false, error: message })
  }
})

router.get('/callback', async (request, response) => {
  const { state, installation_id: installationId, code, error } = request.query
  // A GitHub App Setup URL supplies installation_id but no OAuth code. Redirect
  // it to the workspace, where the signed-in Firebase user completes the secure
  // association using the HTTP-only state cookie set by /connect.
  if (!error && !code && typeof installationId === 'string') {
    return redirectToWorkspace(response, 'installation-pending', { installation_id: installationId })
  }

  const pendingConnection = consumeGitHubConnectionState(state)

  if (!pendingConnection) return redirectToWorkspace(response, 'invalid-state')
  if (error || !installationId || typeof installationId !== 'string' || !code || typeof code !== 'string') return redirectToWorkspace(response, 'cancelled')

  try {
    const githubUser = await getGitHubUserForAuthorizationCode(code, installationId)
    // The App-authenticated request confirms the installation belongs to
    // Resumetrics-evidence before anything is associated with a Firebase UID.
    const installation = await getInstallationProfile(installationId)
    await saveGitHubConnection(pendingConnection.firebaseUid, { ...installation, ...githubUser })
    clearConnectionStateCookie(response)
    return redirectToWorkspace(response, 'connected')
  } catch (error) {
    console.error('GitHub installation callback failed:', error?.status ?? error?.message)
    return redirectToWorkspace(response, isConfigurationError(error)
      ? 'configuration-error'
      : isFirestoreUnavailable(error)
        ? 'storage-unavailable'
        : 'connection-failed')
  }
})

router.post('/complete-installation', requireFirebaseUser, async (request, response) => {
  const { installationId } = request.body ?? {}
  const state = readCookie(request, connectionStateCookie)
  const pendingConnection = getGitHubConnectionState(state)

  if (!pendingConnection || pendingConnection.firebaseUid !== request.firebaseUser.uid) {
    return response.status(400).json({ ok: false, error: 'This GitHub connection link expired. Start the connection again from Resumetrics.' })
  }
  if (typeof installationId !== 'string' || !/^\d+$/.test(installationId)) {
    return response.status(400).json({ ok: false, error: 'GitHub did not return a valid installation.' })
  }

  try {
    const installation = await getInstallationProfile(installationId)
    await saveGitHubConnection(request.firebaseUser.uid, installation)
    consumeGitHubConnectionState(state)
    clearConnectionStateCookie(response)
    return response.json({ ok: true, connection: { connected: true, githubLogin: installation.login, githubAvatarUrl: installation.avatarUrl } })
  } catch (error) {
    console.error('GitHub setup completion failed:', error?.status ?? error?.message)
    const message = isConfigurationError(error)
      ? publicConfigurationMessage()
      : isFirestoreUnavailable(error)
        ? publicPersistenceMessage()
      : 'GitHub could not be connected. Check the installed repository permissions and try again.'
    return response.status(isConfigurationError(error) ? 503 : 502).json({ ok: false, error: message })
  }
})

// GitHub's OAuth-on-install flow can return directly to the frontend. The
// frontend forwards the one-time code here so verification and token exchange
// remain server-side. This also connects an App that was installed earlier.
router.post('/complete-authorization', requireFirebaseUser, async (request, response) => {
  const { code, state, installationId } = request.body ?? {}
  const cookieState = readCookie(request, connectionStateCookie)
  const connectionState = typeof state === 'string' && state === cookieState ? state : ''
  const pendingConnection = getGitHubConnectionState(connectionState)

  if (!pendingConnection || pendingConnection.firebaseUid !== request.firebaseUser.uid) {
    return response.status(400).json({ ok: false, error: 'This GitHub connection link expired. Start the connection again from Resumetrics.' })
  }
  if (typeof code !== 'string' || !code.trim() || code.length > 500) {
    return response.status(400).json({ ok: false, error: 'GitHub did not return a valid authorization code.' })
  }

  try {
    const githubUser = await getGitHubAuthorizationIdentity(code)
    const authorizedInstallationId = selectAuthorizedInstallation(installationId, githubUser)
    const installation = await getInstallationProfile(authorizedInstallationId)
    const connection = await saveGitHubConnection(request.firebaseUser.uid, { ...installation, ...githubUser })
    consumeGitHubConnectionState(connectionState)
    clearConnectionStateCookie(response)
    return response.json({ ok: true, connection })
  } catch (error) {
    console.error('GitHub authorization completion failed:', error?.status ?? error?.message)
    const message = isConfigurationError(error)
      ? publicConfigurationMessage()
      : isFirestoreUnavailable(error)
        ? publicPersistenceMessage()
        : error instanceof Error && error.message
          ? error.message
          : 'GitHub could not be connected. Please try again.'
    return response.status(isConfigurationError(error) || isFirestoreUnavailable(error) ? 503 : 502).json({ ok: false, error: message })
  }
})

router.get('/status', requireFirebaseUser, async (request, response) => {
  try {
    const connection = await getGitHubConnection(request.firebaseUser.uid)
    if (!connection.connected) return response.json({ ok: true, connection })

    try {
      await getInstallationProfile(connection.githubInstallationId)
    } catch (error) {
      if (!isMissingGitHubInstallation(error)) throw error
      await removeGitHubConnection(request.firebaseUser.uid)
      return response.json({
        ok: true,
        connection: {
          connected: false,
          message: 'The GitHub App is no longer installed. Connect it again to restore repository evidence.'
        }
      })
    }
    return response.json({ ok: true, connection })
  } catch (error) {
    console.error('GitHub connection status failed:', error?.message)
    const message = isConfigurationError(error)
      ? publicConfigurationMessage()
      : isFirestoreUnavailable(error)
        ? publicPersistenceMessage()
        : 'Could not check the GitHub connection right now.'
    return response.status(isConfigurationError(error) || isFirestoreUnavailable(error) ? 503 : 502).json({ ok: false, error: message })
  }
})

router.get('/repos', requireFirebaseUser, async (request, response) => {
  try {
    const connection = await getGitHubConnection(request.firebaseUser.uid)
    if (!connection.connected) return response.status(409).json({ ok: false, error: 'Connect GitHub before loading repositories.' })
    const repositories = await getUserRepositories(connection.githubInstallationId)
    return response.json({ ok: true, repositories })
  } catch (error) {
    console.error('GitHub repository request failed:', error?.status ?? error?.message)
    const message = isConfigurationError(error)
      ? publicConfigurationMessage()
      : 'Could not load GitHub repositories. Check that the app still has repository access and try again.'
    return response.status(isConfigurationError(error) ? 503 : 502).json({ ok: false, error: message })
  }
})

router.post('/evidence-analysis', requireFirebaseUser, async (request, response) => {
  const { resumeData } = request.body ?? {}
  if (!resumeData || typeof resumeData !== 'object' || Array.isArray(resumeData)) {
    return response.status(400).json({ ok: false, error: 'A structured resume is required before GitHub evidence can be analysed.' })
  }

  try {
    const connection = await getGitHubConnection(request.firebaseUser.uid)
    if (!connection.connected) return response.status(409).json({ ok: false, error: 'Connect GitHub before starting evidence analysis.' })
    const analysis = await analyzeResumeWithGitHubEvidence({
      installationId: connection.githubInstallationId,
      resumeData
    })
    return response.json({ ok: true, analysis })
  } catch (error) {
    console.error('GitHub evidence analysis failed:', error?.status ?? error?.message)
    if (isConfigurationError(error)) return response.status(503).json({ ok: false, error: publicConfigurationMessage() })
    if (error instanceof TypeError) return response.status(400).json({ ok: false, error: error.message })
    return response.status(502).json({ ok: false, error: 'Could not analyse GitHub evidence. Check the app repository permissions and try again.' })
  }
})

router.delete('/disconnect', requireFirebaseUser, async (request, response) => {
  try {
    await removeGitHubConnection(request.firebaseUser.uid)
    return response.json({ ok: true, message: 'GitHub has been disconnected from Resumetrics. The GitHub App remains installed until you uninstall it in GitHub.' })
  } catch (error) {
    console.error('GitHub disconnect failed:', error?.message)
    const message = isConfigurationError(error)
      ? publicConfigurationMessage()
      : isFirestoreUnavailable(error)
        ? publicPersistenceMessage()
        : 'Could not disconnect GitHub right now.'
    return response.status(isConfigurationError(error) || isFirestoreUnavailable(error) ? 503 : 502).json({ ok: false, error: message })
  }
})

export default router
