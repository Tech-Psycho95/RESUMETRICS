import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import logo from '../assets/resumetrics-logo.png'
import './login.css'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signInWithGoogle, isConfigured } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const from = location.state?.from?.pathname || '/workspace'

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      navigate(from, { replace: true })
    } catch (signInError) {
      console.error('Google sign-in failed:', signInError)
      setError(signInError?.code === 'auth/popup-closed-by-user'
        ? 'The sign-in window was closed. Try again when you are ready.'
        : 'Google sign-in could not be completed. Check your Firebase setup and try again.')
    } finally {
      setLoading(false)
    }
  }

  return <main className="login-page">
    <section className="login-card" aria-labelledby="login-title">
      <img className="login-logo" src={logo} alt="Resumetrics" />
      <span className="eyebrow">RESUMETRICS</span>
      <h1 id="login-title">Welcome.</h1>
      <p className="login-subtitle">Build an evidence-led resume with a workspace that keeps your story in focus.</p>
      {!isConfigured && <div className="login-setup-note">Authentication is not configured yet. Add the Firebase values from <code>.env.example</code>, then restart Vite.</div>}
      {error && <div className="login-error" role="alert">{error}</div>}
      <button className="primary-button login-button" type="button" onClick={handleGoogleSignIn} disabled={loading || !isConfigured}>
        <svg className="google-mark" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.15c1.84-1.7 2.9-4.2 2.9-7.26Z" />
          <path fill="#34A853" d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.15-2.45c-.87.58-1.98.92-3.3.92-2.54 0-4.7-1.72-5.47-4.03H3.28v2.53A9.75 9.75 0 0 0 12 21.5Z" />
          <path fill="#FBBC05" d="M6.53 13.58a5.86 5.86 0 0 1 0-3.16V7.89H3.28a9.75 9.75 0 0 0 0 8.22l3.25-2.53Z" />
          <path fill="#EA4335" d="M12 6.39c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.51 14.63 2.5 12 2.5a9.75 9.75 0 0 0-8.72 5.39l3.25 2.53C7.3 8.11 9.46 6.39 12 6.39Z" />
        </svg>
        {loading ? 'Signing in…' : 'Continue with Google'}
      </button>
      <p className="login-legal">Your account keeps your resume workspace private.</p>
    </section>
  </main>
}
