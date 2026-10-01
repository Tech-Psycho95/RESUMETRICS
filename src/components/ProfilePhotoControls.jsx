import React from 'react'

export default function ProfilePhotoControls({ photo, onChange, error = '' }) {
  if (!photo?.uploaded && !error) return null
  const [horizontal = '50%', vertical = '50%'] = String(photo?.objectPosition || '50% 50%').split(/\s+/)
  const setPosition = (axis, value) => {
    const x = axis === 'x' ? `${value}%` : horizontal
    const y = axis === 'y' ? `${value}%` : vertical
    onChange?.({ ...photo, objectPosition: `${x} ${y}` })
  }

  return <aside className="panel section-panel profile-photo-editor" aria-label="Profile photo crop controls">
    <div><span className="eyebrow">PROFILE PHOTO</span><h2>Adjust photo</h2><p className="muted">Move the image inside the circle.</p></div>
    <div className="profile-photo-adjustments">
      <label>Horizontal position <input type="range" min="0" max="100" value={parseInt(horizontal, 10) || 0} onChange={event => setPosition('x', event.target.value)} /></label>
      <label>Vertical position <input type="range" min="0" max="100" value={parseInt(vertical, 10) || 0} onChange={event => setPosition('y', event.target.value)} /></label>
    </div>
    {error && <p className="profile-photo-error" role="alert">{error}</p>}
  </aside>
}
