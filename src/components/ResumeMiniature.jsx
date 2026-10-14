import { useEffect, useRef, useState } from 'react'
import { getResumeTemplate, resolveResumePresentation } from '../config/resumeTemplates.js'
import { loadFontsForPresentation } from '../editor/fontRegistry.js'
import { splitSavedPresentation } from '../db/resumeFields.js'

const A4_WIDTH = 794

/**
 * A saved resume in its own template, as a live miniature: the real template renders at A4 width and is scaled to fit
 * the box, so it shows exactly what has been written so far, in the design and fonts it was saved with.
 */
export default function ResumeMiniature({ project }) {
  const frameRef = useRef(null)
  const [scale, setScale] = useState(0)
  const template = getResumeTemplate(project?.templateId)
  const saved = splitSavedPresentation(project?.presentation).presentation
  const presentation = template ? { ...resolveResumePresentation(template, saved), photo: saved.photo ?? template.defaultTheme?.photo } : null
  const fontFamily = presentation?.fontFamily

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return undefined
    const update = () => setScale(frame.clientWidth / A4_WIDTH)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])
  const [, setFontsReady] = useState(false)
  useEffect(() => {
    let live = true
    if (presentation) loadFontsForPresentation(presentation).then(() => { if (live) setFontsReady(true) }, () => {})
    return () => { live = false }
  }, [fontFamily]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!template || !project?.resumeData) return null
  const Template = template.component
  return <div className="resume-miniature" ref={frameRef} aria-hidden="true">
    {scale > 0 && <div className="resume-miniature-sheet" style={{ transform: `scale(${scale})` }}>
      <Template resumeData={project.resumeData} presentation={presentation} preview />
    </div>}
  </div>
}
