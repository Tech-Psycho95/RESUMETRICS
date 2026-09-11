import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

const valueOr = (value, fallback) => value || fallback
const asArray = value => Array.isArray(value) ? value : []
const allSkills = skills => Object.values(skills ?? {}).flat().filter(Boolean)
const period = item => [item?.startDate, item?.endDate].filter(Boolean).join(' — ')
const A4_RATIO = 297 / 210
const MAX_A4_WIDTH = 794

function ResumeHeader({ resumeData }) {
  const contact = [resumeData.email, resumeData.phone, resumeData.location].filter(Boolean)
  const links = asArray(resumeData.links)
    .map(link => typeof link === 'string' ? link : link?.url || link?.label)
    .filter(Boolean)
  const contactItems = contact.concat(links)

  return <header className="generated-resume-header" data-page-header>
    <div>
      <h1>{valueOr(resumeData.fullName, 'YOUR NAME')}</h1>
      <p>{valueOr(resumeData.headline, 'Professional headline')}</p>
    </div>
    <address className="generated-contact">
      {contactItems.length
        ? contactItems.map((item, index) => <span key={index}>{item}</span>)
        : <span>email@example.com · +1 555 123 4567 · City, Country · linkedin.com/in/yourname</span>}
    </address>
  </header>
}

function ExperienceEntry({ item }) {
  return <article className="resume-entry">
    <div className="resume-entry-heading">
      <strong>{item?.role || 'Role'}</strong>
      <span>{period(item)}</span>
    </div>
    <p className="resume-entry-subtitle">{[item?.company, item?.location].filter(Boolean).join(' · ')}</p>
    {asArray(item?.bullets).length > 0 && <ul>{item.bullets.map((bullet, index) => <li key={index}>{bullet}</li>)}</ul>}
  </article>
}

function ProjectEntry({ item }) {
  return <article className="resume-entry">
    <div className="resume-entry-heading">
      <strong>{item?.name || 'Project'}</strong>
      <span>{asArray(item?.techStack).join(' · ')}</span>
    </div>
    {item?.description && <p>{item.description}</p>}
    {asArray(item?.bullets).length > 0 && <ul>{item.bullets.map((bullet, index) => <li key={index}>{bullet}</li>)}</ul>}
  </article>
}

function EducationEntry({ item }) {
  return <article className="resume-entry">
    <div className="resume-entry-heading">
      <strong>{item?.degree || 'Degree'}</strong>
      <span>{period(item)}</span>
    </div>
    <p className="resume-entry-subtitle">{[item?.institution, item?.location].filter(Boolean).join(' · ')}</p>
    {asArray(item?.details).length > 0 && <ul>{item.details.map((detail, index) => <li key={index}>{detail}</li>)}</ul>}
  </article>
}

function buildSections(resumeData) {
  const skills = allSkills(resumeData.skills)
  const experience = asArray(resumeData.experience)
  const projects = asArray(resumeData.projects)
  const education = asArray(resumeData.education)
  const certifications = asArray(resumeData.certifications)
  const achievements = asArray(resumeData.achievements)

  return [
    {
      id: 'summary',
      title: 'Summary',
      blocks: [{ id: 'summary-copy', type: 'summary', value: valueOr(resumeData.summary, 'Write a focused summary that explains the value you bring.') }],
    },
    {
      id: 'experience',
      title: 'Experience',
      blocks: experience.length
        ? experience.map((item, index) => ({ id: `experience-${index}`, type: 'experience', value: item }))
        : [{ id: 'experience-placeholder', type: 'placeholder', value: 'Add your work experience here.' }],
    },
    {
      id: 'projects',
      title: 'Projects',
      blocks: projects.length
        ? projects.map((item, index) => ({ id: `project-${index}`, type: 'project', value: item }))
        : [{ id: 'project-placeholder', type: 'placeholder', value: 'Add a project that shows your impact.' }],
    },
    {
      id: 'education',
      title: 'Education',
      blocks: education.length
        ? education.map((item, index) => ({ id: `education-${index}`, type: 'education', value: item }))
        : [{ id: 'education-placeholder', type: 'placeholder', value: 'Add your education details here.' }],
    },
    {
      id: 'skills',
      title: 'Skills',
      blocks: [{ id: 'skills-copy', type: 'skills', value: skills.length ? skills.join(' · ') : 'Add the skills most relevant to your target role.' }],
    },
    ...(certifications.length ? [{
      id: 'certifications',
      title: 'Certifications',
      blocks: certifications.map((item, index) => ({ id: `certification-${index}`, type: 'list-item', value: item })),
    }] : []),
    ...(achievements.length ? [{
      id: 'achievements',
      title: 'Achievements',
      blocks: achievements.map((item, index) => ({ id: `achievement-${index}`, type: 'list-item', value: item })),
    }] : []),
  ]
}

function RenderBlock({ block }) {
  if (block.type === 'experience') return <ExperienceEntry item={block.value} />
  if (block.type === 'project') return <ProjectEntry item={block.value} />
  if (block.type === 'education') return <EducationEntry item={block.value} />
  if (block.type === 'placeholder') return <p className="resume-placeholder">{block.value}</p>
  if (block.type === 'skills') return <p className="resume-skills">{block.value}</p>
  if (block.type === 'list-item') return <ul className="resume-single-item-list"><li>{block.value}</li></ul>
  return <p>{block.value}</p>
}

function ResumeSection({ section, blockIndexes, headingSuffix = '', continued = false }) {
  const headingId = `section-${section.id}${headingSuffix}`
  return <section className={`resume-section${continued ? ' resume-section-continued' : ''}`} aria-labelledby={headingId}>
    <h2 id={headingId}>{section.title}{continued && <span className="resume-continuation-label"> continued</span>}</h2>
    {blockIndexes.map(index => <div className="resume-page-block" data-block-index={index} key={section.blocks[index].id}>
      <RenderBlock block={section.blocks[index]} />
    </div>)}
  </section>
}

function SingleResume({ resumeData, sections, variant, editorStyle, useGlobalTextColor, footerText, editorRef, preview }) {
  return <article
    ref={editorRef}
    style={editorStyle}
    className={`generated-resume template-${variant} ${useGlobalTextColor ? 'ai-global-text-color' : ''} ${preview ? 'template-live-preview' : ''}`}
    contentEditable={!preview}
    role="textbox"
    aria-multiline="true"
    aria-label={preview ? 'Resume template preview' : 'Generated editable resume'}
    suppressContentEditableWarning
    spellCheck
  >
    <ResumeHeader resumeData={resumeData} />
    <div className="generated-resume-main">
      {sections.map(section => <ResumeSection
        section={section}
        blockIndexes={section.blocks.map((_, index) => index)}
        headingSuffix="-preview"
        key={section.id}
      />)}
    </div>
    {footerText && <footer className="generated-resume-footer">{footerText}</footer>}
  </article>
}

function initialPages(sections) {
  return [{
    showHeader: true,
    groups: sections.map(section => ({
      sectionId: section.id,
      blockIndexes: section.blocks.map((_, index) => index),
      continued: false,
    })),
    showFooter: true,
  }]
}

function paginateMeasurement(measurement, sections) {
  if (!measurement) return initialPages(sections)

  const styles = window.getComputedStyle(measurement)
  const contentHeight = measurement.clientHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom)
  const headerElement = measurement.querySelector('[data-page-header]')
  const footerElement = measurement.querySelector('[data-page-footer]')
  const headerHeight = headerElement?.offsetHeight || 0
  const footerHeight = footerElement?.offsetHeight || 0
  const pages = []
  let page = { showHeader: true, groups: [], showFooter: false }
  let usedHeight = headerHeight

  const pushPage = () => {
    if (page.groups.length || page.showHeader) pages.push(page)
    page = { showHeader: false, groups: [], showFooter: false }
    usedHeight = 0
  }

  sections.forEach(section => {
    const measuredSection = measurement.querySelector(`[data-measure-section="${section.id}"]`)
    const heading = measuredSection?.querySelector('[data-measure-heading]')
    const sectionStyle = measuredSection ? window.getComputedStyle(measuredSection) : null
    const headingStyle = heading ? window.getComputedStyle(heading) : null
    const sectionMargin = parseFloat(sectionStyle?.marginTop || 0)
    const headingHeight = (heading?.offsetHeight || 0) + parseFloat(headingStyle?.marginBottom || 0)
    let group = null

    section.blocks.forEach((_, blockIndex) => {
      const measuredBlock = measuredSection?.querySelector(`[data-block-index="${blockIndex}"]`)
      const blockHeight = measuredBlock?.offsetHeight || 0
      const needsHeading = !group
      const requiredHeight = blockHeight + (needsHeading ? sectionMargin + headingHeight : 0)

      if (usedHeight + requiredHeight > contentHeight && (page.groups.length || !page.showHeader)) {
        pushPage()
        group = null
      }

      if (!group) {
        group = {
          sectionId: section.id,
          blockIndexes: [],
          continued: blockIndex > 0,
        }
        page.groups.push(group)
        usedHeight += sectionMargin + headingHeight
      }

      group.blockIndexes.push(blockIndex)
      usedHeight += blockHeight
    })
  })

  if (footerHeight) {
    if (usedHeight + footerHeight > contentHeight && page.groups.length) pushPage()
    page.showFooter = true
  }

  if (page.groups.length || page.showFooter || !pages.length) pages.push(page)
  return pages
}

export default function ResumeTemplateLayout({ resumeData = {}, editorRef, variant, editorStyle, useGlobalTextColor = false, footerText = '', preview = false }) {
  const sections = useMemo(() => buildSections(resumeData), [resumeData])
  const shellRef = useRef(null)
  const scrollerRef = useRef(null)
  const measurementRef = useRef(null)
  const pageRefs = useRef([])
  const [pageWidth, setPageWidth] = useState(MAX_A4_WIDTH)
  const [pages, setPages] = useState(() => initialPages(sections))
  const [activePage, setActivePage] = useState(0)
  const pageHeight = Math.round(pageWidth * A4_RATIO)

  useEffect(() => {
    if (preview || !shellRef.current) return undefined

    const updatePageWidth = () => {
      const availableWidth = shellRef.current?.clientWidth || MAX_A4_WIDTH
      setPageWidth(Math.max(240, Math.min(MAX_A4_WIDTH, availableWidth - 32)))
    }
    updatePageWidth()

    const observer = new ResizeObserver(updatePageWidth)
    observer.observe(shellRef.current)
    return () => observer.disconnect()
  }, [preview])

  useLayoutEffect(() => {
    if (preview) return
    const nextPages = paginateMeasurement(measurementRef.current, sections)
    setPages(nextPages)
    setActivePage(current => Math.min(current, nextPages.length - 1))
  }, [editorStyle, footerText, pageHeight, preview, sections, useGlobalTextColor, variant])

  useEffect(() => {
    if (preview || pages.length < 2) return undefined
    const scroller = scrollerRef.current
    if (!scroller) return undefined

    const updateActivePage = () => {
      const scrollerTop = scroller.getBoundingClientRect().top
      let closestPage = 0
      let closestDistance = Number.POSITIVE_INFINITY
      pageRefs.current.forEach((element, index) => {
        if (!element) return
        const distance = Math.abs(element.getBoundingClientRect().top - scrollerTop - 12)
        if (distance < closestDistance) {
          closestDistance = distance
          closestPage = index
        }
      })
      setActivePage(closestPage)
    }

    scroller.addEventListener('scroll', updateActivePage, { passive: true })
    return () => scroller.removeEventListener('scroll', updateActivePage)
  }, [pages.length, preview])

  if (preview) {
    return <SingleResume
      resumeData={resumeData}
      sections={sections}
      variant={variant}
      editorStyle={editorStyle}
      useGlobalTextColor={useGlobalTextColor}
      footerText={footerText}
      editorRef={editorRef}
      preview
    />
  }

  const goToPage = index => {
    const nextIndex = Math.max(0, Math.min(pages.length - 1, index))
    pageRefs.current[nextIndex]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActivePage(nextIndex)
  }

  return <div className="resume-document-shell" ref={shellRef}>
    {pages.length > 1 && <nav className="resume-page-controls" aria-label="Resume pages">
      <button type="button" onClick={() => goToPage(activePage - 1)} disabled={activePage === 0} aria-label="Previous resume page">‹</button>
      <span>Page {activePage + 1} of {pages.length}</span>
      <button type="button" onClick={() => goToPage(activePage + 1)} disabled={activePage === pages.length - 1} aria-label="Next resume page">›</button>
    </nav>}

    <div className="resume-page-scroller" ref={scrollerRef}>
      <div
        ref={editorRef}
        className="resume-page-document"
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="Generated editable resume"
        suppressContentEditableWarning
        spellCheck
      >
        {pages.map((page, pageIndex) => <div
          className="resume-page-frame"
          style={{ width: pageWidth, height: pageHeight }}
          ref={element => { pageRefs.current[pageIndex] = element }}
          data-page-number={pageIndex + 1}
          key={`${pageIndex}-${page.groups.map(group => `${group.sectionId}:${group.blockIndexes.join(',')}`).join('|')}`}
        >
          <article
            style={{ ...editorStyle, width: pageWidth, height: pageHeight }}
            className={`generated-resume resume-a4-page template-${variant} ${useGlobalTextColor ? 'ai-global-text-color' : ''}`}
          >
            {page.showHeader && <ResumeHeader resumeData={resumeData} />}
            <div className="generated-resume-main">
              {page.groups.map(group => {
                const section = sections.find(item => item.id === group.sectionId)
                return section ? <ResumeSection
                  section={section}
                  blockIndexes={group.blockIndexes}
                  continued={group.continued}
                  headingSuffix={`-page-${pageIndex}-${group.blockIndexes[0]}`}
                  key={`${group.sectionId}-${group.blockIndexes[0]}`}
                /> : null
              })}
            </div>
            {page.showFooter && footerText && <footer className="generated-resume-footer">{footerText}</footer>}
          </article>
        </div>)}
      </div>
    </div>

    <article
      ref={measurementRef}
      style={{ ...editorStyle, width: pageWidth, height: pageHeight }}
      className={`generated-resume resume-a4-page resume-pagination-measure template-${variant} ${useGlobalTextColor ? 'ai-global-text-color' : ''}`}
      aria-hidden="true"
    >
      <ResumeHeader resumeData={resumeData} />
      <div className="generated-resume-main">
        {sections.map(section => <section className="resume-section" data-measure-section={section.id} key={section.id}>
          <h2 data-measure-heading>{section.title}</h2>
          {section.blocks.map((block, blockIndex) => <div className="resume-page-block" data-block-index={blockIndex} key={block.id}>
            <RenderBlock block={block} />
          </div>)}
        </section>)}
      </div>
      {footerText && <footer className="generated-resume-footer" data-page-footer>{footerText}</footer>}
    </article>
  </div>
}
