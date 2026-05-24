import React from 'react'
import Link from 'next/link'

export function AddLocationTile({ space }: { space?: number }) {
  const s = typeof space === 'number' ? space : 0
  return (
    <Link className="si-tile si-tile--add" href={`/l/new?space=${s}`}>
      <div className="si-tile-add-icon" aria-hidden>+</div>
      <div className="si-tile-name">Add a zone</div>
    </Link>
  )
}
