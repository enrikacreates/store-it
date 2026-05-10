import React from 'react'
import Link from 'next/link'

type Media = { url?: string; sizes?: { card?: { url?: string }; thumbnail?: { url?: string } } }

type Location = {
  id: string
  name: string
  image?: Media | string | null
}

export function LocationTile({ location }: { location: Location }) {
  const media = typeof location.image === 'object' && location.image !== null ? location.image : null
  const imgUrl = media?.sizes?.card?.url || media?.sizes?.thumbnail?.url || media?.url

  return (
    <Link href={`/l/${location.id}`} className="si-tile">
      <div className="si-tile-image">
        {imgUrl ? <img src={imgUrl} alt="" /> : <div className="si-tile-placeholder" aria-hidden>📍</div>}
      </div>
      <div className="si-tile-name">{location.name}</div>
    </Link>
  )
}
