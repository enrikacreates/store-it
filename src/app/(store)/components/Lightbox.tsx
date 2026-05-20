'use client'

import React, { useEffect } from 'react'

type Props = {
  src: string
  caption?: string | null
  onClose: () => void
}

export function Lightbox({ src, caption, onClose }: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    // Prevent body scroll while open
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = original
    }
  }, [onClose])

  return (
    <div className="si-lightbox" onClick={onClose} role="dialog" aria-modal="true">
      <button
        type="button"
        className="si-lightbox-close"
        onClick={onClose}
        aria-label="Close"
      >
        ✕
      </button>
      <div className="si-lightbox-inner" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={caption ?? ''} />
        {caption && <p className="si-lightbox-caption">{caption}</p>}
      </div>
    </div>
  )
}
