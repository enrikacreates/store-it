import React from 'react'
import Link from 'next/link'

type Media = { id: string; url?: string; sizes?: { card?: { url?: string }; thumbnail?: { url?: string } } }

type Location = {
  id: string
  name: string
  primarilyFor?: string | null
  image?: Media | string | null
  accessPattern?: string | null
}

export function LocationTile({ location }: { location: Location }) {
  const initialMedia = typeof location.image === 'object' && location.image !== null ? location.image : null
  const initialImgUrl = initialMedia?.sizes?.card?.url || initialMedia?.sizes?.thumbnail?.url || initialMedia?.url || null

  return (
    <Link className="si-tile" href={`/l/${location.id}`} aria-label={`Open ${location.name}`}>
      <div className="si-tile-image">
        {initialImgUrl ? <img src={initialImgUrl} alt="" /> : <div className="si-tile-placeholder" aria-hidden>📍</div>}
      </div>
      <div className="si-tile-text">
        <div className="si-tile-name">{location.name}</div>
        {location.primarilyFor && <div className="si-tile-subtitle">{location.primarilyFor}</div>}
      </div>
    </Link>
  )
}
