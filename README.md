# Resumetrics

Resumetrics is an AI-assisted resume workspace that turns an existing resume into structured career data, generates a fresh editable draft, and helps users align their experience to a target role.

The public landing page is available at `/`. Authentication is handled by Firebase Google Sign-In, and the protected workspace is available at `/workspace` after authentication.

## Product capabilities

- Public cinematic landing page with animated Resumetrics branding.
- Google authentication with protected workspace routes and account sign-out.
- Import flow for PDF, DOCX, and TXT resumes.
- Structured AI extraction of profile details, skills, experience, projects, education, certifications, and achievements.
- Five original resume templates: Classic Professional, Modern Minimal, Tech Focused, Compact ATS, and Elegant Sidebar.
- Separate generated resume state so the uploaded source remains untouched.
- Editable resume canvas with text formatting, font controls, alignment, exports, and AI bullet rewriting.
- Job-description alignment with skill comparison, match score, strengths, missing skills, and recommendations.
- Server-side Groq integration with local skill-aware fallback when the AI provider is unavailable.

## Tech stack

### Frontend

- React and React DOM
- Vite
- React Router DOM
- CSS with the existing Resumetrics design system
- Firebase Web SDK for Google Authentication
- PDF.js and Mammoth for browser-side PDF/DOCX text extraction
- jsPDF, docx, and PptxGenJS for exports
- Native IntersectionObserver, requestAnimationFrame, and CSS animations for landing-page motion

### Backend

- Node.js
- Express
- CORS
- dotenv
- Groq official JavaScript SDK
- Modular AI client abstraction so the provider or model can be replaced later

## Project structure

```text
RESUMETRICS/
├── public/
│   └── favicon.svg
├── server/
│   ├── config/env.js              # Server environment configuration
│   ├── index.js                   # Express server entry point
│   ├── routes/
│   │   ├── ai.routes.js           # AI health, test, and assistant routes
│   │   └── resume.routes.js       # Extraction, analysis, and rewrite routes
│   └── services/
│       ├── aiClient.js            # Provider-neutral AI client
│       ├── resumeAI.js             # Structured extraction and AI analysis
│       ├── resumeData.js            # Resume data normalization
│       └── resumeFallback.js        # Local fallback behavior
├── shared/
│   └── roleAnalysis.js             # Shared deterministic skill comparison
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── landing/                # Public landing-page sections and motion
│   │   ├── templates/              # Original resume template components
│   │   ├── ProtectedRoute.jsx      # Authentication gate
│   │   ├── UserMenu.jsx            # Authenticated profile/dropdown
│   │   └── Resume*.jsx             # Import, review, and template flow
│   ├── config/resumeTemplates.js   # Central template registry
│   ├── context/AuthContext.jsx     # Firebase auth state and actions
│   ├── data/resumeData.js          # Blank and normalized resume data
│   ├── pages/
│   │   ├── LandingPage.jsx         # Public `/` route
│   │   └── Login.jsx               # Public `/login` route
│   ├── firebase.js                 # Firebase client initialization
│   ├── main.jsx                    # Router and application entry point
│   └── styles/landing.css          # Landing-page visual system
├── .env.example                    # Placeholder Firebase variables
├── package.json
└── vite.config.js                  # Vite config and `/api` proxy
```

## Local setup

Install dependencies:

```bash
npm install
```

Create a root `.env.local` from `.env.example` and add the Firebase web-app values. These are client-side Firebase configuration values and are required for Google Sign-In.

Create `server/.env.local` for the private AI configuration:

```env
RESUMETRICS_AI_API_KEY=your_groq_api_key_here
RESUMETRICS_AI_PROVIDER=groq
RESUMETRICS_AI_DEFAULT_MODEL=your_current_groq_model
```

Never use a `VITE_` prefix for the Groq key. Never commit `.env.local`, `.env`, or any real credentials.

In Firebase Console, enable Google under Authentication → Sign-in method and allow `localhost` as an authorized domain.

## Run the project

Run the frontend and backend together:

```bash
npm run dev:all
```

Or run them separately:

```bash
npm run dev
npm run server
```

The Vite development server proxies `/api` requests to the Express server at `http://localhost:8787`.

## Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Landing page |
| `/login` | Public | Google authentication |
| `/workspace` | Authenticated | Main resume workspace |
| `/import` | Authenticated | Resume import route |
| `/create` | Authenticated | Resume creation route |
| `/evaluation` | Authenticated | Evidence review route |

## API endpoints

- `GET /api/ai/health` — confirms server AI configuration.
- `POST /api/ai/test` — sends a small test request through the AI abstraction.
- `POST /api/resume/extract` — extracts structured resume data from supplied text.
- `POST /api/resume/analyze` — compares resume skills against a job description.
- `POST /api/resume/rewrite-bullet` — returns an improved resume bullet.

AI errors are logged in the server console with details while the frontend receives safe user-facing messages. If the AI service is unavailable during role analysis, the shared deterministic matcher still compares explicit resume and job-description skills.

## Adding a resume template

1. Create a component in `src/components/templates/` that accepts the common `resumeData` object.
2. Add the template metadata and component to `src/config/resumeTemplates.js`.
3. Add any template-specific styles to the resume styling files.
4. The selector and generated editor flow will discover it from the central registry.

## Verification

Build the frontend:

```bash
npm run build
```

Start the app, visit `/`, select `TRY NOW`, authenticate with Google, and confirm that the protected workspace opens at `/workspace`.
