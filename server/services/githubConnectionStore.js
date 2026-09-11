import { Timestamp } from 'firebase-admin/firestore'
import { getConnectionStore } from './firebaseAdmin.js'

const collectionName = 'githubConnections'

function toPublicConnection(data) {
  if (!data?.githubConnected || !data.githubInstallationId) return { connected: false }
  const connectedAt = data.githubConnectedAt instanceof Timestamp ? data.githubConnectedAt.toDate().toISOString() : null
  return {
    connected: true,
    githubInstallationId: String(data.githubInstallationId),
    githubLogin: data.githubLogin ?? '',
    githubAvatarUrl: data.githubAvatarUrl ?? '',
    githubConnectedAt: connectedAt
  }
}

export async function getGitHubConnection(firebaseUid) {
  const snapshot = await getConnectionStore().collection(collectionName).doc(firebaseUid).get()
  return snapshot.exists ? toPublicConnection(snapshot.data()) : { connected: false }
}

export async function saveGitHubConnection(firebaseUid, connection) {
  const record = {
    githubConnected: true,
    githubInstallationId: String(connection.installationId),
    githubLogin: connection.login,
    githubAvatarUrl: connection.avatarUrl,
    githubConnectedAt: Timestamp.now()
  }
  await getConnectionStore().collection(collectionName).doc(firebaseUid).set(record)
  return toPublicConnection(record)
}

export async function removeGitHubConnection(firebaseUid) {
  await getConnectionStore().collection(collectionName).doc(firebaseUid).delete()
}
