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
  sortOrder?: number | null
}

const PAGE_SIZE = 6
const MIN_PAGES = 3

export function SpacesBento({ locations }: { locations: Location[] }) {
  const [pageIdx, setPageIdx] = useState(0)

  // Build slot map keyed by sortOrder (= absolute slot index).
  // Locations with no sortOrder get fallback slots starting from 0,
  // skipping any positions already taken by explicit sortOrder values.
  const slotMap = new Map<number, Location>()
  const taken = new Set<number>()
  const unsorted: Location[] = []
  for (const loc of locations) {
    if (typeof loc.sortOrder === 'number' && !taken.has(loc.sortOrder)) {
      slotMap.set(loc.sortOrder, loc)
      taken.add(loc.sortOrder)
    } else {
      unsorted.push(loc)
    }
  }
  // Drop unsorted into the lowest-numbered free slots
  let cursor = 0
  for (const loc of unsorted) {
    while (taken.has(cursor)) cursor++
    slotMap.set(cursor, loc)
    taken.add(cursor)
    cursor++
  }

  const maxSlot = slotMap.size === 0 ? 0 : Math.max(...slotMap.keys())
  const totalPages = Math.max(MIN_PAGES, Math.ceil((maxSlot + 1) / PAGE_SIZE))
  const safePage = Math.min(pageIdx, totalPages - 1)
  const start = safePage * PAGE_SIZE
  const end = start + PAGE_SIZE

  const cells: React.ReactNode[] = []
  for (let slot = start; slot < end; slot++) {
    const loc = slotMap.get(slot)
    if (loc) {
      cells.push(<LocationTile key={`loc-${loc.id}`} location={loc as never} />)
    } else {
      cells.push(<AddLocationTile key={`add-${slot}`} targetSlot={slot} />)
    }
  }

  return (
    <div className="si-spaces">
      <BentoGrid>{cells}</BentoGrid>
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
    </div>
  )
}
