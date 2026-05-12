'use client'

import React, { useState } from 'react'

export function LogoutButton() {
  const [working, setWorking] = useState(false)

  const handleClick = async () => {
    setWorking(true)
    try {
      await fetch('/api/users/logout', { method: 'POST' })
    } catch {
      /* ignore — we still navigate */
    }
    // Hard navigation to clear any cached client state
    window.location.href = '/signup'
  }

  return (
    <button
      type="button"
      className="si-account"
      onClick={handleClick}
      disabled={working}
      aria-label="Sign out"
      title="Sign out"
    >
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    </button>
  )
}
