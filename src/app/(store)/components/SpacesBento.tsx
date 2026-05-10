'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  pointerWithin,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
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

function DragHandleSvg() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden>
      <circle cx="5" cy="3" r="1.3" />
      <circle cx="11" cy="3" r="1.3" />
      <circle cx="5" cy="8" r="1.3" />
      <circle cx="11" cy="8" r="1.3" />
      <circle cx="5" cy="13" r="1.3" />
      <circle cx="11" cy="13" r="1.3" />
    </svg>
  )
}

function DraggableLocationCell({ loc }: { loc: Location }) {
  const draggable = useDraggable({ id: `loc:${loc.id}` })
  const droppable = useDroppable({ id: `loc:${loc.id}` })

  const setRef = (node: HTMLElement | null) => {
    draggable.setNodeRef(node)
    droppable.setNodeRef(node)
  }

  // No transform on the original — the DragOverlay handles the moving preview.
  const style: React.CSSProperties = {
    position: 'relative',
    height: '100%',
    width: '100%',
    opacity: draggable.isDragging ? 0.3 : 1,
    outline:
      droppable.isOver && !draggable.isDragging
        ? '3px solid var(--orange)'
        : 'none',
    outlineOffset: droppable.isOver && !draggable.isDragging ? '-3px' : 0,
  }

  return (
    <div ref={setRef} style={style} {...draggable.attributes}>
      <button
        ref={draggable.setActivatorNodeRef}
        {...draggable.listeners}
        type="button"
        className="si-drag-handle"
        aria-label="Drag to reorder"
      >
        <DragHandleSvg />
      </button>
      <LocationTile location={loc as never} />
    </div>
  )
}

function DroppableAddCell({ slot }: { slot: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: `add:${slot}` })
  const style: React.CSSProperties = {
    position: 'relative',
    height: '100%',
    width: '100%',
    outline: isOver ? '3px solid var(--orange)' : 'none',
    outlineOffset: isOver ? '-3px' : 0,
  }
  return (
    <div ref={setNodeRef} style={style}>
      <AddLocationTile targetSlot={slot} />
    </div>
  )
}

function normalize(locs: Location[]): Location[] {
  return locs.map((l) => ({ ...l, id: String(l.id) }))
}

export function SpacesBento({ locations: propLocations }: { locations: Location[] }) {
  const router = useRouter()
  const [pageIdx, setPageIdx] = useState(0)
  const [activeDragLoc, setActiveDragLoc] = useState<Location | null>(null)
  const [locations, setLocations] = useState<Location[]>(() => normalize(propLocations))

  useEffect(() => {
    setLocations(normalize(propLocations))
  }, [propLocations])

  // Build slot map keyed by sortOrder, plus reverse locId→slot lookup.
  const slotMap = new Map<number, Location>()
  const locToSlot = new Map<string, number>()
  const taken = new Set<number>()
  const unsorted: Location[] = []
  for (const loc of locations) {
    if (typeof loc.sortOrder === 'number' && !taken.has(loc.sortOrder)) {
      slotMap.set(loc.sortOrder, loc)
      locToSlot.set(loc.id, loc.sortOrder)
      taken.add(loc.sortOrder)
    } else {
      unsorted.push(loc)
    }
  }
  let cursor = 0
  for (const loc of unsorted) {
    while (taken.has(cursor)) cursor++
    slotMap.set(cursor, loc)
    locToSlot.set(loc.id, cursor)
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
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  )

  const handleDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id)
    if (id.startsWith('loc:')) {
      const locId = id.slice('loc:'.length)
      const loc = locations.find((l) => l.id === locId) ?? null
      setActiveDragLoc(loc)
    }
  }

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveDragLoc(null)
    const { active, over } = e
    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)

    if (!activeId.startsWith('loc:')) return
    const activeLocId = activeId.slice('loc:'.length)
    const activeLoc = locations.find((l) => String(l.id) === activeLocId)
    if (!activeLoc) return

    const oldSlot = locToSlot.get(String(activeLoc.id))
    if (oldSlot === undefined) return

    let targetSlot: number
    let displacedLoc: Location | undefined

    if (overId.startsWith('add:')) {
      targetSlot = Number.parseInt(overId.slice('add:'.length), 10)
    } else if (overId.startsWith('loc:')) {
      const overLocId = overId.slice('loc:'.length)
      displacedLoc = locations.find((l) => String(l.id) === overLocId)
      const displacedSlot = displacedLoc ? locToSlot.get(String(displacedLoc.id)) : undefined
      if (!displacedLoc || displacedSlot === undefined) return
      targetSlot = displacedSlot
    } else {
      return
    }

    if (targetSlot === oldSlot) return

    // Optimistic local update
    setLocations((prev) =>
      prev.map((l) => {
        if (String(l.id) === String(activeLoc.id)) return { ...l, sortOrder: targetSlot }
        if (displacedLoc && String(l.id) === String(displacedLoc.id))
          return { ...l, sortOrder: oldSlot }
        return l
      }),
    )

    try {
      const calls: Promise<Response>[] = [
        fetch(`/api/locations/${activeLoc.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: targetSlot }),
        }),
      ]
      if (displacedLoc) {
        calls.push(
          fetch(`/api/locations/${displacedLoc.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sortOrder: oldSlot }),
          }),
        )
      }
      await Promise.all(calls)
      router.refresh()
    } catch {
      router.refresh()
    }
  }

  useEffect(() => {
    if (safePage !== pageIdx) setPageIdx(safePage)
  }, [safePage, pageIdx])

  return (
    <div className="si-spaces">
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDragLoc(null)}
      >
        <BentoGrid>
          {cells.map((c) =>
            c.kind === 'loc' ? (
              <DraggableLocationCell key={cellId(c)} loc={c.loc} />
            ) : (
              <DroppableAddCell key={cellId(c)} slot={c.slot} />
            ),
          )}
        </BentoGrid>
        <DragOverlay dropAnimation={null}>
          {activeDragLoc ? (
            <div className="si-drag-overlay">
              <LocationTile location={activeDragLoc as never} />
            </div>
          ) : null}
        </DragOverlay>
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
      {activeDragLoc && (
        <div className="si-spaces-hint">Drop on a tile to swap, or on an empty slot to move.</div>
      )}
    </div>
  )
}
