// The dashboard's list of saved resumes, kept for the sidebar's "Recent resumes". Per user: after sign-out
// and sign-in as someone else it reads empty until that user's dashboard loads. Memory only.
const EMPTY = Object.freeze([])
let entry = { uid: null, projects: EMPTY }
const listeners = new Set()

export function setCachedProjects(uid, projects) {
  entry = { uid, projects }
  listeners.forEach(listener => listener())
}

export const getCachedEntry = () => entry

export function subscribeProjects(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function projectsFor(uid) {
  return uid && entry.uid === uid ? entry.projects : EMPTY
}
