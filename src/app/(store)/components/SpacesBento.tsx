'use client'

import React, { useState } from 'react'
import { BentoGrid } from './BentoGrid'
import { LocationTile } from './LocationTile'
import { AddLocationTile } from './AddLocationTile'

type Media = { id: string; url?: string; sizes?: { card?: { url?: string }; thumbnail?: { url?: string } } }
type Location = {
  id: string
  name: string
  primarilyFor?: string | null
  image?: Media | string | null
  accessPattern?: string | null
}

const PAGE_SIZE = 6

export function SpacesBento({ locations }: { locations: Location[] }) {
  const [pageIdx, setPageIdx] = useState(0)

  // Always show at least one Add tile after the locations; pad page with more Add tiles to fill 6.
  const totalSlotsNeeded = Math.max(PAGE_SIZE, locations.length + 1)
  const totalPages = Math.ceil(totalSlotsNeeded / PAGE_SIZE)
  const safePage = Math.min(pageIdx, totalPages - 1)

  const start = safePage * PAGE_SIZE
  const end = start + PAGE_SIZE

  const cells: React.ReactNode[] = []
  for (let i = start; i < end; i++) {
    if (i < locations.length) {
      cells.push(<LocationTile key={locations[i].id} location={locations[i] as never} />)
    } else {
      cells.push(<AddLocationTile key={`add-${i}`} />)
    }
  }

  return (
    <div className="si-spaces">
      <BentoGrid>{cells}</BentoGrid>
      {totalPages > 1 && (
        <nav className="si-bento-nav" aria-label="Spaces pages">
          <button
            type="button"
            className="si-bento-nav-btn"
            onClick={() => setPageIdx((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            aria-label="Previous page"
          >
            ‹
          </button>
          <span className="si-bento-nav-info">{safePage + 1} / {totalPages}</span>
          <button
            type="button"
            className="si-bento-nav-btn"
            onClick={() => setPageIdx((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage === totalPages - 1}
            aria-label="Next page"
          >
            ›
          </button>
        </nav>
      )}
    </div>
  )
}
