# 📊 RESUMETRICS

**Evidence-led resumes that prove your impact**

[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3+-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)

---

## Overview

Resumetrics is an AI-powered resume builder that helps you create resumes backed by verifiable evidence and measurable impact. Instead of vague claims, Resumetrics connects your professional achievements to real data sources—GitHub contributions, LinkedIn experience, and coding profiles—ensuring every statement on your resume is defensible and credible.

The platform features role-alignment analysis, AI-assisted editing, and multiple professional templates designed to highlight metrics and outcomes that matter to hiring managers.

---

## ✨ Features

- **🔐 Secure Authentication** — Google Sign-In via Firebase Authentication with persistent sessions
- **📝 Professional Resume Templates** — Choose from 4 curated layouts (Clarity, Signal, Editorial, Baseline) designed for different career stories
- **🎯 Role Alignment Analysis** — Paste job descriptions and analyze how well your resume matches the target role
- **🤖 AI-Assisted Editing** — Get intelligent suggestions to strengthen connections between your experience and role requirements
- **📊 Evidence Sourcing** — Connect GitHub, LinkedIn, and LeetCode to surface verifiable proof for projects, skills, and outcomes
- **🎨 Visual Resume Editor** — Customize fonts, colors, and layouts with an intuitive canvas-based interface
- **📥 Resume Import** — Upload existing resumes in PDF, Word, PowerPoint, or TXT format
- **📤 Multi-Format Export** — Download your resume as PDF, DOCX, PPTX, or TXT
- **🔒 Protected Routes** — Secure workspace with authentication-gated access
- **📱 Responsive Design** — Clean, modern UI that works across devices

---

## 🛠 Tech Stack

- **[React](https://reactjs.org/)** — Component-based UI library
- **[Vite](https://vitejs.dev/)** — Fast build tool and development server
- **[Tailwind CSS](https://tailwindcss.com/)** — Utility-first CSS framework
- **[Firebase Authentication](https://firebase.google.com/products/auth)** — Google Sign-In and user session management
- **[React Router DOM](https://reactrouter.com/)** — Client-side routing and navigation

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- A **Firebase project** with Google Authentication enabled ([Setup Guide](https://console.firebase.google.com/))

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/resumetrics.git
   cd resumetrics
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

   Open `.env` and fill in your Firebase configuration values:

   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

   **Where to get these values:**
   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Select your project (or create a new one)
   - Navigate to **Project Settings** → **General**
   - Scroll to **Your apps** and find your web app config
   - Copy the values into your `.env` file

   **Important:** Don't use quotes around the values, and make sure there are no spaces around the `=` sign.

4. **Enable Google Authentication in Firebase**

   - In Firebase Console, go to **Authentication** → **Sign-in method**
   - Enable **Google** as a sign-in provider
   - Set a support email
   - Save changes

5. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📁 Project Structure

```
resumetrics/
├── src/
│   ├── assets/              # Images and static resources
│   │   └── resumetrics-logo.png
│   ├── components/          # Reusable React components
│   │   ├── ProtectedRoute.jsx
│   │   └── UserMenu.jsx
│   ├── context/             # React Context providers
│   │   └── AuthContext.jsx
│   ├── pages/               # Page-level components
│   │   └── Login.jsx
│   ├── firebase.js          # Firebase SDK initialization
│   ├── main.jsx             # App entry point and routing
│   ├── styles.css           # Global styles
│   ├── template.css         # Resume template styles
│   ├── layout-overrides.css # Layout customizations
│   └── interaction-overrides.css # Interaction state styles
├── .env.example             # Environment variable template
├── .gitignore               # Git ignore rules
├── index.html               # HTML entry point
├── package.json             # Dependencies and scripts
├── vite.config.js           # Vite configuration
└── README.md                # This file
```

---

## 📜 Available Scripts

### `npm run dev`

Starts the development server with hot module replacement.

```bash
npm run dev
```

### `npm run build`

Creates an optimized production build in the `dist/` folder.

```bash
npm run build
```

### `npm run preview`

Previews the production build locally.

```bash
npm run preview
```

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and component structure
- Test authentication flows after making auth-related changes
- Ensure responsive design works on mobile, tablet, and desktop
- Keep components modular and reusable
- Write meaningful commit messages

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Resume templates inspired by modern design principles for technical roles
- Built with the amazing open-source tools from the React and Vite communities
- Firebase for providing robust authentication infrastructure

---

## 📞 Support

If you encounter issues or have questions:

1. Check the [Firebase Setup Guide](FIREBASE_SETUP.md) for authentication troubleshooting
2. Open an issue in the [GitHub Issues](https://github.com/yourusername/resumetrics/issues) page
3. Review the browser console for error messages

---

**Made with ❤️ for job seekers who want their resumes to tell a data-driven story**
