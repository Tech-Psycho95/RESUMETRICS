export default function ResumeTemplatePreview({ template }) {
  return <div className={`resume-template-preview ${template.id}`} aria-hidden="true">
    <div className="preview-topline" />
    <div className="preview-heading" />
    <div className="preview-subheading" />
    <div className="preview-section-line" />
    <div className="preview-copy"><i /><i /><i /></div>
    <div className="preview-section-line short" />
    <div className="preview-copy"><i /><i /></div>
  </div>
}

