// The part of the editor state that is saved to the cloud, and how to turn it back into editor state.
// Mirrors server/db/resumeStore.js validateResumeFields: image bytes stay local, everything else is JSON.

const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const isDataUrl = value => typeof value === 'string' && value.startsWith('data:')

/** JSON with sorted keys and no `undefined`, so the same content always gives the same string (Firestore reorders map keys). */
export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(item => stableStringify(item === undefined ? null : item)).join(',')}]`
  if (isPlainObject(value)) {
    return `{${Object.keys(value).filter(key => value[key] !== undefined).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}

export const hashFields = fields => stableStringify(fields)

/** Photos are base64 data URLs; they are not saved yet (see the storage decision), so they are left out here. */
export function presentationWithoutImageBytes(presentation) {
  if (!isPlainObject(presentation)) return {}
  const photo = presentation.photo
  if (!isPlainObject(photo) || !(isDataUrl(photo.source) || isDataUrl(photo.originalSource))) return presentation
  return { ...presentation, photo: { ...photo, source: isDataUrl(photo.source) ? undefined : photo.source, originalSource: isDataUrl(photo.originalSource) ? undefined : photo.originalSource, uploaded: false } }
}

/** The saved shape of the current draft. */
export function buildResumeFields({ resumeName, selectedTemplateId, resumeData, resumePresentation, fontColor, fontFamily, globalFontSize, useGlobalTextColor, footerText, confirmedSections, uploadedFileName, parseMetadata }) {
  return {
    name: resumeName || 'Untitled resume',
    templateId: selectedTemplateId ?? null,
    data: resumeData,
    presentation: {
      ...presentationWithoutImageBytes(resumePresentation),
      style: { fontColor, fontFamily: fontFamily ?? null, globalFontSize: globalFontSize ?? null, useGlobalTextColor: Boolean(useGlobalTextColor), footerText: footerText ?? '' }
    },
    confirmedSections: confirmedSections ?? null,
    sourceFileName: uploadedFileName || '',
    parseMetadata: parseMetadata ?? null
  }
}

/** Splits a saved `presentation` back into the editor's resumePresentation and its separate style states. */
export function splitSavedPresentation(saved) {
  const { style = {}, ...presentation } = isPlainObject(saved) ? saved : {}
  return {
    presentation,
    style: {
      fontColor: typeof style.fontColor === 'string' ? style.fontColor : '#172033',
      fontFamily: style.fontFamily ?? null,
      globalFontSize: style.globalFontSize ?? null,
      useGlobalTextColor: Boolean(style.useGlobalTextColor),
      footerText: typeof style.footerText === 'string' ? style.footerText : ''
    }
  }
}

/** True when the draft has any text a person typed. A just-started blank template isn't worth a cloud document yet. */
export function hasContent(data) {
  const walk = (value, key) => {
    if (key === 'id') return false
    if (typeof value === 'string') return value.trim().length > 0
    if (Array.isArray(value)) return value.some(item => walk(item))
    if (isPlainObject(value)) return Object.entries(value).some(([name, item]) => walk(item, name))
    return false
  }
  return walk(data)
}
