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
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
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

  return <div className="user-menu" ref={menuRef}>
    <button className="user-menu-trigger" type="button" onClick={() => setOpen(value => !value)} aria-label="Open account menu" aria-expanded={open}>
      {profilePhoto ? <img className="user-avatar" src={profilePhoto} alt={`${firstName}'s profile`} referrerPolicy="no-referrer" /> : <span className="user-avatar-placeholder">{initials}</span>}
      <span className="user-menu-label"><strong>{firstName}</strong><small>Google account</small></span>
      <span className={`user-menu-chevron ${open ? 'open' : ''}`} aria-hidden="true">⌄</span>
    </button>
    {open && <div className="user-menu-dropdown" role="menu">
      {currentUser.email && <div className="user-menu-email">{currentUser.email}</div>}
      <button className="user-menu-item" type="button" onClick={handleLogout}>Log out</button>
    </div>}
  </div>
}
