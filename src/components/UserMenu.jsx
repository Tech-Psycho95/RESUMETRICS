import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

function UserMenu() {
  const { currentUser, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  if (!currentUser) return null;

  // Get user display name or email
  const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
  const email = currentUser.email;
  const photoURL = currentUser.photoURL;

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="user-menu-trigger"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {photoURL ? (
          <img
            src={photoURL}
            alt={displayName}
            className="user-avatar"
          />
        ) : (
          <div className="user-avatar-placeholder">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-info">
            <div className="user-name">{displayName}</div>
            {email && <div className="user-email">{email}</div>}
          </div>
          <div className="user-menu-divider" />
          <button onClick={handleSignOut} className="user-menu-item">
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
