'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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

type CellInfo =
  | { kind: 'loc'; loc: Location; slot: number }
  | { kind: 'add'; slot: number }

function cellId(c: CellInfo): string {
  return c.kind === 'loc' ? `loc:${c.loc.id}` : `add:${c.slot}`
}

function SortableCell({ cell }: { cell: CellInfo }) {
  const id = cellId(cell)
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : 'auto',
    position: 'relative',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {cell.kind === 'loc' && (
        <button
          ref={setActivatorNodeRef}
          {...listeners}
          type="button"
          className="si-drag-handle"
          aria-label="Drag to reorder"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden>
            <circle cx="5" cy="3" r="1.3" />
            <circle cx="11" cy="3" r="1.3" />
            <circle cx="5" cy="8" r="1.3" />
            <circle cx="11" cy="8" r="1.3" />
            <circle cx="5" cy="13" r="1.3" />
            <circle cx="11" cy="13" r="1.3" />
          </svg>
        </button>
      )}
      {cell.kind === 'loc' ? (
        <LocationTile location={cell.loc as never} />
      ) : (
        <AddLocationTile targetSlot={cell.slot} />
      )}
    </div>
  )
}

export function SpacesBento({ locations }: { locations: Location[] }) {
  const router = useRouter()
  const [pageIdx, setPageIdx] = useState(0)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  // Build slot map keyed by sortOrder.
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

  const cells: CellInfo[] = []
  for (let s = start; s < end; s++) {
    const loc = slotMap.get(s)
    cells.push(loc ? { kind: 'loc', loc, slot: s } : { kind: 'add', slot: s })
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  )

  const handleDragStart = (e: DragStartEvent) => {
    setDraggingId(String(e.active.id))
  }

  const handleDragEnd = async (e: DragEndEvent) => {
    setDraggingId(null)
    const { active, over } = e
    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)

    // Active must be a real location tile.
    if (!activeId.startsWith('loc:')) return
    const activeLocId = activeId.slice('loc:'.length)
    const activeLoc = locations.find((l) => l.id === activeLocId)
    if (!activeLoc) return

    const oldSlot = typeof activeLoc.sortOrder === 'number' ? activeLoc.sortOrder : null
    if (oldSlot === null) return

    let targetSlot: number
    let displacedLoc: Location | undefined

    if (overId.startsWith('add:')) {
      targetSlot = Number.parseInt(overId.slice('add:'.length), 10)
    } else if (overId.startsWith('loc:')) {
      const overLocId = overId.slice('loc:'.length)
      displacedLoc = locations.find((l) => l.id === overLocId)
      if (!displacedLoc || typeof displacedLoc.sortOrder !== 'number') return
      targetSlot = displacedLoc.sortOrder
    } else {
      return
    }

    if (targetSlot === oldSlot) return

    // Two-phase write to avoid unique-slot collisions:
    // 1. Park displaced (if any) at a temporary slot that's clearly out of band.
    // 2. Move active to target slot.
    // 3. Move displaced from parking to active's old slot.
    const TEMP_SLOT = -1

    try {
      if (displacedLoc) {
        await fetch(`/api/locations/${displacedLoc.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: TEMP_SLOT }),
        })
      }
      await fetch(`/api/locations/${activeLoc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: targetSlot }),
      })
      if (displacedLoc) {
        await fetch(`/api/locations/${displacedLoc.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: oldSlot }),
        })
      }
      router.refresh()
    } catch {
      router.refresh()
    }
  }

  // Reset page if locations shrink below current page.
  useEffect(() => {
    if (safePage !== pageIdx) setPageIdx(safePage)
  }, [safePage, pageIdx])

  const cellIds = cells.map(cellId)

  return (
    <div className="si-spaces">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={cellIds} strategy={rectSortingStrategy}>
          <BentoGrid>
            {cells.map((c) => (
              <SortableCell key={cellId(c)} cell={c} />
            ))}
          </BentoGrid>
        </SortableContext>
      </DndContext>
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
      {draggingId && <div className="si-spaces-hint">Drag onto another tile to swap, or onto an empty slot to move.</div>}
    </div>
  )
}
