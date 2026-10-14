// Gives accounts lifetime Pro without a payment (developers, testers). Run from the repo root:
//   node scripts/grant-pro.mjs someone@example.com other@example.com
//   node scripts/grant-pro.mjs --revoke someone@example.com
// An email with no account yet is kept in planGrants/{email} and applied at its first sign-in (server/db/userStore.js).
import { getAuth } from 'firebase-admin/auth'
import { getConnectionStore, initializeFirebaseAdmin } from '../server/services/firebaseAdmin.js'

const args = process.argv.slice(2)
const revoke = args.includes('--revoke')
const emails = args.filter(arg => !arg.startsWith('--'))
if (!emails.length) {
  console.error('Usage: node scripts/grant-pro.mjs [--revoke] email [email...]')
  process.exit(1)
}

const auth = getAuth(initializeFirebaseAdmin())
const db = getConnectionStore()
let failed = 0
for (const email of emails) {
  const plan = revoke
    ? { tier: 'free', status: 'active' }
    : { tier: 'pro', status: 'active', term: 'lifetime', source: 'developer', grantedAt: new Date().toISOString() }
  const grantRef = db.collection('planGrants').doc(email.toLowerCase())
  try {
    const user = await auth.getUserByEmail(email)
    await db.collection('users').doc(user.uid).set({ plan }, { merge: true })
    console.log(`${revoke ? 'Revoked Pro for' : 'Granted lifetime Pro to'} ${email} (${user.uid})`)
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      failed += 1
      console.error(`${email}: ${error.message}`)
      continue
    }
    console.log(revoke ? `${email}: no account yet` : `${email}: no account yet — Pro is waiting and applies at the first sign-in`)
  }
  await (revoke ? grantRef.delete() : grantRef.set({ plan }))
}
process.exit(failed ? 1 : 0)
