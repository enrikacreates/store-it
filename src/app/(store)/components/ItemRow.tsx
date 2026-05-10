'use client'

import React, { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Loc = { id: string; name: string }
type Cat = { id: string; name: string; color?: string | null }
type Tag = { id: string; name: string }
type Media = { id: string; url?: string; sizes?: { thumbnail?: { url?: string } } }

type Item = {
  id: string
  name: string
  description?: string | null
  location?: Loc | string | null
  category?: Cat | string | null
  tags?: (Tag | string)[] | null
  image?: Media | string | null
}

type Props = {
  item: Item
  locations: Loc[]
  categories: Cat[]
  tags: Tag[]
}

export function ItemRow({ item, locations, categories, tags }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const initialLoc = typeof item.location === 'object' && item.location !== null ? item.location : null
  const initialCat = typeof item.category === 'object' && item.category !== null ? item.category : null
  const initialTags = (item.tags || [])
    .map((t) => (typeof t === 'object' && t !== null ? t : null))
    .filter((t): t is Tag => t !== null)
  const initialImage = typeof item.image === 'object' && item.image !== null ? item.image : null
  const initialImageUrl = initialImage?.sizes?.thumbnail?.url || initialImage?.url || null

  const [name, setName] = useState(item.name)
  const [locId, setLocId] = useState<string>(initialLoc?.id ?? '')
  const [catId, setCatId] = useState<string>(initialCat?.id ?? '')
  const [tagIds, setTagIds] = useState<string[]>(initialTags.map((t) => t.id))
  const [description, setDescription] = useState(item.description ?? '')
  const [imageId, setImageId] = useState<string | null>(initialImage?.id ?? null)
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const reset = () => {
    setName(item.name)
    setLocId(initialLoc?.id ?? '')
    setCatId(initialCat?.id ?? '')
    setTagIds(initialTags.map((t) => t.id))
    setDescription(item.description ?? '')
    setImageId(initialImage?.id ?? null)
    setImageUrl(initialImageUrl)
    setError('')
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('alt', name || file.name)
      const res = await fetch('/api/media', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.errors?.[0]?.message || 'Upload failed.')
        setUploading(false)
        return
      }
      const data = await res.json()
      const doc = data?.doc
      if (doc?.id) {
        setImageId(doc.id)
        setImageUrl(doc.sizes?.thumbnail?.url || doc.url || null)
      }
      setUploading(false)
    } catch {
      setError('Upload failed.')
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      const body = {
        name: name.trim(),
        location: locId || null,
        category: catId || null,
        tags: tagIds,
        description: description.trim() || null,
        image: imageId || null,
      }
      const res = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.errors?.[0]?.message || data?.message || 'Could not save.')
        setSaving(false)
        return
      }
      setEditing(false)
      setShowDetails(false)
      setSaving(false)
      router.refresh()
    } catch {
      setError('Something went wrong.')
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${item.name}"?`)) return
    setSaving(true)
    try {
      const res = await fetch(`/api/items/${item.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.errors?.[0]?.message || 'Could not delete.')
        setSaving(false)
        return
      }
      router.refresh()
    } catch {
      setError('Something went wrong.')
      setSaving(false)
    }
  }

  const toggleTag = (id: string) => {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  if (!editing) {
    return (
      <li className="si-item">
        <button
          className="si-item-main"
          onClick={() => setEditing(true)}
          aria-label={`Edit ${item.name}`}
        >
          {initialImageUrl && (
            <span className="si-item-thumb"><img src={initialImageUrl} alt="" /></span>
          )}
          <span className="si-item-name">{item.name}</span>
          {initialLoc ? (
            <span className="si-item-loc">{initialLoc.name}</span>
          ) : (
            <span className="si-item-loc si-item-loc--unassigned">Unassigned</span>
          )}
        </button>
      </li>
    )
  }

  return (
    <li className="si-item si-item--editing">
      <div className="si-edit-top">
        <button
          type="button"
          className="si-edit-thumb"
          onClick={() => fileInput.current?.click()}
          aria-label="Upload photo"
        >
          {imageUrl ? <img src={imageUrl} alt="" /> : <span className="si-edit-thumb-empty">📷</span>}
          {uploading && <span className="si-edit-thumb-loading">…</span>}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          onChange={handleFile}
          style={{ display: 'none' }}
        />
        <input
          className="si-field"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          maxLength={120}
          placeholder="Item name"
        />
      </div>

      <label className="si-edit-row">
        <span className="si-edit-label">Location</span>
        <select
          className="si-field si-select"
          value={locId}
          onChange={(e) => setLocId(e.target.value)}
        >
          <option value="">— Unassigned —</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </label>

      {showDetails && (
        <>
          {tags.length > 0 && (
            <div className="si-edit-row">
              <span className="si-edit-label">Tags</span>
              <div className="si-tagpicker">
                {tags.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`si-tagchip ${tagIds.includes(t.id) ? 'is-on' : ''}`}
                    onClick={() => toggleTag(t.id)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="si-edit-row">
            <span className="si-edit-label">Notes</span>
            <textarea
              className="si-field si-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional notes"
            />
          </label>
        </>
      )}

      {error && <div className="si-error">{error}</div>}

      <div className="si-edit-actions">
        <button
          type="button"
          className="si-btn si-btn--ghost si-btn--sm"
          onClick={() => setShowDetails((v) => !v)}
        >
          {showDetails ? 'Less' : 'More details'}
        </button>
        <span className="si-edit-spacer" />
        <button type="button" className="si-btn si-btn--danger si-btn--sm" onClick={handleDelete} disabled={saving}>
          Delete
        </button>
        <button type="button" className="si-btn si-btn--ghost si-btn--sm" onClick={() => { reset(); setEditing(false); setShowDetails(false) }} disabled={saving}>
          Cancel
        </button>
        <button type="button" className="si-btn si-btn--sm" onClick={handleSave} disabled={saving || !name.trim()}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </li>
  )
}
