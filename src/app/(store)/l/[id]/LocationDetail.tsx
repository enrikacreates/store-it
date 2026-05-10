'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ItemRow } from '../../components/ItemRow'
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
  image?: Media | string | null
  accessPattern?: string | null
  gallery?: GalleryEntry[] | null
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

  // In create mode, always editing.
  const [editing, setEditing] = useState(isCreating)

  const initialLeadId = location && typeof location.image === 'object' && location.image ? (location.image.id ?? null) : null
  const initialLeadUrl = mediaUrl(location?.image, 'hero')

  const [name, setName] = useState(location?.name ?? '')
  const [primarilyFor, setPrimarilyFor] = useState(location?.primarilyFor ?? '')
  const [accessPattern, setAccessPattern] = useState<string>(location?.accessPattern ?? '')
  const [leadImageId, setLeadImageId] = useState<string | null>(initialLeadId)
  const [leadImageUrl, setLeadImageUrl] = useState<string | null>(initialLeadUrl)
  const [gallery, setGallery] = useState<GalleryEntry[]>(location?.gallery ?? [])
  const [uploadingLead, setUploadingLead] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const reset = () => {
    setName(location?.name ?? '')
    setPrimarilyFor(location?.primarilyFor ?? '')
    setAccessPattern(location?.accessPattern ?? '')
    setLeadImageId(initialLeadId)
    setLeadImageUrl(initialLeadUrl)
    setGallery(location?.gallery ?? [])
    setError('')
  }

  const uploadFile = async (file: File): Promise<{ id: string; url: string } | null> => {
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
        image: leadImageId || null,
        accessPattern: accessPattern || null,
        gallery: galleryPayload,
      }
      if (isCreating && typeof creatingSlot === 'number') {
        body.sortOrder = creatingSlot
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
      const data = await res.json()
      const newId = isCreating ? (data?.doc?.id ?? data?.id) : null
      setSaving(false)
      if (isCreating && newId) {
        router.push(`/l/${newId}`)
      } else {
        setEditing(false)
        router.refresh()
      }
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
    if (isCreating) {
      router.push('/')
      return
    }
    reset()
    setEditing(false)
  }

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
              <span className="si-edit-label">Access pattern</span>
              <div className="si-tagpicker">
                {ACCESS_PATTERNS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    className={`si-tagchip ${accessPattern === p.value ? 'is-on' : ''}`}
                    onClick={() => setAccessPattern(accessPattern === p.value ? '' : p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
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

      {/* Gallery */}
      <section className="si-section">
        <h2 className="si-section-title">Gallery</h2>
        <div className="si-gallery">
          {gallery.map((g, idx) => {
            const url = mediaUrl(g.image, 'card')
            return (
              <div className="si-gallery-cell" key={idx}>
                {url ? <img src={url} alt={g.caption ?? ''} /> : null}
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

      {/* Actions */}
      <div className="si-detail-actions">
        {editing ? (
          <>
            {error && <div className="si-error">{error}</div>}
            {!isCreating && (
              <button type="button" className="si-btn si-btn--danger si-btn--sm" onClick={handleDelete} disabled={saving}>
                Delete space
              </button>
            )}
            <span className="si-edit-spacer" />
            <button type="button" className="si-btn si-btn--ghost si-btn--sm" onClick={handleCancel} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="si-btn si-btn--sm" onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? 'Saving…' : isCreating ? 'Create space' : 'Save'}
            </button>
          </>
        ) : (
          <button type="button" className="si-btn si-btn--ghost" onClick={() => setEditing(true)}>
            Edit
          </button>
        )}
      </div>
    </div>
  )
}
