// A saved GitHub scan (GET /api/user/resumes/:id/evidence → { github }) as the scan state the evidence screen
// already knows how to show, so opening a resume brings its last report straight back.
export function scanFromEvidence(github) {
  if (!github) return null
  const scannedAt = github.scannedAt ?? null
  const scanned = Number(github.scanned) || (github.repositories?.length ?? 0)
  return {
    status: 'done',
    done: scanned,
    total: scanned,
    percent: 100,
    current: null,
    repos: github.repositories ?? [],
    resumeSkills: github.resumeSkills ?? [],
    accessible: github.accessible ?? scanned,
    cap: github.cap || undefined,
    summary: github.summary ?? '',
    errors: [],
    startedAt: Date.parse(scannedAt) || Date.now(),
    scannedAt
  }
}
