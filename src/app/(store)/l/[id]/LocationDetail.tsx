'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ItemRow } from '../../components/ItemRow'
import { Lightbox } from '../../components/Lightbox'
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
  accessPattern?: string | null
  gallery?: GalleryEntry[] | null
  sortOrder?: number | null
  isHotspot?: boolean | null
  hotspotImage?: Media | string | null
}

type Props = {
  location: Location | null
  /** When provided, the form is in create mode and the new space gets this sortOrder. */
  creatingSlot?: number
  items: Item[]
  locations: Loc[]
  tags: Tag[]
  categories: Cat[]
}

function mediaUrl(m: Media | string | null | undefined, size: 'card' | 'hero' | 'thumbnail' = 'hero'): string | null {
  if (!m || typeof m !== 'object') return null
  return m.sizes?.[size]?.url || m.sizes?.card?.url || m.sizes?.thumbnail?.url || m.url || null
}

export function LocationDetail({ location, creatingSlot, items, locations, tags, categories }: Props) {
  const router = useRouter()
  const isCreating = location === null
  const leadInput = useRef<HTMLInputElement>(null)
  const galleryInput = useRef<HTMLInputElement>(null)

  // Always editing — no read-only view; clicking from the dashboard lands directly in the editor.
  const [editing, setEditing] = useState(true)

  const initialLeadId = location && typeof location.image === 'object' && location.image ? (location.image.id ?? null) : null
  const initialLeadUrl = mediaUrl(location?.image, 'hero')
  const initialHotspotId =
    location && typeof location.hotspotImage === 'object' && location.hotspotImage
      ? (location.hotspotImage.id ?? null)
      : null
  // Use ORIGINAL upload URL for hotspot so vertical photos keep their natural aspect ratio.
  const initialHotspotUrl =
    location && typeof location.hotspotImage === 'object' && location.hotspotImage
      ? (location.hotspotImage.url ?? mediaUrl(location.hotspotImage, 'hero'))
      : null

  const initialSlot = isCreating
    ? (creatingSlot ?? 0)
    : (typeof location?.sortOrder === 'number' ? location.sortOrder : 0)
  const [name, setName] = useState(location?.name ?? '')
  const [primarilyFor, setPrimarilyFor] = useState(location?.primarilyFor ?? '')
  const [accessPattern, setAccessPattern] = useState<string>(location?.accessPattern ?? '')
  const [notes, setNotes] = useState(location?.description ?? '')
  const [slot, setSlot] = useState<number>(initialSlot)
  const [isHotspot, setIsHotspot] = useState<boolean>(!!location?.isHotspot)
  const [hotspotImageId, setHotspotImageId] = useState<string | null>(initialHotspotId)
  const [hotspotImageUrl, setHotspotImageUrl] = useState<string | null>(initialHotspotUrl)
  const [uploadingHotspot, setUploadingHotspot] = useState(false)
  const hotspotInput = useRef<HTMLInputElement>(null)
  const [lightbox, setLightbox] = useState<{ src: string; caption?: string | null } | null>(null)
  const [leadImageId, setLeadImageId] = useState<string | null>(initialLeadId)
  const [leadImageUrl, setLeadImageUrl] = useState<string | null>(initialLeadUrl)
  const [gallery, setGallery] = useState<GalleryEntry[]>(location?.gallery ?? [])
  const [uploadingLead, setUploadingLead] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const isFirstAutosaveRun = useRef(true)
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reset = () => {
    setName(location?.name ?? '')
    setPrimarilyFor(location?.primarilyFor ?? '')
    setAccessPattern(location?.accessPattern ?? '')
    setNotes(location?.description ?? '')
    setSlot(initialSlot)
    setLeadImageId(initialLeadId)
    setLeadImageUrl(initialLeadUrl)
    setGallery(location?.gallery ?? [])
    setIsHotspot(!!location?.isHotspot)
    setHotspotImageId(initialHotspotId)
    setHotspotImageUrl(initialHotspotUrl)
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
      url: doc.sizes?.hero?.url || doc.sizes?.card?.url || doc.url || '',
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

  const updateCaption = (idx: number, caption: string) => {
    setGallery((g) => g.map((e, i) => (i === idx ? { ...e, caption } : e)))
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      const galleryPayload = gallery.map((g) => ({
        image: typeof g.image === 'object' ? (g.image as Media).id : g.image,
        caption: g.caption || '',
      }))

      const body: Record<string, unknown> = {
        name: name.trim(),
        primarilyFor: primarilyFor.trim() || null,
        description: notes.trim() || null,
        image: leadImageId || null,
        accessPattern: accessPattern || null,
        gallery: galleryPayload,
        sortOrder: Number.isFinite(slot) && slot >= 0 ? slot : 0,
        isHotspot: isHotspot,
        hotspotImage: isHotspot ? hotspotImageId || null : null,
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
      router.push('/')
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
      router.push('/')
    } catch {
      setError('Something went wrong.')
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push('/')
  }

  // ---- Autosave for existing spaces ----
  // Debounce ~1.2s after the last change. Skips first run on mount.
  // Skips while file uploads are in flight (those have their own loading state)
  // and during create mode (which uses the explicit Create button).
  useEffect(() => {
    if (isCreating || !location || uploadingLead || uploadingGallery || uploadingHotspot) return
    if (isFirstAutosaveRun.current) {
      isFirstAutosaveRun.current = false
      return
    }
    if (!name.trim()) return

    const timer = setTimeout(async () => {
      setAutosaveStatus('saving')
      try {
        const toIdNum = (v: string | number | null | undefined): number | null => {
          if (v === null || v === undefined || v === '') return null
          const n = typeof v === 'number' ? v : Number.parseInt(String(v), 10)
          return Number.isFinite(n) ? n : null
        }
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
          accessPattern: accessPattern || null,
          gallery: galleryPayload,
          sortOrder: Number.isFinite(slot) && slot >= 0 ? slot : 0,
          isHotspot: isHotspot,
          hotspotImage: isHotspot ? toIdNum(hotspotImageId) : null,
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
    slot,
    gallery,
    isHotspot,
    hotspotImageId,
    isCreating,
    location?.id,
    // Include upload flags so when they flip from true→false (upload done),
    // the autosave effect re-runs and can schedule the debounced save.
    uploadingLead,
    uploadingGallery,
    uploadingHotspot,
  ])

  return (
    <div className="si-detail">
      <nav className="si-detail-crumb">
        <Link href="/" className="si-crumb-link">← Dashboard</Link>
      </nav>

      {/* Lead hero */}
      <div className="si-detail-hero">
        {editing ? (
          <button
            type="button"
            className="si-detail-hero-edit"
            onClick={() => leadInput.current?.click()}
            aria-label="Replace lead photo"
          >
            {leadImageUrl ? <img src={leadImageUrl} alt="" /> : <span>📷 Add lead photo</span>}
            {uploadingLead && <span className="si-detail-uploading">Uploading…</span>}
          </button>
        ) : leadImageUrl ? (
          <img src={leadImageUrl} alt="" />
        ) : (
          <div className="si-detail-hero-placeholder" aria-hidden>📍</div>
        )}
        <input
          ref={leadInput}
          type="file"
          accept="image/*"
          onChange={handleLeadFile}
          style={{ display: 'none' }}
        />
      </div>

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
              placeholder="Space name"
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
            <div className="si-edit-row">
              <span className="si-edit-label">Slot</span>
              <div className="si-slot-row">
                <input
                  className="si-field si-slot-input"
                  type="number"
                  min={1}
                  value={slot + 1}
                  onChange={(e) => {
                    const n = Number.parseInt(e.target.value, 10)
                    setSlot(Number.isFinite(n) && n >= 1 ? n - 1 : 0)
                  }}
                />
                <span className="si-slot-helper">
                  Page {Math.floor(slot / 6) + 1} · position {(slot % 6) + 1}
                </span>
              </div>
            </div>

            <div className="si-edit-row">
              <span className="si-edit-label">Access frequency</span>
              <div className="si-tagpicker">
                {ACCESS_PATTERNS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    className={`si-tagchip ${accessPattern === p.value ? 'is-on' : ''}`}
                    style={accessPattern === p.value ? { background: p.color, color: p.textColor } : undefined}
                    onClick={() => setAccessPattern(accessPattern === p.value ? '' : p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="si-edit-row">
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
                  Hotspot?
                  <span className="si-toggle-tip" title="A place that attracts clutter — flag problem areas you keep needing to clear">ⓘ</span>
                </span>
              </label>
              {isHotspot && (
                <div className="si-hotspot-photo-wrap">
                  {hotspotImageUrl ? (
                    <>
                      <button
                        type="button"
                        className="si-hotspot-photo"
                        onClick={() => setLightbox({ src: hotspotImageUrl, caption: 'Hotspot photo' })}
                        aria-label="View hotspot photo full size"
                      >
                        <img src={hotspotImageUrl} alt="" />
                      </button>
                      <div className="si-hotspot-actions">
                        <button
                          type="button"
                          className="si-btn si-btn--ghost si-btn--sm"
                          onClick={() => hotspotInput.current?.click()}
                        >
                          Replace photo
                        </button>
                        <button
                          type="button"
                          className="si-btn si-btn--danger si-btn--sm"
                          onClick={() => {
                            setHotspotImageId(null)
                            setHotspotImageUrl(null)
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="si-tile-edit-photo si-hotspot-photo"
                      onClick={() => hotspotInput.current?.click()}
                      aria-label="Upload hotspot photo"
                    >
                      <span className="si-tile-edit-photo-empty">
                        📷 Show what it looks like when cluttered
                      </span>
                      {uploadingHotspot && (
                        <span className="si-tile-edit-photo-loading">Uploading…</span>
                      )}
                    </button>
                  )}
                  <input
                    ref={hotspotInput}
                    type="file"
                    accept="image/*"
                    onChange={handleHotspotFile}
                    style={{ display: 'none' }}
                  />
                </div>
              )}
            </div>
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

      {/* Gallery */}
      <section className="si-section">
        <h2 className="si-section-title">Gallery</h2>
        <div className="si-gallery">
          {gallery.map((g, idx) => {
            const url = mediaUrl(g.image, 'card')
            const fullUrl = mediaUrl(g.image, 'hero') || url
            return (
              <div className="si-gallery-cell" key={idx}>
                {url ? (
                  <button
                    type="button"
                    className="si-gallery-img-btn"
                    onClick={() => fullUrl && setLightbox({ src: fullUrl, caption: g.caption })}
                    aria-label="View full size"
                  >
                    <img src={url} alt={g.caption ?? ''} />
                  </button>
                ) : null}
                {editing && (
                  <button
                    type="button"
                    className="si-gallery-remove"
                    onClick={() => removeGalleryEntry(idx)}
                    aria-label="Remove photo"
                  >
                    ✕
                  </button>
                )}
                {editing ? (
                  <input
                    className="si-gallery-caption-input"
                    type="text"
                    value={g.caption ?? ''}
                    onChange={(e) => updateCaption(idx, e.target.value)}
                    placeholder="Caption…"
                    maxLength={120}
                  />
                ) : g.caption ? (
                  <div className="si-gallery-caption">{g.caption}</div>
                ) : null}
              </div>
            )
          })}
          {editing && (
            <button
              type="button"
              className="si-gallery-cell si-gallery-add"
              onClick={() => galleryInput.current?.click()}
            >
              <span className="si-gallery-add-icon">+</span>
              <span>{uploadingGallery ? 'Uploading…' : 'Add photos'}</span>
            </button>
          )}
          {!editing && gallery.length === 0 && (
            <p className="si-section-empty">No detail photos yet — click Edit to add some.</p>
          )}
        </div>
        <input
          ref={galleryInput}
          type="file"
          accept="image/*"
          multiple
          onChange={handleGalleryFiles}
          style={{ display: 'none' }}
        />
      </section>

      {/* Items (only for existing spaces) */}
      {!isCreating && (
        <section className="si-section">
          <h2 className="si-section-title">Items in this space ({items.length})</h2>
          {items.length > 0 ? (
            <ul className="si-item-list">
              {items.map((it) => (
                <ItemRow key={it.id} item={it as never} locations={locations} categories={categories} tags={tags} />
              ))}
            </ul>
          ) : (
            <p className="si-section-empty">No items here yet. Assign some on the dashboard.</p>
          )}
        </section>
      )}

      {lightbox && (
        <Lightbox
          src={lightbox.src}
          caption={lightbox.caption}
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
