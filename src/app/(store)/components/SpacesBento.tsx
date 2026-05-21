'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
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
  needsOrganizing?: boolean | null
  organizeBy?: string | null
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

function DraggableLocationCell({ loc, dimmed = false }: { loc: Location; dimmed?: boolean }) {
  const draggable = useDraggable({ id: `loc:${loc.id}` })
  const droppable = useDroppable({ id: `loc:${loc.id}` })

  const setRef = (node: HTMLElement | null) => {
    draggable.setNodeRef(node)
    droppable.setNodeRef(node)
  }

  // No transform on the original — the DragOverlay handles the moving preview.
  const baseOpacity = draggable.isDragging ? 0.3 : dimmed ? 0.22 : 1
  const style: React.CSSProperties = {
    position: 'relative',
    height: '100%',
    width: '100%',
    opacity: baseOpacity,
    transition: 'opacity 160ms ease',
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

function PageLabel({
  pageIndex,
  name,
  onSave,
}: {
  pageIndex: number
  name: string
  onSave: (pageIndex: number, name: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)

  useEffect(() => {
    setDraft(name)
  }, [name, pageIndex])

  const commit = () => {
    setEditing(false)
    if (draft.trim() !== name) onSave(pageIndex, draft.trim())
  }

  if (editing) {
    return (
      <input
        className="si-page-label-input"
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            setDraft(name)
            setEditing(false)
          }
        }}
        autoFocus
        maxLength={60}
        placeholder="Name this page (e.g. Living Room)"
      />
    )
  }

  return (
    <button
      type="button"
      className={`si-page-label ${name ? '' : 'si-page-label--empty'}`}
      onClick={() => setEditing(true)}
      title="Click to rename this page"
    >
      {name || '+ Name this page'}
    </button>
  )
}

type PageJumpEntry = { pageIndex: number; name: string; locCount: number }

/** Chevron dropdown next to the page name — jump directly to any page by name. */
function PageJumpDropdown({
  pages,
  currentPage,
  onJump,
}: {
  pages: PageJumpEntry[]
  currentPage: number
  onJump: (pageIndex: number) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div className="si-page-jump" ref={ref}>
      <button
        type="button"
        className={`si-page-jump-toggle ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Jump to a page"
        title="Jump to a page"
      >
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul className="si-page-jump-menu" role="listbox" aria-label="Pages">
          {pages.map((p) => (
            <li key={p.pageIndex}>
              <button
                type="button"
                role="option"
                aria-selected={p.pageIndex === currentPage}
                className={`si-page-jump-item ${p.pageIndex === currentPage ? 'is-current' : ''}`}
                onClick={() => {
                  onJump(p.pageIndex)
                  setOpen(false)
                }}
              >
                <span className="si-page-jump-num">{p.pageIndex + 1}</span>
                <span className={`si-page-jump-name ${p.name ? '' : 'si-page-jump-name--empty'}`}>
                  {p.name || 'Unnamed page'}
                </span>
                {p.locCount > 0 && <span className="si-page-jump-count">{p.locCount}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
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

type PageName = { id: string; pageIndex: number; name: string }

export function SpacesBento({
  locations: propLocations,
  initialPageNames = [],
}: {
  locations: Location[]
  initialPageNames?: PageName[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // The current page is derived from the ?page= URL param — the single source of truth.
  // This lets the brand logo (href="/") reset to page 1 from anywhere, and makes the
  // browser back button restore the page the user came from.
  const rawPage = searchParams?.get('page')
  const parsedPage = rawPage ? Number.parseInt(rawPage, 10) : 0
  const urlPage = Number.isFinite(parsedPage) && parsedPage >= 0 ? parsedPage : 0
  // Navigate to a page by writing the ?page= param (router.replace keeps history tidy).
  const goToPage = useCallback(
    (n: number) => {
      const target = Math.max(0, n)
      const params = new URLSearchParams(searchParams?.toString() ?? '')
      if (target > 0) params.set('page', String(target))
      else params.delete('page')
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams],
  )
  const [activeDragLoc, setActiveDragLoc] = useState<Location | null>(null)
  const [locations, setLocations] = useState<Location[]>(() => normalize(propLocations))
  const [pageNames, setPageNames] = useState<PageName[]>(initialPageNames)
  // "Organize it?" filter — when on, dim tiles that aren't flagged so you can focus on what needs attention.
  const [organizeFilter, setOrganizeFilter] = useState(false)
  // Empty pages the user has explicitly added via "+ Add page". Reset whenever locations change
  // (because a new location on the empty page bumps baseTotalPages — no need to add on top).
  const [extraPages, setExtraPages] = useState(0)
  useEffect(() => {
    setExtraPages(0)
  }, [locations.length])
  const organizeCount = locations.filter((l) => !!l.needsOrganizing).length
  // dnd-kit generates auto-incrementing aria IDs that mismatch between SSR and CSR.
  // Defer rendering its context until after client mount to avoid hydration errors.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setLocations(normalize(propLocations))
  }, [propLocations])

  useEffect(() => {
    setPageNames(initialPageNames)
  }, [initialPageNames])

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

  // Pagination: pages are derived from slot usage (MIN_PAGES floor). The user can request
  // extra empty pages via the "+ Add page" button — those go away once any location lands
  // on them (locations.length change resets the counter).
  const maxSlot = slotMap.size === 0 ? 0 : Math.max(...slotMap.keys())
  const baseTotalPages = Math.max(MIN_PAGES, Math.ceil((maxSlot + 1) / PAGE_SIZE))
  const totalPages = baseTotalPages + extraPages
  const safePage = Math.min(urlPage, totalPages - 1)
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

  const handleSavePageName = async (idx: number, newName: string) => {
    const trimmed = newName.trim()
    const existing = pageNames.find((p) => p.pageIndex === idx)

    if (trimmed === '') {
      // Empty name → delete the record if one exists
      if (existing) {
        setPageNames((prev) => prev.filter((p) => p.id !== existing.id))
        try {
          await fetch(`/api/space-pages/${existing.id}`, { method: 'DELETE' })
        } catch { /* ignore */ }
      }
      return
    }

    if (existing) {
      if (existing.name === trimmed) return
      const before = existing.name
      setPageNames((prev) => prev.map((p) => (p.id === existing.id ? { ...p, name: trimmed } : p)))
      try {
        const res = await fetch(`/api/space-pages/${existing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmed }),
        })
        if (!res.ok) {
          setPageNames((prev) => prev.map((p) => (p.id === existing.id ? { ...p, name: before } : p)))
        }
      } catch {
        setPageNames((prev) => prev.map((p) => (p.id === existing.id ? { ...p, name: before } : p)))
      }
    } else {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      setPageNames((prev) => [...prev, { id: tempId, pageIndex: idx, name: trimmed }])
      try {
        const res = await fetch('/api/space-pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageIndex: idx, name: trimmed }),
        })
        if (!res.ok) {
          setPageNames((prev) => prev.filter((p) => p.id !== tempId))
          return
        }
        const data = await res.json()
        const real = data?.doc
        if (real?.id) {
          setPageNames((prev) =>
            prev.map((p) =>
              p.id === tempId ? { id: String(real.id), pageIndex: idx, name: real.name } : p,
            ),
          )
        }
      } catch {
        setPageNames((prev) => prev.filter((p) => p.id !== tempId))
      }
    }
  }

  const currentPageName = pageNames.find((p) => p.pageIndex === safePage)?.name ?? ''

  // Build the page-jump list: one entry per page, with its name and how many spaces it holds.
  const pageList: PageJumpEntry[] = Array.from({ length: totalPages }, (_, i) => ({
    pageIndex: i,
    name: pageNames.find((p) => p.pageIndex === i)?.name ?? '',
    locCount: locations.filter((l) => {
      const s = locToSlot.get(l.id)
      return s !== undefined && Math.floor(s / PAGE_SIZE) === i
    }).length,
  }))

  return (
    <div className="si-spaces">
      <div className="si-spaces-top">
        <div className="si-spaces-namebar">
          <PageLabel pageIndex={safePage} name={currentPageName} onSave={handleSavePageName} />
          <PageJumpDropdown pages={pageList} currentPage={safePage} onJump={(i) => goToPage(i)} />
        </div>
        <button
          type="button"
          className={`si-organize-pill ${organizeFilter ? 'is-on' : ''} ${organizeCount === 0 ? 'is-empty' : ''}`}
          onClick={() => setOrganizeFilter((v) => !v)}
          aria-pressed={organizeFilter}
          title={organizeCount === 0 ? 'No spaces flagged as needing organizing' : organizeFilter ? 'Show all spaces' : 'Focus on spaces flagged as needing organizing'}
          disabled={organizeCount === 0}
        >
          <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden>
            <path d="M3 1.5a.75.75 0 0 1 1.5 0V2h7.25a.75.75 0 0 1 .6 1.2L10.5 6l1.85 2.8a.75.75 0 0 1-.6 1.2H4.5v4.5a.75.75 0 0 1-1.5 0V1.5z" />
          </svg>
          {organizeFilter ? 'Showing flagged' : 'Organize it?'}
          {organizeCount > 0 && <span className="si-organize-pill-count">{organizeCount}</span>}
        </button>
      </div>
      {mounted ? (
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
                <DraggableLocationCell
                  key={cellId(c)}
                  loc={c.loc}
                  dimmed={organizeFilter && !c.loc.needsOrganizing}
                />
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
      ) : (
        // SSR + first client render: no DnD, plain tiles. Swapped in after mount.
        <BentoGrid>
          {cells.map((c) =>
            c.kind === 'loc' ? (
              <div
                key={cellId(c)}
                style={{
                  height: '100%',
                  width: '100%',
                  opacity: organizeFilter && !c.loc.needsOrganizing ? 0.22 : 1,
                  transition: 'opacity 160ms ease',
                }}
              >
                <LocationTile location={c.loc as never} />
              </div>
            ) : (
              <AddLocationTile key={cellId(c)} targetSlot={c.slot} />
            ),
          )}
        </BentoGrid>
      )}
      <nav className="si-bento-nav" aria-label="Spaces pages">
        <button
          type="button"
          className="si-bento-nav-btn"
          onClick={() => goToPage(safePage - 1)}
          disabled={safePage === 0}
          aria-label="Previous page"
        >
          ‹
        </button>
        <span className="si-bento-nav-info">{safePage + 1} / {totalPages}</span>
        <button
          type="button"
          className="si-bento-nav-btn"
          onClick={() => goToPage(safePage + 1)}
          disabled={safePage === totalPages - 1}
          aria-label="Next page"
        >
          ›
        </button>
        <button
          type="button"
          className="si-bento-nav-add"
          onClick={() => {
            // Add a fresh empty page and jump to it so the user can start placing locations.
            const newPageIdx = totalPages
            setExtraPages((n) => n + 1)
            goToPage(newPageIdx)
          }}
          title="Add a new empty page"
          aria-label="Add a new empty page"
        >
          + Add page
        </button>
      </nav>
      {activeDragLoc && (
        <div className="si-spaces-hint">Drop on a tile to swap, or on an empty slot to move.</div>
      )}
    </div>
  )
}
