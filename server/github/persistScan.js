/**
 * Passes a scan's events through unchanged and, when the final result arrives for a saved resume, keeps it as that
 * resume's GitHub evidence. The result is yielded first, so the person sees it without waiting for the database,
 * and a failed save is logged but never fails the scan.
 *
 * events:    scanGitHubEvidence(...)
 * resumeId:  the resume the scan is for, or null when it isn't saved yet (nothing is kept then)
 * store:     the evidence store (server/db/evidenceStore.js)
 */
export async function * persistScanResult(events, { uid, resumeId, store }) {
  let resumeSkills = []
  for await (const event of events) {
    if (event.type === 'start') resumeSkills = event.resumeSkills ?? []
    yield event
    if (event.type === 'result' && resumeId) {
      try {
        await store.saveGitHubEvidence(uid, resumeId, { result: event, resumeSkills })
      } catch (error) {
        console.error('Could not keep the GitHub evidence:', error?.code ?? error?.message)
      }
    }
  }
}
