'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ItemRow } from '../../components/ItemRow'
import { Lightbox, type LightboxImage } from '../../components/Lightbox'
import { ACCESS_PATTERNS } from '../../accessPatterns'

type Media = { id: string; url?: string; sizes?: { card?: { url?: string }; hero?: { url?: string }; thumbnail?: { url?: string } } }
type GalleryEntry = { id?: string; image: Media | string; caption?: string | null }

type Loc = { id: string; name: string }
type Cat = { id: string; name: string }
type Tag = { id: string; name: string }
type Item = {
  id: string
  name: string
  description?: string | null
  location?: Loc | string | null
  category?: Cat | string | null
  tags?: (Tag | string)[] | null
  image?: Media | string | null
  accessPattern?: string | null
}

type Location = {
  id: string
  name: string
  primarilyFor?: string | null
  description?: string | null
  image?: Media | string | null
  imageFocalY?: number | null
  imageFocalX?: number | null
  imageZoom?: number | null
  accessPattern?: string | null
  gallery?: GalleryEntry[] | null
  sortOrder?: number | null
  space?: number | null
  isHotspot?: boolean | null
  hotspotImage?: Media | string | null
  hotspotAfterImage?: Media | string | null
  needsOrganizing?: boolean | null
  organizeBy?: string | null
  lastOrganizedAt?: string | null
}

type Props = {
  location: Location | null
  /** When provided, the form is in create mode: the new zone is placed in this space, at this order. */
  creatingSpace?: number
  creatingSortOrder?: number
  items: Item[]
  locations: Loc[]
  tags: Tag[]
  categories: Cat[]
  /** Optional list of named bento pages — used to render the breadcrumb. */
  pageNames?: { pageIndex: number; name: string }[]
  /** Unassigned items (no location) offered in the "assign existing" picker. */
  unassignedItems?: { id: string; name: string }[]
}

/** Mirrors SpacesBento.PAGE_SIZE — keep these in sync. */
const BENTO_PAGE_SIZE = 6

function mediaUrl(m: Media | string | null | undefined, size: 'card' | 'hero' | 'thumbnail' = 'hero'): string | null {
  if (!m || typeof m !== 'object') return null
  return m.sizes?.[size]?.url || m.sizes?.card?.url || m.sizes?.thumbnail?.url || m.url || null
}

/** Coerce a relationship ID to a number (Payload Postgres adapter requires numeric IDs). */
function toIdNum(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number.parseInt(String(v), 10)
  return Number.isFinite(n) ? n : null
}

export function LocationDetail({ location, creatingSpace, creatingSortOrder, items, locations, tags, categories, pageNames = [], unassignedItems = [] }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Item id to highlight when arriving from "Where is it?" search (?item=<id>).
  const highlightItemId = searchParams?.get('item') ?? null
  const isCreating = location === null
  const leadInput = useRef<HTMLInputElement>(null)
  const galleryInput = useRef<HTMLInputElement>(null)

  // Always editing — no read-only view; clicking from the dashboard lands directly in the editor.
  const [editing, setEditing] = useState(true)

  const initialLeadId = location && typeof location.image === 'object' && location.image ? (location.image.id ?? null) : null
  // Use ORIGINAL upload URL so the focal-point slider has the full uncropped image to reposition.
  // The pre-cropped 'hero' variant is already 16:9, leaving almost nothing to move vertically.
  const initialLeadUrl =
    location && typeof location.image === 'object' && location.image
      ? (location.image.url ?? mediaUrl(location.image, 'hero'))
      : null
  const initialHotspotId =
    location && typeof location.hotspotImage === 'object' && location.hotspotImage
      ? (location.hotspotImage.id ?? null)
      : null
  // Use ORIGINAL upload URL for hotspot so vertical photos keep their natural aspect ratio.
  const initialHotspotUrl =
    location && typeof location.hotspotImage === 'object' && location.hotspotImage
      ? (location.hotspotImage.url ?? mediaUrl(location.hotspotImage, 'hero'))
      : null
  const initialAfterId =
    location && typeof location.hotspotAfterImage === 'object' && location.hotspotAfterImage
      ? (location.hotspotAfterImage.id ?? null)
      : null
  const initialAfterUrl =
    location && typeof location.hotspotAfterImage === 'object' && location.hotspotAfterImage
      ? (location.hotspotAfterImage.url ?? mediaUrl(location.hotspotAfterImage, 'hero'))
      : null

  const initialSlot = isCreating
    ? (creatingSortOrder ?? 0)
    : (typeof location?.sortOrder === 'number' ? location.sortOrder : 0)
  // Which Space this zone belongs to (0-based). Falls back to the legacy floor(sortOrder/6).
  const initialSpace = isCreating
    ? (creatingSpace ?? 0)
    : (typeof location?.space === 'number'
        ? location.space
        : Math.floor((typeof location?.sortOrder === 'number' ? location.sortOrder : 0) / BENTO_PAGE_SIZE))
  const [name, setName] = useState(location?.name ?? '')
  const [primarilyFor, setPrimarilyFor] = useState(location?.primarilyFor ?? '')
  const [accessPattern, setAccessPattern] = useState<string>(location?.accessPattern ?? '')
  const [notes, setNotes] = useState(location?.description ?? '')
  const [slot, setSlot] = useState<number>(initialSlot)
  const [spaceIdx, setSpaceIdx] = useState<number>(initialSpace)
  const [focalY, setFocalY] = useState<number>(
    typeof location?.imageFocalY === 'number' ? location.imageFocalY : 50,
  )
  const [focalX, setFocalX] = useState<number>(
    typeof location?.imageFocalX === 'number' ? location.imageFocalX : 50,
  )
  const [zoom, setZoom] = useState<number>(
    typeof location?.imageZoom === 'number' ? location.imageZoom : 100,
  )
  const [isHotspot, setIsHotspot] = useState<boolean>(!!location?.isHotspot)
  const [needsOrganizing, setNeedsOrganizing] = useState<boolean>(!!location?.needsOrganizing)
  // Date input stores YYYY-MM-DD; we slice off any time portion from the API value.
  const initialOrganizeBy = location?.organizeBy ? String(location.organizeBy).slice(0, 10) : ''
  const [organizeBy, setOrganizeBy] = useState<string>(initialOrganizeBy)
  const [lastOrganizedAt, setLastOrganizedAt] = useState<string | null>(location?.lastOrganizedAt ?? null)
  const [hotspotImageId, setHotspotImageId] = useState<string | null>(initialHotspotId)
  const [hotspotImageUrl, setHotspotImageUrl] = useState<string | null>(initialHotspotUrl)
  const [uploadingHotspot, setUploadingHotspot] = useState(false)
  const hotspotInput = useRef<HTMLInputElement>(null)
  // Hot Zone "after" photo (before/after motivation), captured via the Done button.
  const [afterImageId, setAfterImageId] = useState<string | null>(initialAfterId)
  const [afterImageUrl, setAfterImageUrl] = useState<string | null>(initialAfterUrl)
  const [uploadingAfter, setUploadingAfter] = useState(false)
  const afterInput = useRef<HTMLInputElement>(null)
  const [lightbox, setLightbox] = useState<{ images: LightboxImage[]; index: number } | null>(null)
  // Tile crop drawer — collapsed by default so the gallery sits closer to the hero image.
  const [showCrop, setShowCrop] = useState(false)
  const [leadImageId, setLeadImageId] = useState<string | null>(initialLeadId)
  const [leadImageUrl, setLeadImageUrl] = useState<string | null>(initialLeadUrl)
  const [gallery, setGallery] = useState<GalleryEntry[]>(location?.gallery ?? [])
  const [uploadingLead, setUploadingLead] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  // Items in this space + the pool of unassigned items available to pull in. Kept in local
  // state for optimistic add/assign/remove; router.refresh() re-syncs from the server after.
  const [spaceItems, setSpaceItems] = useState<Item[]>(items)
  const [availableItems, setAvailableItems] = useState<{ id: string; name: string }[]>(unassignedItems)
  const [quickAddName, setQuickAddName] = useState('')
  const [addingItem, setAddingItem] = useState(false)
  const [itemsOpen, setItemsOpen] = useState(true)
  // Bento gallery: which photo is the big "feature" image.
  const [activeGalleryIdx, setActiveGalleryIdx] = useState(0)
  const galleryStripRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    setSpaceItems(items)
  }, [items])
  useEffect(() => {
    setAvailableItems(unassignedItems)
  }, [unassignedItems])
  const isFirstAutosaveRun = useRef(true)
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reset = () => {
    setName(location?.name ?? '')
    setPrimarilyFor(location?.primarilyFor ?? '')
    setAccessPattern(location?.accessPattern ?? '')
    setNotes(location?.description ?? '')
    setSlot(initialSlot)
    setSpaceIdx(initialSpace)
    setFocalY(typeof location?.imageFocalY === 'number' ? location.imageFocalY : 50)
    setFocalX(typeof location?.imageFocalX === 'number' ? location.imageFocalX : 50)
    setZoom(typeof location?.imageZoom === 'number' ? location.imageZoom : 100)
    setLeadImageId(initialLeadId)
    setLeadImageUrl(initialLeadUrl)
    setGallery(location?.gallery ?? [])
    setIsHotspot(!!location?.isHotspot)
    setNeedsOrganizing(!!location?.needsOrganizing)
    setOrganizeBy(location?.organizeBy ? String(location.organizeBy).slice(0, 10) : '')
    setLastOrganizedAt(location?.lastOrganizedAt ?? null)
    setHotspotImageId(initialHotspotId)
    setHotspotImageUrl(initialHotspotUrl)
    setAfterImageId(initialAfterId)
    setAfterImageUrl(initialAfterUrl)
    setError('')
  }

  const uploadFile = async (
    file: File,
  ): Promise<{ id: string; url: string; originalUrl: string } | null> => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('alt', name || 'space photo')
    const res = await fetch('/api/media', { method: 'POST', body: fd })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data?.errors?.[0]?.message || 'Upload failed.')
      return null
    }
    const data = await res.json()
    const doc = data?.doc
    if (!doc?.id) return null
    return {
      id: String(doc.id),
      // Prefer the original URL so the focal slider / hotspot / gallery preserve natural aspect.
      url: doc.url || doc.sizes?.hero?.url || doc.sizes?.card?.url || '',
      originalUrl: doc.url || doc.sizes?.hero?.url || doc.sizes?.card?.url || '',
    }
  }

  const handleLeadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLead(true)
    setError('')
    const out = await uploadFile(file)
    if (out) {
      setLeadImageId(out.id)
      setLeadImageUrl(out.url)
    }
    setUploadingLead(false)
  }

  const handleHotspotFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingHotspot(true)
    setError('')
    const out = await uploadFile(file)
    if (out) {
      setHotspotImageId(out.id)
      // Use the original (uncropped) URL so vertical photos show in natural aspect.
      setHotspotImageUrl(out.originalUrl)
    }
    setUploadingHotspot(false)
  }

  const handleAfterFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAfter(true)
    setError('')
    const out = await uploadFile(file)
    if (out) {
      setAfterImageId(out.id)
      setAfterImageUrl(out.originalUrl)
    }
    setUploadingAfter(false)
  }

  const handleGalleryFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploadingGallery(true)
    setError('')
    const results: GalleryEntry[] = []
    for (const f of files) {
      const out = await uploadFile(f)
      if (out) {
        results.push({ image: { id: out.id, url: out.url } as Media, caption: '' })
      }
    }
    setGallery((g) => [...g, ...results])
    setUploadingGallery(false)
    if (galleryInput.current) galleryInput.current.value = ''
  }

  const removeGalleryEntry = (idx: number) => {
    setGallery((g) => g.filter((_, i) => i !== idx))
  }

  // Promote a gallery photo to the cover/lead, sending the old cover back into the gallery.
  const makeCover = (idx: number) => {
    setGallery((g) => {
      const entry = g[idx]
      if (!entry) return g
      const newCoverMediaId = typeof entry.image === 'object' ? entry.image.id ?? null : entry.image
      const newCoverUrl =
        typeof entry.image === 'object' && entry.image
          ? (entry.image.url ?? mediaUrl(entry.image, 'hero'))
          : null
      if (!newCoverMediaId) return g
      // Remove the chosen photo from the gallery, and push the OLD cover back in (if any).
      const next = g.filter((_, i) => i !== idx)
      if (leadImageId) {
        next.push({ image: { id: leadImageId, url: leadImageUrl ?? undefined } as Media, caption: null })
      }
      // Swap the lead to the chosen photo.
      setLeadImageId(String(newCoverMediaId))
      setLeadImageUrl(newCoverUrl)
      return next
    })
    setActiveGalleryIdx(0) // jump to the new cover (always image #1)
  }

  const updateCaption = (idx: number, caption: string) => {
    setGallery((g) => g.map((e, i) => (i === idx ? { ...e, caption } : e)))
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      const galleryPayload = gallery.map((g) => {
        const rawId = typeof g.image === 'object' ? (g.image as Media).id : g.image
        return {
          image: toIdNum(rawId),
          caption: g.caption || '',
        }
      })

      const body: Record<string, unknown> = {
        name: name.trim(),
        primarilyFor: primarilyFor.trim() || null,
        description: notes.trim() || null,
        image: toIdNum(leadImageId),
        imageFocalY: focalY,
        imageFocalX: focalX,
        imageZoom: zoom,
        accessPattern: accessPattern || null,
        gallery: galleryPayload,
        sortOrder: Number.isFinite(slot) && slot >= 0 ? slot : 0,
        space: Number.isFinite(spaceIdx) && spaceIdx >= 0 ? spaceIdx : 0,
        isHotspot: isHotspot,
        hotspotImage: isHotspot ? toIdNum(hotspotImageId) : null,
        hotspotAfterImage: isHotspot ? toIdNum(afterImageId) : null,
        needsOrganizing: needsOrganizing,
        organizeBy: needsOrganizing && organizeBy ? organizeBy : null,
        lastOrganizedAt: lastOrganizedAt || null,
      }

      const url = isCreating ? '/api/locations' : `/api/locations/${location!.id}`
      const method = isCreating ? 'POST' : 'PATCH'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.errors?.[0]?.message || 'Could not save.')
        setSaving(false)
        return
      }
      setSaving(false)
      // Save always returns to the dashboard.
      router.push(dashHrefForCurrent())
    } catch {
      setError('Something went wrong.')
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!location) return
    if (!confirm(`Delete "${location.name}"? This will also delete its gallery and unassign its items.`)) return
    setSaving(true)
    try {
      const res = await fetch(`/api/locations/${location.id}`, { method: 'DELETE' })
      if (!res.ok) {
        setError('Could not delete.')
        setSaving(false)
        return
      }
      router.push(dashHrefForCurrent())
    } catch {
      setError('Something went wrong.')
      setSaving(false)
    }
  }

  /** Dashboard URL preserving the Space this zone lives in. */
  const dashHrefForCurrent = () => {
    const page = Math.max(0, spaceIdx)
    return page > 0 ? `/?page=${page}` : '/'
  }

  const handleCancel = () => {
    router.push('/')
  }

  // ---- Items: quick-add, assign existing, optimistic update/delete ----
  const locIdNum = toIdNum(location?.id)

  const handleQuickAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = quickAddName.trim()
    if (!trimmed || !location || addingItem) return
    setAddingItem(true)
    setError('')
    const tempId = `temp-${Date.now()}`
    const optimistic: Item = { id: tempId, name: trimmed, location: { id: location.id, name: location.name } }
    setSpaceItems((prev) => [optimistic, ...prev])
    setQuickAddName('')
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, location: locIdNum }),
      })
      if (!res.ok) {
        setSpaceItems((prev) => prev.filter((i) => i.id !== tempId))
        const data = await res.json().catch(() => ({}))
        setError(data?.errors?.[0]?.message || 'Could not add item.')
        setAddingItem(false)
        return
      }
      const data = await res.json()
      const real = data?.doc
      if (real?.id) {
        setSpaceItems((prev) => prev.map((i) => (i.id === tempId ? { ...real, id: String(real.id) } : i)))
      }
      setAddingItem(false)
      router.refresh()
    } catch {
      setSpaceItems((prev) => prev.filter((i) => i.id !== tempId))
      setError('Something went wrong.')
      setAddingItem(false)
    }
  }

  const handleAssignExisting = async (itemId: string) => {
    if (!location || !itemId) return
    const picked = availableItems.find((i) => i.id === itemId)
    if (!picked) return
    setError('')
    // Optimistic: remove from the pool, add to this space.
    setAvailableItems((prev) => prev.filter((i) => i.id !== itemId))
    setSpaceItems((prev) => [{ id: picked.id, name: picked.name, location: { id: location.id, name: location.name } }, ...prev])
    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: locIdNum }),
      })
      if (!res.ok) {
        // Revert
        setSpaceItems((prev) => prev.filter((i) => i.id !== itemId))
        setAvailableItems((prev) => [picked, ...prev])
        const data = await res.json().catch(() => ({}))
        setError(data?.errors?.[0]?.message || 'Could not assign item.')
        return
      }
      router.refresh()
    } catch {
      setSpaceItems((prev) => prev.filter((i) => i.id !== itemId))
      setAvailableItems((prev) => [picked, ...prev])
      setError('Something went wrong.')
    }
  }

  const handleItemUpdate = async (
    id: string,
    updates: Partial<Item>,
  ): Promise<{ ok: true } | { ok: false; error: string }> => {
    const before = spaceItems.find((i) => i.id === id)
    // If the item was reassigned to a different location, drop it from this list.
    const newLoc = (updates as { location?: unknown }).location
    const stillHere = newLoc != null && String(newLoc) === String(location?.id ?? '')
    setSpaceItems((prev) =>
      stillHere ? prev.map((i) => (i.id === id ? { ...i, ...updates } : i)) : prev.filter((i) => i.id !== id),
    )
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        if (before) setSpaceItems((prev) => (prev.some((i) => i.id === id) ? prev : [before, ...prev]))
        const data = await res.json().catch(() => ({}))
        return { ok: false, error: data?.errors?.[0]?.message || 'Could not save.' }
      }
      router.refresh()
      return { ok: true }
    } catch {
      if (before) setSpaceItems((prev) => (prev.some((i) => i.id === id) ? prev : [before, ...prev]))
      return { ok: false, error: 'Something went wrong.' }
    }
  }

  const handleItemDelete = async (id: string): Promise<{ ok: true } | { ok: false; error: string }> => {
    const before = spaceItems.find((i) => i.id === id)
    setSpaceItems((prev) => prev.filter((i) => i.id !== id))
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        if (before) setSpaceItems((prev) => [before, ...prev])
        return { ok: false, error: 'Could not delete.' }
      }
      router.refresh()
      return { ok: true }
    } catch {
      if (before) setSpaceItems((prev) => [before, ...prev])
      return { ok: false, error: 'Something went wrong.' }
    }
  }

  // ---- Autosave for existing spaces ----
  // Debounce ~1.2s after the last change. Skips first run on mount.
  // Skips while file uploads are in flight (those have their own loading state)
  // and during create mode (which uses the explicit Create button).
  useEffect(() => {
    if (isCreating || !location || uploadingLead || uploadingGallery || uploadingHotspot || uploadingAfter) return
    if (isFirstAutosaveRun.current) {
      isFirstAutosaveRun.current = false
      return
    }
    if (!name.trim()) return

    const timer = setTimeout(async () => {
      setAutosaveStatus('saving')
      try {
        const galleryPayload = gallery.map((g) => {
          const rawId = typeof g.image === 'object' ? (g.image as Media).id : g.image
          return {
            image: toIdNum(rawId),
            caption: g.caption || '',
          }
        })
        const body = {
          name: name.trim(),
          primarilyFor: primarilyFor.trim() || null,
          description: notes.trim() || null,
          image: toIdNum(leadImageId),
          imageFocalY: focalY,
          imageFocalX: focalX,
          imageZoom: zoom,
          accessPattern: accessPattern || null,
          gallery: galleryPayload,
          sortOrder: Number.isFinite(slot) && slot >= 0 ? slot : 0,
          space: Number.isFinite(spaceIdx) && spaceIdx >= 0 ? spaceIdx : 0,
          isHotspot: isHotspot,
          hotspotImage: isHotspot ? toIdNum(hotspotImageId) : null,
          hotspotAfterImage: isHotspot ? toIdNum(afterImageId) : null,
          needsOrganizing: needsOrganizing,
          organizeBy: needsOrganizing && organizeBy ? organizeBy : null,
        lastOrganizedAt: lastOrganizedAt || null,
        }
        console.log('[autosave] PATCH body', body, {
          leadImageId,
          hotspotImageId,
          typeofHotspot: typeof hotspotImageId,
        })
        const res = await fetch(`/api/locations/${location.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          setAutosaveStatus('saved')
          if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
          savedTimeoutRef.current = setTimeout(() => setAutosaveStatus('idle'), 2000)
        } else {
          const data = await res.json().catch(() => ({}))
          console.error('[autosave] PATCH failed', res.status, data)
          setAutosaveStatus('error')
        }
      } catch (err) {
        console.error('[autosave] exception', err)
        setAutosaveStatus('error')
      }
    }, 1200)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    name,
    primarilyFor,
    notes,
    accessPattern,
    leadImageId,
    focalY,
    focalX,
    zoom,
    slot,
    spaceIdx,
    gallery,
    isHotspot,
    hotspotImageId,
    afterImageId,
    needsOrganizing,
    organizeBy,
    lastOrganizedAt,
    isCreating,
    location?.id,
    // Include upload flags so when they flip from true→false (upload done),
    // the autosave effect re-runs and can schedule the debounced save.
    uploadingLead,
    uploadingGallery,
    uploadingHotspot,
    uploadingAfter,
  ])

  // Thumbnail (display) + full-size URLs for one gallery entry.
  const entryUrls = (g: GalleryEntry) => {
    const originalUrl =
      typeof g.image === 'object' && g.image ? (g.image.url ?? mediaUrl(g.image, 'hero')) : null
    const url = originalUrl || mediaUrl(g.image, 'card')
    const fullUrl = originalUrl || mediaUrl(g.image, 'hero') || url
    return { url, fullUrl }
  }

  // Unified image list — the lead/cover photo is always image #1, then the gallery photos.
  // (No separate hero; the cover lives here as the first feature/thumbnail.)
  type CoverOrGallery =
    | { kind: 'lead'; url: string | null; fullUrl: string | null }
    | { kind: 'gallery'; url: string | null; fullUrl: string | null; caption: string | null; galleryIdx: number }
  const combinedImages: CoverOrGallery[] = []
  if (leadImageUrl) combinedImages.push({ kind: 'lead', url: leadImageUrl, fullUrl: leadImageUrl })
  gallery.forEach((g, gi) => {
    const { url, fullUrl } = entryUrls(g)
    combinedImages.push({ kind: 'gallery', url, fullUrl, caption: g.caption ?? null, galleryIdx: gi })
  })

  // Flat list for the lightbox (cover first), only entries that have a full-size URL.
  const galleryLightboxImages: LightboxImage[] = combinedImages
    .filter((c) => !!c.fullUrl)
    .map((c) => ({ src: c.fullUrl as string, caption: c.kind === 'gallery' ? c.caption : null }))

  // Keep the active feature index in range as photos are added/removed.
  useEffect(() => {
    setActiveGalleryIdx((i) => Math.min(i, Math.max(0, combinedImages.length - 1)))
  }, [combinedImages.length])

  // Scroll the active thumbnail into view in the filmstrip.
  useEffect(() => {
    const el = galleryStripRef.current?.querySelector(`[data-thumb="${activeGalleryIdx}"]`)
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeGalleryIdx])

  return (
    <div className="si-detail">
      {(() => {
        // The zone's Space → build a Dashboard › Space name › Zone breadcrumb that returns there.
        const bentoPage = Math.max(0, spaceIdx)
        const dashHref = bentoPage > 0 ? `/?page=${bentoPage}` : '/'
        const parentPageName = pageNames.find((p) => p.pageIndex === bentoPage)?.name ?? ''
        const currentName = (name || location?.name || (isCreating ? 'New zone' : 'Untitled')).trim()
        return (
          <nav className="si-detail-crumb" aria-label="Breadcrumb">
            <Link href={dashHref} className="si-crumb-link">← Dashboard</Link>
            {parentPageName && (
              <>
                <span className="si-crumb-sep" aria-hidden>›</span>
                <Link href={dashHref} className="si-crumb-link">{parentPageName}</Link>
              </>
            )}
            <span className="si-crumb-sep" aria-hidden>›</span>
            <span className="si-crumb-current" aria-current="page">{currentName}</span>
          </nav>
        )
      })()}

      {/* Tile crop position sliders — collapsible drawer; preview how the lead image will crop on the dashboard tile.
          Horizontal (X) handles left/right framing; vertical (Y) handles top/bottom; Zoom magnifies around the focal point. */}
      {leadImageUrl && editing && showCrop && (
        <div className="si-edit-row si-focal" id="si-crop-drawer">
          <span className="si-edit-label">Tile crop position</span>
          <div className="si-focal-preview">
            <img
              src={leadImageUrl}
              alt=""
              style={{
                objectPosition: `${focalX}% ${focalY}%`,
                // Zoom AROUND the focal point so the chosen area stays in view as you zoom in.
                transform: `scale(${zoom / 100})`,
                transformOrigin: `${focalX}% ${focalY}%`,
              }}
            />
          </div>

          <div className="si-focal-axis">
            <span className="si-focal-axis-label">Left ↔ Right</span>
            <input
              className="si-focal-slider"
              type="range"
              min={0}
              max={100}
              step={1}
              value={focalX}
              onChange={(e) => setFocalX(Number(e.target.value))}
              aria-label="Horizontal crop position"
            />
            <div className="si-focal-labels">
              <span>Show left</span>
              <span>Center</span>
              <span>Show right</span>
            </div>
          </div>

          <div className="si-focal-axis">
            <span className="si-focal-axis-label">Top ↕ Bottom</span>
            <input
              className="si-focal-slider"
              type="range"
              min={0}
              max={100}
              step={1}
              value={focalY}
              onChange={(e) => setFocalY(Number(e.target.value))}
              aria-label="Vertical crop position"
            />
            <div className="si-focal-labels">
              <span>Show top</span>
              <span>Center</span>
              <span>Show bottom</span>
            </div>
          </div>

          <div className="si-focal-axis">
            <span className="si-focal-axis-label">
              Zoom
              <button
                type="button"
                className="si-focal-zoom-reset"
                onClick={() => setZoom(100)}
                disabled={zoom === 100}
                aria-label="Reset zoom to fit"
              >
                Reset
              </button>
            </span>
            <input
              className="si-focal-slider"
              type="range"
              min={100}
              max={300}
              step={5}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label="Zoom level"
            />
            <div className="si-focal-labels">
              <span>Fit (1×)</span>
              <span>{(zoom / 100).toFixed(2)}×</span>
              <span>3×</span>
            </div>
          </div>
        </div>
      )}

      {/* Gallery — unified bento: the cover (lead) photo is image #1, then detail photos */}
      <section className="si-section">
        <h2 className="si-section-title">Gallery</h2>
        {combinedImages.length === 0 ? (
          editing ? (
            <div className="si-gallery-bento">
              <button
                type="button"
                className="si-gallery-feature si-gallery-feature--empty"
                onClick={() => leadInput.current?.click()}
              >
                <span className="si-gallery-add-icon">+</span>
                <span>{uploadingLead ? 'Uploading…' : 'Add cover photo'}</span>
              </button>
            </div>
          ) : (
            <p className="si-section-empty">No photos yet — click Edit to add some.</p>
          )
        ) : (
          (() => {
            const idx = Math.min(activeGalleryIdx, combinedImages.length - 1)
            const active = combinedImages[idx]
            const isCover = active.kind === 'lead'
            return (
              <div className="si-gallery-bento">
                <div className="si-gallery-feature">
                  {active.url && (
                    <button
                      type="button"
                      className="si-gallery-feature-btn"
                      onClick={() => {
                        if (!active.fullUrl) return
                        const startIndex = galleryLightboxImages.findIndex((im) => im.src === active.fullUrl)
                        setLightbox({ images: galleryLightboxImages, index: startIndex < 0 ? 0 : startIndex })
                      }}
                      aria-label="View full size"
                    >
                      <img src={active.url} alt="" />
                    </button>
                  )}
                  {isCover && <span className="si-gallery-cover-badge">Cover</span>}
                  {editing && (
                    <div className="si-gallery-feature-actions">
                      {isCover && (
                        <button
                          type="button"
                          className={`si-gallery-feat-btn ${showCrop ? 'is-on' : ''}`}
                          onClick={() => setShowCrop((v) => !v)}
                          aria-label="Adjust dashboard tile crop"
                          title="Adjust dashboard tile crop"
                        >
                          <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                            <path d="M4 1.5v10.5a.5.5 0 0 0 .5.5H14.5" strokeLinecap="round" />
                            <path d="M1.5 4H12a.5.5 0 0 1 .5.5V14.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      )}
                      {isCover && (
                        <button
                          type="button"
                          className="si-gallery-feat-btn"
                          onClick={() => leadInput.current?.click()}
                          aria-label="Replace cover photo"
                          title="Replace cover photo"
                        >
                          📷
                        </button>
                      )}
                      {!isCover && (
                        <button
                          type="button"
                          className="si-gallery-feat-btn si-gallery-feat-btn--cover"
                          onClick={() => makeCover(active.galleryIdx)}
                          aria-label="Make this the cover photo"
                          title="Make cover (swaps with current cover)"
                        >
                          ★
                        </button>
                      )}
                      <button
                        type="button"
                        className="si-gallery-feat-btn si-gallery-feat-btn--remove"
                        onClick={() => {
                          if (isCover) {
                            setLeadImageId(null)
                            setLeadImageUrl(null)
                            setShowCrop(false)
                          } else {
                            removeGalleryEntry(active.galleryIdx)
                          }
                        }}
                        aria-label="Remove this photo"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {isCover ? (
                  <div className="si-gallery-caption-text">Shown on the dashboard tile</div>
                ) : editing ? (
                  <input
                    className="si-gallery-caption-input"
                    type="text"
                    value={active.caption ?? ''}
                    onChange={(e) => updateCaption(active.galleryIdx, e.target.value)}
                    placeholder="Caption…"
                    maxLength={120}
                  />
                ) : active.caption ? (
                  <div className="si-gallery-caption-text">{active.caption}</div>
                ) : null}

                <div className="si-gallery-strip-wrap">
                  {combinedImages.length > 1 && (
                    <button
                      type="button"
                      className="si-gallery-strip-btn"
                      onClick={() => setActiveGalleryIdx((i) => (i - 1 + combinedImages.length) % combinedImages.length)}
                      aria-label="Previous photo"
                    >
                      ‹
                    </button>
                  )}
                  <div className="si-gallery-strip" ref={galleryStripRef}>
                    {combinedImages.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        data-thumb={i}
                        className={`si-gallery-thumb ${i === idx ? 'is-active' : ''} ${c.kind === 'lead' ? 'si-gallery-thumb--cover' : ''}`}
                        onClick={() => setActiveGalleryIdx(i)}
                        aria-label={c.kind === 'lead' ? 'Cover photo' : `Photo ${i + 1}`}
                        aria-current={i === idx}
                      >
                        {c.url && <img src={c.url} alt="" />}
                        {c.kind === 'lead' && <span className="si-gallery-thumb-tag" aria-hidden>★</span>}
                      </button>
                    ))}
                    {editing && (
                      <button
                        type="button"
                        className="si-gallery-thumb si-gallery-thumb--add"
                        onClick={() => galleryInput.current?.click()}
                        aria-label="Add photos"
                      >
                        {uploadingGallery ? '…' : '+'}
                      </button>
                    )}
                  </div>
                  {combinedImages.length > 1 && (
                    <button
                      type="button"
                      className="si-gallery-strip-btn"
                      onClick={() => setActiveGalleryIdx((i) => (i + 1) % combinedImages.length)}
                      aria-label="Next photo"
                    >
                      ›
                    </button>
                  )}
                </div>
              </div>
            )
          })()
        )}
        <input
          ref={leadInput}
          type="file"
          accept="image/*"
          onChange={handleLeadFile}
          style={{ display: 'none' }}
        />
        <input
          ref={galleryInput}
          type="file"
          accept="image/*"
          multiple
          onChange={handleGalleryFiles}
          style={{ display: 'none' }}
        />
      </section>

      {/* Name + theme + access pattern */}
      <header className="si-detail-header">
        {editing ? (
          <>
            <input
              className="si-field si-detail-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="Zone name"
              autoFocus={isCreating}
            />
            <input
              className="si-field si-detail-theme"
              type="text"
              value={primarilyFor}
              onChange={(e) => setPrimarilyFor(e.target.value)}
              maxLength={120}
              placeholder="Theme — what belongs here?"
            />
            {/* Space picker + Access frequency share one row to keep the form compact. */}
            <div className="si-edit-row--split">
              <div className="si-edit-field si-edit-field--place">
                <span className="si-edit-label">Space</span>
                <select
                  className="si-field si-select"
                  value={spaceIdx}
                  onChange={(e) => setSpaceIdx(Number.parseInt(e.target.value, 10))}
                  aria-label="Which space this zone belongs to"
                >
                  {(() => {
                    // Offer every known space (by name) + one slot for a brand-new space.
                    const known = new Set<number>()
                    pageNames.forEach((p) => known.add(p.pageIndex))
                    known.add(spaceIdx)
                    const maxKnown = known.size ? Math.max(...known) : 0
                    const opts: number[] = []
                    for (let i = 0; i <= maxKnown; i++) opts.push(i)
                    opts.push(maxKnown + 1) // "+ New space"
                    return opts.map((i) => {
                      const nm = pageNames.find((p) => p.pageIndex === i)?.name
                      const label = i === maxKnown + 1 ? `+ New space (${i + 1})` : nm ? `${i + 1} · ${nm}` : `Space ${i + 1}`
                      return (
                        <option key={i} value={i}>
                          {label}
                        </option>
                      )
                    })
                  })()}
                </select>
              </div>
              <div className="si-edit-field si-edit-field--access">
                <span className="si-edit-label">Access frequency</span>
                <select
                  className="si-field si-select"
                  value={accessPattern}
                  onChange={(e) => setAccessPattern(e.target.value)}
                >
                  <option value="">— None —</option>
                  {ACCESS_PATTERNS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggles sit to the right of Access frequency; their reveal UI drops below the row. */}
              <div className="si-edit-field si-edit-field--toggles">
                <span className="si-edit-label" aria-hidden>&nbsp;</span>
                <div className="si-toggles-inline">
                  <label className="si-toggle">
                    <span className="si-switch">
                      <input
                        type="checkbox"
                        checked={isHotspot}
                        onChange={(e) => setIsHotspot(e.target.checked)}
                      />
                      <span className="si-switch-slider" aria-hidden />
                    </span>
                    <span className="si-toggle-text">
                      Hot Zone?
                      <span className="si-toggle-tip" tabIndex={0} role="button" aria-label="What is a hot zone?">
                        ⓘ
                        <span className="si-toggle-tip-bubble" role="tooltip">
                          A hot zone is a place that&apos;s prone to cluttering — flag problem areas you keep needing to clear, like an entryway table or a junk drawer.
                        </span>
                      </span>
                    </span>
                  </label>
                  <label className="si-toggle">
                    <span className="si-switch">
                      <input
                        type="checkbox"
                        checked={needsOrganizing}
                        onChange={(e) => setNeedsOrganizing(e.target.checked)}
                      />
                      <span className="si-switch-slider" aria-hidden />
                    </span>
                    <span className="si-toggle-text">
                      Organize it?
                      <span className="si-toggle-tip" tabIndex={0} role="button" aria-label="What does Organize it? do?">
                        ⓘ
                        <span className="si-toggle-tip-bubble" role="tooltip">
                          Flag a space that needs attention — shows a flag on the dashboard tile and lets you filter for what to tackle next.
                        </span>
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Hot Zone reveal — two slots side by side: Before + After, each with its own add/replace/remove */}
            {isHotspot && (
              <div className="si-hotspot-photo-wrap">
                <div className="si-beforeafter">
                  {/* BEFORE slot */}
                  <figure className="si-ba-fig">
                    {hotspotImageUrl ? (
                      <button
                        type="button"
                        className="si-hotspot-photo"
                        onClick={() => setLightbox({
                          images: [
                            { src: hotspotImageUrl, caption: 'Before' },
                            ...(afterImageUrl ? [{ src: afterImageUrl, caption: 'After' }] : []),
                          ],
                          index: 0,
                        })}
                        aria-label="View before photo full size"
                      >
                        <img src={hotspotImageUrl} alt="" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="si-ba-add"
                        onClick={() => hotspotInput.current?.click()}
                        aria-label="Add before photo"
                      >
                        <span className="si-ba-add-icon" aria-hidden>+</span>
                        {uploadingHotspot && <span className="si-ba-add-loading">Uploading…</span>}
                      </button>
                    )}
                    <figcaption className="si-ba-label si-ba-label--before">Before</figcaption>
                    {hotspotImageUrl && (
                      <div className="si-ba-actions">
                        <button type="button" className="si-ba-link" onClick={() => hotspotInput.current?.click()}>Replace</button>
                        <button type="button" className="si-ba-link si-ba-link--danger" onClick={() => { setHotspotImageId(null); setHotspotImageUrl(null) }}>Remove</button>
                      </div>
                    )}
                  </figure>

                  {/* AFTER slot */}
                  <figure className="si-ba-fig">
                    {afterImageUrl ? (
                      <button
                        type="button"
                        className="si-hotspot-photo"
                        onClick={() => setLightbox({
                          images: [
                            ...(hotspotImageUrl ? [{ src: hotspotImageUrl, caption: 'Before' }] : []),
                            { src: afterImageUrl, caption: 'After' },
                          ],
                          index: hotspotImageUrl ? 1 : 0,
                        })}
                        aria-label="View after photo full size"
                      >
                        <img src={afterImageUrl} alt="" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="si-ba-add"
                        onClick={() => afterInput.current?.click()}
                        aria-label="Add after photo"
                      >
                        <span className="si-ba-add-icon" aria-hidden>+</span>
                        {uploadingAfter && <span className="si-ba-add-loading">Uploading…</span>}
                      </button>
                    )}
                    <figcaption className="si-ba-label si-ba-label--after">After</figcaption>
                    {afterImageUrl && (
                      <div className="si-ba-actions">
                        <button type="button" className="si-ba-link" onClick={() => afterInput.current?.click()}>Replace</button>
                        <button type="button" className="si-ba-link si-ba-link--danger" onClick={() => { setAfterImageId(null); setAfterImageUrl(null) }}>Remove</button>
                      </div>
                    )}
                  </figure>
                </div>
                <input
                  ref={hotspotInput}
                  type="file"
                  accept="image/*"
                  onChange={handleHotspotFile}
                  style={{ display: 'none' }}
                />
                <input
                  ref={afterInput}
                  type="file"
                  accept="image/*"
                  onChange={handleAfterFile}
                  style={{ display: 'none' }}
                />
              </div>
            )}

            {/* Organize-by date reveal */}
            {needsOrganizing && (
              <div className="si-organize-by">
                <label className="si-organize-by-label" htmlFor="si-organize-by-input">
                  By when?
                </label>
                <input
                  id="si-organize-by-input"
                  type="date"
                  className="si-organize-by-input"
                  value={organizeBy}
                  onChange={(e) => setOrganizeBy(e.target.value)}
                />
                {/* Done → stamp "last organized" + turn the Organize flag back off */}
                <button
                  type="button"
                  className="si-btn si-btn--sm si-done-organize"
                  onClick={() => {
                    setLastOrganizedAt(new Date().toISOString())
                    setNeedsOrganizing(false)
                    setOrganizeBy('')
                  }}
                >
                  ✓ Done
                </button>
                {organizeBy && (
                  <button
                    type="button"
                    className="si-btn si-btn--ghost si-btn--sm"
                    onClick={() => setOrganizeBy('')}
                    aria-label="Clear target date"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Last-organized timestamp (set by Done) */}
            {lastOrganizedAt && (
              <p className="si-last-organized">
                ✓ Last organized{' '}
                {new Date(lastOrganizedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            )}
          </>
        ) : (
          <>
            <h1 className="si-detail-title">{location!.name}</h1>
            {location!.primarilyFor && <p className="si-detail-theme-display">{location!.primarilyFor}</p>}
            {location!.accessPattern && (
              <p className="si-detail-access">
                {ACCESS_PATTERNS.find((p) => p.value === location!.accessPattern)?.label}
              </p>
            )}
          </>
        )}
      </header>

      {/* Items in this space — collapsible accordion, sits above Notes (only for existing spaces) */}
      {!isCreating && (
        <section className="si-section si-accordion">
          <button
            type="button"
            className="si-accordion-head"
            onClick={() => setItemsOpen((v) => !v)}
            aria-expanded={itemsOpen}
            aria-controls="si-items-body"
          >
            <span className="si-section-title">Items in this space ({spaceItems.length})</span>
            <span className={`si-accordion-chevron ${itemsOpen ? 'is-open' : ''}`} aria-hidden>⌄</span>
          </button>

          {itemsOpen && (
            <div className="si-accordion-body" id="si-items-body">
              {/* Quick-add a new item straight into this space + pull in an existing unassigned one */}
              <div className="si-item-add-bar">
                <form className="si-item-quickadd" onSubmit={handleQuickAddItem}>
                  <input
                    className="si-field"
                    type="text"
                    value={quickAddName}
                    onChange={(e) => setQuickAddName(e.target.value)}
                    placeholder="Add an item to this space…"
                    maxLength={120}
                  />
                  <button
                    type="submit"
                    className="si-btn si-btn--primary si-btn--sm"
                    disabled={!quickAddName.trim() || addingItem}
                  >
                    {addingItem ? 'Adding…' : 'Add'}
                  </button>
                </form>
                {availableItems.length > 0 && (
                  <select
                    className="si-field si-select si-item-assign-select"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) handleAssignExisting(e.target.value)
                    }}
                    aria-label="Assign an existing unassigned item to this space"
                  >
                    <option value="">+ Assign existing item…</option>
                    {availableItems.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {spaceItems.length > 0 ? (
                <ul className="si-item-list">
                  {spaceItems.map((it) => (
                    <ItemRow
                      key={it.id}
                      item={it as never}
                      locations={locations}
                      categories={categories}
                      tags={tags}
                      onUpdate={handleItemUpdate}
                      onDelete={handleItemDelete}
                      highlight={highlightItemId != null && String(it.id) === highlightItemId}
                    />
                  ))}
                </ul>
              ) : (
                <p className="si-section-empty">No items here yet — add one above.</p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Notes */}
      <section className="si-section">
        <h2 className="si-section-title">Notes</h2>
        <textarea
          className="si-field si-textarea si-detail-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ideas, thoughts, organization plans for this space…"
          rows={4}
        />
      </section>

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Actions */}
      <div className="si-detail-actions">
        {error && <div className="si-error">{error}</div>}
        {!isCreating && (
          <button type="button" className="si-btn si-btn--danger si-btn--sm" onClick={handleDelete} disabled={saving}>
            Delete space
          </button>
        )}
        {!isCreating && (
          <span className={`si-autosave si-autosave--${autosaveStatus}`}>
            {autosaveStatus === 'saving' && 'Saving…'}
            {autosaveStatus === 'saved' && '✓ Saved'}
            {autosaveStatus === 'error' && '⚠ Couldn’t save'}
          </span>
        )}
        <span className="si-edit-spacer" />
        {isCreating ? (
          <>
            <button type="button" className="si-btn si-btn--ghost si-btn--sm" onClick={handleCancel} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="si-btn si-btn--sm" onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? 'Saving…' : 'Create space'}
            </button>
          </>
        ) : (
          <button type="button" className="si-btn si-btn--sm" onClick={handleCancel}>
            Done
          </button>
        )}
      </div>
    </div>
  )
}
