import React from 'react'
import Link from 'next/link'
import { accessPatternDef } from '../accessPatterns'

type Media = { id: string; url?: string; sizes?: { card?: { url?: string }; thumbnail?: { url?: string } } }

type Location = {
  id: string
  name: string
  primarilyFor?: string | null
  image?: Media | string | null
  imageFocalY?: number | null
  accessPattern?: string | null
}

export function LocationTile({ location }: { location: Location }) {
  const initialMedia = typeof location.image === 'object' && location.image !== null ? location.image : null
  // Prefer the original URL so the focal-point slider actually has the full image to reposition.
  // Falls back to sized variants if the original isn't available for some reason.
  const initialImgUrl = initialMedia?.url || initialMedia?.sizes?.card?.url || initialMedia?.sizes?.thumbnail?.url || null
  const ap = accessPatternDef(location.accessPattern)
  const focalY = typeof location.imageFocalY === 'number' ? location.imageFocalY : 50

  return (
    <Link className="si-tile" href={`/l/${location.id}`} aria-label={`Open ${location.name}`}>
      <div className="si-tile-image">
        {initialImgUrl ? (
          <img src={initialImgUrl} alt="" style={{ objectPosition: `50% ${focalY}%` }} />
        ) : (
          <div className="si-tile-placeholder" aria-hidden>📍</div>
        )}
      </div>
      <div className="si-tile-text">
        <div className="si-tile-name">{location.name}</div>
        {location.primarilyFor && <div className="si-tile-subtitle">{location.primarilyFor}</div>}
        {ap && (
          <span
            className="si-tile-ap"
            style={{ background: ap.color, color: ap.textColor }}
          >
            {ap.label}
          </span>
        )}
      </div>
    </Link>
  )
}
