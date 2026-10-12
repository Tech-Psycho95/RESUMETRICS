import assert from 'node:assert/strict'
import { writeWorkspaceSnapshot, readWorkspaceSnapshot, restored, clearWorkspaceSnapshot } from '../src/workspace/workspacePersistence.js'

// Mock sessionStorage for Node.js environment
const sessionStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} }
  }
})()
global.sessionStorage = sessionStorageMock

// Test: cloud field is included in workspace snapshot
clearWorkspaceSnapshot()
sessionStorageMock.clear()

const stateWithResumeId = {
  workspaceMode: 'editor-ready',
  resumeData: { fullName: 'Test User', email: 'test@example.com' },
  selectedTemplateId: 'modern',
  resumeName: 'My Resume',
  cloud: { id: 'test-resume-id-123', revision: 3, savedHash: 'h' }
}

writeWorkspaceSnapshot(stateWithResumeId)
const restored1 = readWorkspaceSnapshot()
assert.deepEqual(restored1.cloud, { id: 'test-resume-id-123', revision: 3, savedHash: 'h' }, 'cloud should be preserved in snapshot')
assert.equal(restored1.workspaceMode, 'editor-ready')
assert.equal(restored1.resumeName, 'My Resume')

// Test: cloud can be null
clearWorkspaceSnapshot()
sessionStorageMock.clear()

const stateWithNullResumeId = {
  workspaceMode: 'editor-ready',
  resumeData: { fullName: 'Test User' },
  cloud: null
}

writeWorkspaceSnapshot(stateWithNullResumeId)
const restored2 = readWorkspaceSnapshot()
assert.equal(restored2.cloud, null, 'null cloud should be preserved')

// Test: a snapshot written before the cloud pointer existed has no cloud key, so restored() falls back
clearWorkspaceSnapshot()
sessionStorageMock.clear()
writeWorkspaceSnapshot({ workspaceMode: 'editor-ready', resumeData: { fullName: 'Test User' } })
assert.equal(restored('cloud', null), null, 'a missing cloud key should fall back to the default')

// Test: restored() helper works with cloud
clearWorkspaceSnapshot()
sessionStorageMock.clear()

writeWorkspaceSnapshot({ cloud: 'stored-id', workspaceMode: 'initial' })
assert.equal(restored('cloud', null), 'stored-id', 'restored() should return stored cloud')
assert.equal(restored('cloud', 'fallback'), 'stored-id', 'restored() should prefer stored value over fallback')

clearWorkspaceSnapshot()
sessionStorageMock.clear()
assert.equal(restored('cloud', 'fallback-id'), 'fallback-id', 'restored() should return fallback when no snapshot exists')

// Test: cloud survives photo dropping
clearWorkspaceSnapshot()
sessionStorageMock.clear()

const largePhoto = 'data:image/png;base64,' + 'A'.repeat(2_000_000)
const stateWithLargePhoto = {
  workspaceMode: 'editor-ready',
  resumeData: { fullName: 'Test User' },
  resumePresentation: {
    photo: {
      source: largePhoto,
      originalSource: largePhoto,
      uploaded: true
    }
  },
  cloud: 'photo-test-id'
}

const result = writeWorkspaceSnapshot(stateWithLargePhoto)
assert.equal(result.photoDropped, true, 'photo should be dropped when too large')

const restored4 = readWorkspaceSnapshot()
assert.equal(restored4.cloud, 'photo-test-id', 'cloud should survive photo dropping')
assert.equal(restored4.resumePresentation?.photo?.source, undefined, 'photo source should be dropped')
assert.equal(restored4.workspaceMode, 'editor-ready', 'other fields should remain intact')

console.log('✓ All workspacePersistence tests passed')
