export default function ResumeStartOptions({ onImport, onCreate }) {
  return <section className="resume-start-options" aria-label="Start a resume">
    <div className="workspace-state-heading"><span className="eyebrow">START A RESUME</span><h2>Choose how you want to begin.</h2><p>Bring your experience forward from an existing resume, or start with a clean professional structure.</p></div>
    <div className="resume-start-grid">
      <article className="resume-start-card import-start-card"><div className="start-card-icon" aria-hidden="true">↥</div><h3>Import Resume Skills</h3><p>Upload an existing PDF, DOCX, or TXT resume. Resumetrics will extract your skills, experience, education, projects, and profile details before creating a fresh resume in your chosen template.</p><button className="primary-button" onClick={onImport}>Upload Resume</button></article>
      <article className="resume-start-card"><div className="start-card-icon violet" aria-hidden="true">+</div><h3>Create Resume</h3><p>Start from a professional template and build a resume from scratch with AI assistance when you are ready.</p><button className="secondary-button" onClick={onCreate}>Choose Template</button></article>
    </div>
  </section>
}

