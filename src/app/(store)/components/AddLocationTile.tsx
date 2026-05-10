import React from 'react'
import Link from 'next/link'

export function AddLocationTile({ targetSlot }: { parentId?: string; targetSlot?: number }) {
  const slot = typeof targetSlot === 'number' ? targetSlot : 0
  return (
    <Link className="si-tile si-tile--add" href={`/l/new?slot=${slot}`}>
      <div className="si-tile-add-icon" aria-hidden>+</div>
      <div className="si-tile-name">Add a space</div>
    </Link>
  )
}
