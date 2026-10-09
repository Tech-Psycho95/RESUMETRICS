import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  A4_RATIO, ContactList, MAX_A4_WIDTH, MarkedText, ResumeHeader, ResumeStyleContext, StyledElement, featuresFor, isLatexVariant,
  latexTemplateFeatures, overrideToStyle, reactiveClassName, visualColumnVariants
} from '../components/templates/ResumeTemplateLayout.jsx'
import { adaptResumeForTemplate } from '../templates/templateDataAdapter.js'
import { findFont, loadFontsForPresentation } from '../editor/fontRegistry.js'
import { rangeOffsetsWithin, readMarkedText } from '../editor/inlineMarks.js'
import { GHOST_HINTS, PAPER_OPTIONS, addressLines, dateOf, roleOf, salutationOf, signoffOf } from '../../shared/letterModel.js'
import { letterFamilyFor } from './letterDesigns.js'

const asPixels = value => Number.isFinite(value) ? `${value}px` : undefined

/** Text the writer can edit in place; empty fields show a hint (editor only, never printed). */
function LetterText({ id, path = id, hint, as: Tag = 'span', children }) {
  const { overrides, selectedId } = useContext(ResumeStyleContext)
  const override = overrides?.[id]
  const empty = typeof children === 'string' && !children.trim()
  return <Tag
    data-resume-path={path}
    data-resume-element-id={id}
    data-selected={selectedId && selectedId === id ? 'true' : undefined}
    data-hint={empty && hint ? hint : undefined}
    className={empty ? 'letter-empty' : undefined}
    style={override ? overrideToStyle(override) : undefined}
  >{typeof children === 'string' ? <MarkedText text={children} /> : children}</Tag>
}

/** The resume's presentation with the letter's own choices on top (font, accent, per-element styles, photo). */
export function letterPresentationOf(resumePresentation = {}, letter) {
  const own = letter.presentation ?? {}
  const photo = resumePresentation.photo
  return {
    ...resumePresentation,
    fontFamily: own.fontFamily || resumePresentation.fontFamily || null,
    accentColor: own.accentColor || resumePresentation.accentColor || null,
    elementOverrides: { ...(resumePresentation.elementOverrides ?? {}), ...(own.elementOverrides ?? {}) },
    photo: letter.showPhoto === false || !photo ? { visible: false } : { ...photo, uploadPlaceholder: undefined }
  }
}

function Signature({ letter, readOnly, onSignatureClick }) {
  const { selectedId } = useContext(ResumeStyleContext)
  const signature = letter.signature
  if (!signature?.image) {
    if (readOnly) return null
    return <div className="letter-signature-slot" contentEditable={false}><button type="button" className="letter-signature-add" onClick={onSignatureClick}>Add signature</button></div>
  }
  return <div className={`letter-signature-slot is-${signature.align || 'left'}`} contentEditable={false}>
    <img className="letter-signature" data-resume-element-id="letter.signature" data-selected={selectedId === 'letter.signature' ? 'true' : undefined} src={signature.image} alt="Signature" draggable={false}
      style={{ width: `${signature.width || 9}em` }} />
  </div>
}

/**
 * One cover letter on an A4 sheet, in the markup and classes of the resume's template so the template's own CSS
 * draws the masthead and columns (PLAN-033). Editable like the resume: `onEdit({ path, value })`, `onSelect(selection)`.
 */
export default function CoverLetterPage({
  template, resumeData, letter, presentation, readOnly = false, onEdit, onSelect, selectedId = null, pageWidthOverride,
  editorRef, onPages, onSignatureClick, onProfilePhotoClick, now
}) {
  const variant = template?.id
  const features = featuresFor(variant)
  const family = letterFamilyFor(variant)
  const own = letter.presentation ?? {}
  const pres = useMemo(() => letterPresentationOf(presentation, letter), [presentation, letter])
  const sourceData = useMemo(() => adaptResumeForTemplate({ ...resumeData, headline: roleOf(letter, resumeData) }), [resumeData, letter])
  const shellRef = useRef(null)
  const articleRef = useRef(null)
  const documentRef = useRef(null)
  const [pageWidth, setPageWidth] = useState(pageWidthOverride || MAX_A4_WIDTH)
  const [pages, setPages] = useState(1)
  const pageHeight = Math.round(pageWidth * A4_RATIO)
  const columns = visualColumnVariants.has(variant)
  const paper = PAPER_OPTIONS.find(option => option.id === own.paper)?.color ?? null

  useEffect(() => { loadFontsForPresentation(pres) }, [pres])
  useEffect(() => {
    if (pageWidthOverride) { setPageWidth(pageWidthOverride); return undefined }
    const update = () => setPageWidth(Math.max(240, Math.min(MAX_A4_WIDTH, (shellRef.current?.clientWidth || MAX_A4_WIDTH) - 32)))
    update()
    const observer = new ResizeObserver(update)
    if (shellRef.current) observer.observe(shellRef.current)
    return () => observer.disconnect()
  }, [pageWidthOverride])

  // How many sheets the letter needs; the editor warns when it is more than one.
  useLayoutEffect(() => {
    const article = articleRef.current
    if (!article) return undefined
    const measure = () => {
      // The empty-signature target is editor-only: it must not push a letter that prints on one page onto two.
      const editorOnly = article.querySelector('.letter-signature-add')?.closest('.letter-signature-slot')?.offsetHeight ?? 0
      const count = Math.max(1, Math.ceil((article.offsetHeight - editorOnly - 2) / pageHeight))
      setPages(count)
      onPages?.(count)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(article)
    return () => observer.disconnect()
  }, [pageHeight, onPages])

  const scale = pageWidth / MAX_A4_WIDTH
  const baseSize = parseFloat(own.baseSize) || (isLatexVariant(variant) ? latexTemplateFeatures[variant].base : 13.3333)
  const style = {
    ...(pres.accentColor ? { '--template-accent-color': pres.accentColor } : {}),
    ...(pres.fontFamily ? { fontFamily: findFont(pres.fontFamily)?.family ?? pres.fontFamily } : {}),
    ...(own.textColor ? { '--resume-text-color': own.textColor } : {}),
    ...(paper ? { background: paper } : {}),
    fontSize: `${baseSize * scale}px`,
    '--page-scale': scale,
    '--letter-paper': paper || '#fff',
    width: pageWidth,
    minHeight: pageHeight,
    height: 'auto'
  }
  if (['navy-professional', 'curve-academic', 'receive'].includes(variant)) style.padding = `${pageWidth * 0.055}px`
  const { display: _display, ...wholeStyle } = overrideToStyle(pres.elementOverrides?.resume)
  Object.assign(style, wholeStyle)

  const styleContext = useMemo(() => ({ overrides: pres.elementOverrides, selectedId, focusSectionId: null, features }), [pres.elementOverrides, selectedId, features])

  const describeSelection = fallbackTarget => {
    const selection = window.getSelection()
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null
    const container = range ? range.startContainer : null
    const startNode = container?.nodeType === 1 ? container : container?.parentElement
    const element = (range && documentRef.current?.contains(startNode) ? startNode?.closest('[data-resume-element-id]') : null) || fallbackTarget?.closest?.('[data-resume-element-id]')
    if (!element) return null
    const offsets = range && !range.collapsed ? rangeOffsetsWithin(element, range) : null
    return { id: element.dataset.resumeElementId, path: element.dataset.resumePath, range: offsets && offsets.end > offsets.start ? offsets : null, text: element.textContent?.slice(0, 200) ?? '' }
  }
  useEffect(() => {
    if (!onSelect || readOnly) return undefined
    const onSelectionChange = () => {
      const anchor = window.getSelection()?.anchorNode
      if (!anchor || !documentRef.current?.contains(anchor)) return
      const next = describeSelection()
      if (next) onSelect(next)
    }
    document.addEventListener('selectionchange', onSelectionChange)
    return () => document.removeEventListener('selectionchange', onSelectionChange)
  }, [onSelect, readOnly]) // eslint-disable-line react-hooks/exhaustive-deps

  const commit = event => {
    const anchor = window.getSelection()?.anchorNode
    const anchorElement = anchor?.nodeType === Node.ELEMENT_NODE ? anchor : anchor?.parentElement
    const field = anchorElement?.closest?.('[data-resume-path]') || event.target.closest?.('[data-resume-path]')
    if (field && onEdit) onEdit({ path: field.dataset.resumePath, value: readMarkedText(field) })
  }
  const setDocument = node => {
    documentRef.current = node
    if (typeof editorRef === 'function') editorRef(node)
    else if (editorRef) editorRef.current = node
  }

  const show = (value, forceShow = !readOnly) => forceShow || Boolean(String(value ?? '').trim())
  const recipient = letter.recipient
  const lines = addressLines(letter)
  const date = dateOf(letter, now)
  const contactItems = sourceData.contactItems ?? []

  const contactSection = features.contactSection && <section className="resume-section resume-section-contact letter-contact">
    <h2><StyledElement elementId="section.contact.heading">{features.contactSection.title}</StyledElement></h2>
    <div className="resume-page-block"><ContactList items={contactItems} inSection /></div>
  </section>

  const meta = <div className="letter-meta">
    {contactSection}
    <p className="letter-date"><LetterText id="letter.date" hint="Date">{date}</LetterText></p>
    {(!readOnly || [recipient.name, recipient.title, recipient.company, ...lines].some(value => String(value ?? '').trim())) && <address className="letter-recipient">
      {show(recipient.name) && <span className="letter-recipient-name"><LetterText id="letter.recipient.name" hint="Recipient name">{recipient.name}</LetterText></span>}
      {show(recipient.title) && <span className="letter-recipient-title"><LetterText id="letter.recipient.title" hint="Their job title">{recipient.title}</LetterText></span>}
      {show(recipient.company) && <span className="letter-recipient-company"><LetterText id="letter.recipient.company" hint="Company">{recipient.company}</LetterText></span>}
      {(lines.length ? lines : readOnly ? [] : ['']).map((line, index) => <span className="letter-recipient-address" key={index}><LetterText id={`letter.recipient.address.${index}`} hint="Address">{line}</LetterText></span>)}
    </address>}
    {letter.showSubject && show(letter.subject) && <p className="letter-subject"><LetterText id="letter.subject" hint="Subject line">{letter.subject}</LetterText></p>}
  </div>

  const body = <div className="letter-body">
    <p className="letter-salutation"><LetterText id="letter.salutation">{salutationOf(letter)}</LetterText></p>
    {letter.paragraphs.filter(paragraph => !readOnly || paragraph.text.trim()).map(paragraph => <p className={`letter-paragraph letter-paragraph-${paragraph.kind}`} key={paragraph.id}>
      <LetterText id={`letter.paragraph.${paragraph.id}`} hint={GHOST_HINTS[paragraph.kind]}>{paragraph.text}</LetterText>
    </p>)}
    <p className="letter-signoff"><LetterText id="letter.signoff">{signoffOf(letter)}</LetterText></p>
    <Signature letter={letter} readOnly={readOnly} onSignatureClick={onSignatureClick} />
    <p className="letter-name"><LetterText id="letter.name" path="fullName">{resumeData.fullName || 'Your name'}</LetterText></p>
  </div>

  const className = `generated-resume resume-a4-page letter-page letter-family-${family} template-${variant}${reactiveClassName(variant)}${isLatexVariant(variant) ? ' template-latex' : ''}${own.textColor ? ' ai-global-text-color' : ''}`

  return <ResumeStyleContext.Provider value={styleContext}>
    <div className="letter-shell" ref={shellRef}>
      <div className="letter-scroller">
        <div
          ref={setDocument}
          className="letter-page-document"
          contentEditable={!readOnly}
          role={readOnly ? 'document' : 'textbox'}
          aria-multiline={readOnly ? undefined : 'true'}
          aria-label={readOnly ? 'Cover letter preview' : 'Editable cover letter'}
          suppressContentEditableWarning
          spellCheck
          onBlur={commit}
          onMouseUp={event => onSelect?.(describeSelection(event.target))}
        >
          <div className="letter-page-frame" style={{ width: pageWidth, minHeight: pageHeight }}>
            <article ref={articleRef} className={className} style={style}>
              <ResumeHeader resumeData={sourceData} presentation={pres} onProfilePhotoClick={onProfilePhotoClick} />
              <div className="generated-resume-main">
                {columns
                  ? <div className={`resume-columns-flow resume-columns-${variant}`} data-layout="columns">
                    <div className="resume-column resume-sidebar-column">{meta}</div>
                    <div className="resume-column resume-main-column">{body}</div>
                  </div>
                  : <>{meta}{body}</>}
              </div>
            </article>
            {!readOnly && pages > 1 && Array.from({ length: pages - 1 }, (_, index) => <div className="letter-page-break" key={index} style={{ top: pageHeight * (index + 1) }} contentEditable={false}><span>Page {index + 2}</span></div>)}
          </div>
        </div>
      </div>
    </div>
  </ResumeStyleContext.Provider>
}
