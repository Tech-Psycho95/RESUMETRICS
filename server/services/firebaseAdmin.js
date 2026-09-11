import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { env } from '../config/env.js'

export class FirebaseServerConfigurationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'FirebaseServerConfigurationError'
  }
}

let firebaseAdminApp

export function initializeFirebaseAdmin() {
  if (firebaseAdminApp) return firebaseAdminApp
  if (!env.firebase.serviceAccountPath) {
    throw new FirebaseServerConfigurationError(
      'Firebase service account configuration is missing or invalid. Set FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS in server/.env.local.'
    )
  }

  const serviceAccountPath = resolve(env.firebase.serviceAccountPath)
  if (!existsSync(serviceAccountPath)) {
    throw new FirebaseServerConfigurationError('The Firebase service account file could not be found.')
  }

  let serviceAccount
  try {
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))
  } catch {
    throw new FirebaseServerConfigurationError('The Firebase service account file is not valid JSON.')
  }

  firebaseAdminApp = getApps().length
    ? getApps()[0]
    : initializeApp({ credential: cert(serviceAccount) })
  return firebaseAdminApp
}

export async function verifyFirebaseIdToken(idToken) {
  return getAuth(initializeFirebaseAdmin()).verifyIdToken(idToken)
}

export function getConnectionStore() {
  return getFirestore(initializeFirebaseAdmin())
}

export async function requireFirebaseUser(request, response, next) {
  const authorization = request.get('authorization') ?? ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  if (!match) return response.status(401).json({ ok: false, error: 'Sign in to Resumetrics before connecting GitHub.' })

  try {
    request.firebaseUser = await verifyFirebaseIdToken(match[1])
    return next()
  } catch (error) {
    if (error instanceof FirebaseServerConfigurationError) {
      console.error('Firebase Admin configuration error:', error.message)
      return response.status(503).json({ ok: false, error: 'GitHub connection is not configured on the server yet.' })
    }
    console.error('Firebase token verification failed:', error?.code ?? error?.message)
    return response.status(401).json({ ok: false, error: 'Your Resumetrics session could not be verified. Please sign in again.' })
  }
}
