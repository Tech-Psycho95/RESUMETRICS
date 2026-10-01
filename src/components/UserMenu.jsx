import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function UserMenu() {
  const { currentUser, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleOutsideClick = event => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false)
    }
    const handleEscape = event => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  if (!currentUser) return null

  const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User'
  const firstName = displayName.trim().split(/\s+/)[0] || 'User'
  const initials = displayName.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()
  const profilePhoto = currentUser.photoURL || currentUser.providerData?.find(provider => provider.providerId === 'google.com')?.photoURL

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (logoutError) {
      console.error('Google sign-out failed:', logoutError)
    } finally {
      setOpen(false)
      navigate('/login', { replace: true })
    }
  }

  return <div className={`user-menu${open ? ' open' : ''}`} ref={menuRef}>
    <div className="user-menu-dropdown" id="user-menu-panel" inert={!open}>
      <div className="user-menu-panel-inner">
        {currentUser.email && <div className="user-menu-email">{currentUser.email}</div>}
        <button className="user-menu-item" type="button" onClick={handleLogout}>Log out</button>
      </div>
    </div>
    <button className="user-menu-trigger" type="button" onClick={() => setOpen(value => !value)} aria-label={open ? 'Close account menu' : 'Open account menu'} aria-expanded={open} aria-controls="user-menu-panel">
      {profilePhoto ? <img className="user-avatar" src={profilePhoto} alt={`${firstName}'s profile`} referrerPolicy="no-referrer" /> : <span className="user-avatar-placeholder">{initials}</span>}
      <span className="user-menu-label"><strong>{firstName}</strong><small>Google account</small></span>
    </button>
  </div>
}
