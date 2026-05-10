'use client'

import React, { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ACCESS_PATTERNS } from '../accessPatterns'

type Media = { id: string; url?: string; sizes?: { card?: { url?: string }; thumbnail?: { url?: string } } }

type Location = {
  id: string
  name: string
  primarilyFor?: string | null
  image?: Media | string | null
  accessPattern?: string | null
}

export function LocationTile({ location }: { location: Location }) {
  const router = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)

  const initialMedia = typeof location.image === 'object' && location.image !== null ? location.image : null
  const initialImgUrl = initialMedia?.sizes?.card?.url || initialMedia?.sizes?.thumbnail?.url || initialMedia?.url || null

  const [name, setName] = useState(location.name)
  const [primarilyFor, setPrimarilyFor] = useState(location.primarilyFor ?? '')
  const [imageId, setImageId] = useState<string | null>(initialMedia?.id ?? null)
  const [imageUrl, setImageUrl] = useState<string | null>(initialImgUrl)
  const [accessPattern, setAccessPattern] = useState<string>(location.accessPattern ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const reset = () => {
    setName(location.name)
    setPrimarilyFor(location.primarilyFor ?? '')
    setImageId(initialMedia?.id ?? null)
    setImageUrl(initialImgUrl)
    setAccessPattern(location.accessPattern ?? '')
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
      fd.append('alt', name || 'space photo')
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
        setImageUrl(doc.sizes?.card?.url || doc.sizes?.thumbnail?.url || doc.url || null)
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
      const res = await fetch(`/api/locations/${location.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          primarilyFor: primarilyFor.trim() || null,
          image: imageId || null,
          accessPattern: accessPattern || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.errors?.[0]?.message || 'Could not save.')
        setSaving(false)
        return
      }
      setEditing(false)
      setSaving(false)
      router.refresh()
    } catch {
      setError('Something went wrong.')
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${location.name}"?`)) return
    setSaving(true)
    try {
      const res = await fetch(`/api/locations/${location.id}`, { method: 'DELETE' })
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

  if (editing) {
    return (
      <div className="si-tile si-tile--editing">
        <button
          type="button"
          className="si-tile-edit-photo"
          onClick={() => fileInput.current?.click()}
          aria-label="Upload space photo"
        >
          {imageUrl ? <img src={imageUrl} alt="" /> : <span className="si-tile-edit-photo-empty">📷 Add a photo of this space</span>}
          {uploading && <span className="si-tile-edit-photo-loading">Uploading…</span>}
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
          maxLength={80}
          placeholder="Space name"
        />
        <input
          className="si-field"
          type="text"
          value={primarilyFor}
          onChange={(e) => setPrimarilyFor(e.target.value)}
          maxLength={120}
          placeholder="Theme — what belongs here? (e.g. camping / outdoor sports)"
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
        {error && <div className="si-error">{error}</div>}
        <div className="si-tile-edit-actions">
          <button type="button" className="si-btn si-btn--danger si-btn--sm" onClick={handleDelete} disabled={saving}>Delete</button>
          <span className="si-edit-spacer" />
          <button type="button" className="si-btn si-btn--ghost si-btn--sm" onClick={() => { reset(); setEditing(false) }} disabled={saving}>Cancel</button>
          <button type="button" className="si-btn si-btn--sm" onClick={handleSave} disabled={saving || !name.trim()}>{saving ? '…' : 'Save'}</button>
        </div>
      </div>
    )
  }

  return (
    <button className="si-tile" onClick={() => setEditing(true)} type="button" aria-label={`Edit ${location.name}`}>
      <div className="si-tile-image">
        {initialImgUrl ? <img src={initialImgUrl} alt="" /> : <div className="si-tile-placeholder" aria-hidden>📍</div>}
      </div>
      <div className="si-tile-text">
        <div className="si-tile-name">{location.name}</div>
        {location.primarilyFor && <div className="si-tile-subtitle">{location.primarilyFor}</div>}
      </div>
    </button>
  )
}
