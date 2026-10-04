// Fixture for /workspace/editor without sign-in: the real EditorShell, AI rail, format panel,
// editing engine and undo history around one template. Network features are stubbed.
import React, { useCallback, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createPortal } from 'react-dom'
import '../src/styles.css'
import '../src/template.css'
import '../src/layout-overrides.css'
import '../src/resume-flow.css'
import '../src/ai-assistant.css'
import '../src/editor-studio.css'
import '../src/print.css'
import EditorShell from '../src/components/editor/EditorShell.jsx'
import FormatPanel from '../src/components/editor/FormatPanel.jsx'
import AiRail, { EvidenceDock } from '../src/components/editor/AiRail.jsx'
import JobMatchPanel from '../src/components/jd/JobMatchPanel.jsx'
import useJobMatch from '../src/jd/useJobMatch.js'
import '../src/job-match.css'
import '../src/buttons.css'
import '../src/format-panel.css'
import '../src/ai-assistant.css'
import NimbusChat from '../src/components/nimbus/NimbusChat.jsx'
import useNimbusTurns from '../src/nimbus/useNimbusTurns.js'
import { applyNimbusOperations } from '../src/nimbus/applyNimbusOperations.js'
import { findFont } from '../src/editor/fontRegistry.js'
import '../src/nimbus-chat.css'
import { getResumeTemplate, resolveResumePresentation } from '../src/config/resumeTemplates.js'
import { templatePreviewResumeData } from '../src/data/templatePreviewData.js'
import { ensureResumeElementIds } from '../src/editor/resumeElementRegistry.js'
import { applyResumeEditingOperations } from '../src/editor/resumeEditingEngine.js'
import { describeResumeElement } from '../src/editor/describeResumeElement.js'
import { resumeFonts } from '../src/editor/fontRegistry.js'
import useEditorHistory from '../src/editor/useEditorHistory.js'
import { toggleMarkInRange } from '../src/editor/inlineMarks.js'

const template = getResumeTemplate(new URLSearchParams(window.location.search).get('template') || 'receive')
const setPath = (source, path, value) => {
  const next = structuredClone(source)
  const parts = path.split('.')
  let target = next
  parts.slice(0, -1).forEach(part => { target = target[/^\d+$/.test(part) ? Number(part) : part] })
  target[parts.at(-1)] = value
  return next
}

function EditorCheck() {
  const Template = template.component
  const [resumeData, setResumeData] = useState(() => ensureResumeElementIds(templatePreviewResumeData))
  const [presentation, setPresentation] = useState({ template: template.id })
  const [selection, setSelection] = useState(null)
  const [fontFamily, setFontFamily] = useState(null)
  const [baseSize, setBaseSize] = useState(null)
  const [textColor, setTextColor] = useState(null)
  const [tab, setTab] = useState('nimbus')
  const [dockOpen, setDockOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [input, setInput] = useState('')
  const [turns, setTurns] = useState([{ id: 'welcome', role: 'assistant', status: 'done', text: 'Hi, I am NIMBUS.' }])
  const latest = { resumeData, presentation, fontFamily, baseSize, textColor }
  const latestRef = React.useRef(latest)
  latestRef.current = latest
  const elementNodes = () => [...document.querySelectorAll('.studio-canvas .resume-page-document [data-resume-element-id]')]
  const adapter = {
    snapshot: () => structuredClone(latestRef.current),
    restore: snapshot => { setResumeData(snapshot.resumeData); setPresentation(snapshot.presentation); setFontFamily(snapshot.fontFamily); setBaseSize(snapshot.baseSize); setTextColor(snapshot.textColor) },
    applyOperations: operations => {
      const result = applyNimbusOperations({ resumeData: latestRef.current.resumeData }, operations, { elementIds: [...new Set(elementNodes().map(node => node.dataset.resumeElementId))], fontFamilyForId: id => findFont(id)?.family ?? id })
      if (result.resumeData !== latestRef.current.resumeData) { latestRef.current = { ...latestRef.current, resumeData: result.resumeData }; setResumeData(result.resumeData) }
      if (result.presentationOps.length) apply(result.presentationOps)
      if (result.global.fontFamily) setFontFamily(result.global.fontFamily)
      if (result.global.baseSize) setBaseSize(result.global.baseSize)
      if (result.global.textColor) setTextColor(result.global.textColor)
      if (result.global.accent) setPresentation(current => ({ ...current, accentColor: result.global.accent }))
      return result
    },
    buildContext: () => ({
      resumeData: latestRef.current.resumeData,
      elements: [...new Map(elementNodes().map(node => [node.dataset.resumeElementId, { id: node.dataset.resumeElementId, label: describeResumeElement(node.dataset.resumeElementId).label, text: node.textContent.trim().slice(0, 90), path: node.dataset.resumePath }])).values()],
      style: { fontFamily: latestRef.current.fontFamily, templateFontFamily: template.defaultTheme.fontFamily, baseSize: latestRef.current.baseSize, template: template.name, pages: document.querySelectorAll('.studio-canvas .resume-page-frame').length },
      elementOverrides: latestRef.current.presentation.elementOverrides ?? {},
      selection: selection ? { id: selection.id, label: describeResumeElement(selection.id).label, text: selection.text ?? '' } : null,
      conversation: turns.filter(turn => turn.text).slice(-10).map(turn => ({ role: turn.role, text: turn.text }))
    }),
    fitToOnePage: async () => ({ ok: true, changed: false, note: 'Fixture: fitting is tested in the app.' })
  }
  const nimbus = useNimbusTurns({ turns, setTurns, adapter, available: true })
  window.__nimbus = nimbus
  const [jdAnalysis, setJdAnalysis] = useState(null)
  const jobMatch = useJobMatch({ analysis: jdAnalysis, setAnalysis: setJdAnalysis, draft: description, setDraft: setDescription, adapter: {
    getResume: () => latestRef.current.resumeData,
    pageCount: () => document.querySelectorAll('.studio-canvas .resume-page-frame').length,
    elementIds: () => [...new Set(elementNodes().map(node => node.dataset.resumeElementId))],
    snapshot: adapter.snapshot, restore: adapter.restore, applyOperations: adapter.applyOperations
  } })
  window.__jd = { jobMatch, get analysis() { return jdAnalysis } }
  const restore = useCallback(snapshot => { setResumeData(snapshot.resumeData); setPresentation(snapshot.presentation); setFontFamily(snapshot.fontFamily); setBaseSize(snapshot.baseSize); setTextColor(snapshot.textColor) }, [])
  const [previewingOption, setPreviewingOption] = useState(false)
  const history = useEditorHistory({ resumeData, presentation, fontFamily, baseSize, textColor }, restore, !previewingOption)
  window.__editorHistory = history
  const apply = operations => setPresentation(current => applyResumeEditingOperations({ content: {}, presentation: current }, operations).presentation)
  const resolved = resolveResumePresentation(template, { ...presentation, fontFamily })
  const editorStyle = { ...(baseSize ? { fontSize: `${baseSize}px` } : {}), ...(textColor ? { '--resume-text-color': textColor } : {}) }

  return <div className="app-shell editor-shell studio-shell"><main><div className="studio">
    <header className="studio-topbar editor-toolbar">
      <div className="studio-topbar-start"><b>Fixture · {template.name}</b></div>
      <div className="studio-topbar-centre">
        <button className="studio-icon-button" type="button" onClick={history.undo} disabled={!history.canUndo} aria-label="Undo">↶</button>
        <button className="studio-icon-button" type="button" onClick={history.redo} disabled={!history.canRedo} aria-label="Redo">↷</button>
      </div>
      <div className="editor-toolbar-actions" />
    </header>
    <EditorShell
      left={<AiRail tab={tab} onTabChange={setTab} score={jdAnalysis?.score}
        nimbus={<NimbusChat turns={turns} busy={nimbus.busy} phase={nimbus.phase} task={nimbus.task} available value={input} onChange={event => setInput(event.target.value)} onSend={text => { setInput(''); nimbus.run(text) }} onStop={nimbus.stop} />}
        jobMatch={<JobMatchPanel analysis={jdAnalysis} busy={jobMatch.busy} available draft={description} onDraftChange={setDescription} attachedFile={jobMatch.file} onAttachFile={jobMatch.setFile} onClearFile={() => jobMatch.setFile(null)}
          onAnalyse={jobMatch.run} onStop={jobMatch.stop} onExecuteFix={jobMatch.executeFix} onUndoFix={jobMatch.undoFix} onAnswerFix={fix => { setTab('nimbus'); setInput(`${fix.question}

My answer: `) }} onReset={jobMatch.reset} onRetry={jobMatch.retryFixes} error={jobMatch.error} />}
        evidence={<EvidenceDock onCompare={() => {}} canCompare connected={false} />}
      />}
      centre={<div className="studio-canvas"><Template resumeData={resumeData} presentation={resolved} editorStyle={editorStyle} useGlobalTextColor={Boolean(textColor)} onElementSelect={setSelection} selectedElementId={selection?.id} onManualEdit={({ path, value }) => setResumeData(current => setPath(current, path, value))} /></div>}
      right={<FormatPanel selection={selection} onClearSelection={() => setSelection(null)} resumeData={resumeData} onEditText={(path, value) => setResumeData(current => setPath(current, path, value))}
        onToggleMark={mark => { const value = selection.path.split('.').reduce((current, key) => current?.[key], resumeData); setResumeData(current => setPath(current, selection.path, toggleMarkInRange(value, selection.range.start, selection.range.end, mark))); setSelection({ ...selection, range: null }) }}
        overrides={presentation.elementOverrides ?? {}} onStyle={(target, changes) => apply([{ type: 'set_style', target, changes }])} onClear={target => apply([{ type: 'clear_style', target }])}
        revision={`${selection?.id}|${JSON.stringify(presentation)}|${fontFamily}|${baseSize}|${textColor}`} fonts={resumeFonts}
        fontFamily={fontFamily} templateFontFamily={template.defaultTheme.fontFamily} onFontFamily={setFontFamily}
        baseFontSize={baseSize ?? 13.5} onBaseFontSize={setBaseSize} textColor={textColor} onTextColor={setTextColor}
        accentColor={presentation.accentColor} templateAccent={template.defaultTheme.accentColor} onAccentColor={color => setPresentation(current => ({ ...current, accentColor: color }))}
        photo={presentation.photo} supportsPhoto={false} onResetAll={() => { apply([{ type: 'clear_style', target: '*' }]); setFontFamily(null); setBaseSize(null); setTextColor(null) }} />}
    />
  </div></main>
    {/* ?print=1 mounts the same A4 print copy MainPage renders for "Export → PDF". */}
    {new URLSearchParams(window.location.search).get('print') && createPortal(<div className="print-root"><Template resumeData={resumeData} presentation={resolved} editorStyle={editorStyle} useGlobalTextColor={Boolean(textColor)} readOnly pageWidthOverride={794} /></div>, document.body)}
  </div>
}

createRoot(document.getElementById('root')).render(<EditorCheck />)
