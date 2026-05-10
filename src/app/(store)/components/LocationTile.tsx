'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

type Media = { url?: string; sizes?: { card?: { url?: string }; thumbnail?: { url?: string } } }

type Location = {
  id: string
  name: string
  primarilyFor?: string | null
  image?: Media | string | null
}

export function LocationTile({ location }: { location: Location }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(location.name)
  const [primarilyFor, setPrimarilyFor] = useState(location.primarilyFor ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const media = typeof location.image === 'object' && location.image !== null ? location.image : null
  const imgUrl = media?.sizes?.card?.url || media?.sizes?.thumbnail?.url || media?.url

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
        <input
          className="si-field"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          maxLength={80}
          placeholder="Space name"
        />
        <input
          className="si-field"
          type="text"
          value={primarilyFor}
          onChange={(e) => setPrimarilyFor(e.target.value)}
          maxLength={120}
          placeholder="Primarily for… (optional)"
        />
        {error && <div className="si-error">{error}</div>}
        <div className="si-tile-edit-actions">
          <button type="button" className="si-btn si-btn--danger si-btn--sm" onClick={handleDelete} disabled={saving}>Delete</button>
          <span className="si-edit-spacer" />
          <button type="button" className="si-btn si-btn--ghost si-btn--sm" onClick={() => { setEditing(false); setName(location.name); setPrimarilyFor(location.primarilyFor ?? ''); setError('') }} disabled={saving}>Cancel</button>
          <button type="button" className="si-btn si-btn--sm" onClick={handleSave} disabled={saving || !name.trim()}>{saving ? '…' : 'Save'}</button>
        </div>
      </div>
    )
  }

  return (
    <button className="si-tile" onClick={() => setEditing(true)} type="button" aria-label={`Edit ${location.name}`}>
      <div className="si-tile-image">
        {imgUrl ? <img src={imgUrl} alt="" /> : <div className="si-tile-placeholder" aria-hidden>📍</div>}
      </div>
      <div className="si-tile-name">{location.name}</div>
    </button>
  )
}
