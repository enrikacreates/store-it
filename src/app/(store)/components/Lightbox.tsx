'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

// Minimum horizontal travel (px) to count as a swipe, and how much more horizontal
// than vertical it must be so vertical scrolls/pinch don't trigger navigation.
const SWIPE_THRESHOLD = 50

export type LightboxImage = { src: string; caption?: string | null }

type Props = {
  images: LightboxImage[]
  /** Index of the image to show first. */
  index?: number
  onClose: () => void
}

export function Lightbox({ images, index = 0, onClose }: Props) {
  const count = images.length
  const [current, setCurrent] = useState(index)

  // Re-sync if the opener changes which image/list is shown.
  useEffect(() => {
    setCurrent(index)
  }, [index, images])

  const goPrev = useCallback(() => {
    setCurrent((c) => (count === 0 ? 0 : (c - 1 + count) % count))
  }, [count])
  const goNext = useCallback(() => {
    setCurrent((c) => (count === 0 ? 0 : (c + 1) % count))
  }, [count])

  // Touch swipe navigation (mobile). Track the start point; on release, if the gesture
  // is a mostly-horizontal swipe past the threshold, go to the prev/next image.
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current
    touchStart.current = null
    if (!start || count < 2) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return
    if (dx < 0) goNext()
    else goPrev()
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    document.addEventListener('keydown', handleKey)
    // Prevent body scroll while open
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = original
    }
  }, [onClose, goPrev, goNext])

  if (count === 0) return null
  const safeIndex = Math.min(Math.max(current, 0), count - 1)
  const active = images[safeIndex]
  const hasMultiple = count > 1

  return (
    <div
      className="si-lightbox"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="si-lightbox-close"
        onClick={onClose}
        aria-label="Close"
      >
        ✕
      </button>

      {hasMultiple && (
        <button
          type="button"
          className="si-lightbox-nav si-lightbox-prev"
          onClick={(e) => {
            e.stopPropagation()
            goPrev()
          }}
          aria-label="Previous image"
        >
          ‹
        </button>
      )}

      <div className="si-lightbox-inner" onClick={(e) => e.stopPropagation()}>
        <img src={active.src} alt={active.caption ?? ''} />
        {active.caption && <p className="si-lightbox-caption">{active.caption}</p>}
        {hasMultiple && (
          <p className="si-lightbox-counter">{safeIndex + 1} / {count}</p>
        )}
      </div>

      {hasMultiple && (
        <button
          type="button"
          className="si-lightbox-nav si-lightbox-next"
          onClick={(e) => {
            e.stopPropagation()
            goNext()
          }}
          aria-label="Next image"
        >
          ›
        </button>
      )}
    </div>
  )
}
