# Research — codebase findings for M1 (2026-10-04)

Verified by reading source. Cite these when planning.

## Editor today
- `MainPage` in `src/main.jsx` owns all workspace state (resume data, presentation, NIMBUS, JD, evidence).
- Editor layout: `.editor-workspace-grid` (`src/ai-assistant.css` ~262–354) = canvas + right rail; the JD panel is placed beside it, and the evidence panel sits **below** the grid (`.workspace-lower-grid`). Right rail holds NIMBUS, a font select and photo controls.
- Inline editing: `ResumeTemplateLayout.jsx` makes the page `contentEditable` and commits text on blur through `onManualEdit({ path, value })`. A `readOnly` prop now exists (used by the build page).
- Selection: clicking any `[data-resume-element-id]` calls `onElementSelect`, stored as `selectedResumeElement` in `MainPage`, **but nothing in the UI uses it yet**.

## Editing engine — exists but is not wired
- `src/editor/resumeEditingEngine.js` validates `set_style` operations and stores them in `presentation.elementOverrides[elementId]`.
- **Nothing renders `elementOverrides`.** `EditableText` (`ResumeTemplateLayout.jsx:13`) only emits `data-resume-path` / `data-resume-element-id`. So per-element styling must be wired before a formatting panel can be real (PLAN-002).
- Allowed style properties lack `textDecoration`; underline/strikethrough need adding.
- `src/editor/resumeElementRegistry.js` registers header fields, summary, skills, photo and item fields (role, company, …). It does **not** register bullets, section headings or education details, so those can't be targeted yet.

## Global styles today
- Font family: `resumePresentation.fontFamily`. Global size/colour: `globalFontSize`, `fontColor` + `useGlobalTextColor`. Accent colour: `presentation.accentColor`.

## Export
- `exportDraft` in `src/main.jsx` writes **plain text** into jsPDF/docx. No template styling and no formatting reaches the PDF. FMT-09 needs a new export path (PLAN-006).

## Form today
- `src/components/ResumeBuilderForm.jsx`: one long scrolling list of `<details>` sections from `getTemplateSectionPlan(template.id)`; has main/sidebar regions, links editor, `LanguagePicker`, photo controls and a font select. Bullets are a textarea split by lines. No validation or completion state.

## Testing
- Protected routes need Google sign-in; automated browser runs can't sign in. Use standalone fixtures (`tests/scratch-builder.html`, `tests/template-rendering.html`) served by Vite.
