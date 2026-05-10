'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

type Tag = { id: string; name: string }

export function TagStrip({ tags }: { tags: Tag[] }) {
  return (
    <div className="si-cat-strip">
      {tags.map((t) => (
        <TagChip key={t.id} tag={t} />
      ))}
      <AddTagChip />
    </div>
  )
}

function TagChip({ tag }: { tag: Tag }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(tag.name)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/tags/${tag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
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
    if (!confirm(`Delete tag "${tag.name}"?`)) return
    setSaving(true)
    try {
      const res = await fetch(`/api/tags/${tag.id}`, { method: 'DELETE' })
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
      <span className="si-cat-add-form">
        <input
          className="si-cat-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          maxLength={40}
          disabled={saving}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSave() } if (e.key === 'Escape') { setEditing(false); setName(tag.name); setError('') } }}
        />
        <button type="button" className="si-cat-add-save" onClick={handleSave} disabled={saving || !name.trim()}>
          {saving ? '…' : 'Save'}
        </button>
        <button type="button" className="si-cat-add-cancel" onClick={handleDelete} title="Delete">🗑</button>
        <button type="button" className="si-cat-add-cancel" onClick={() => { setEditing(false); setName(tag.name); setError('') }} title="Cancel">✕</button>
        {error && <span className="si-error si-cat-error">{error}</span>}
      </span>
    )
  }

  return (
    <button
      type="button"
      className="si-cat-chip"
      onClick={() => setEditing(true)}
      title={`Edit "${tag.name}"`}
    >
      {tag.name}
    </button>
  )
}

function AddTagChip() {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.errors?.[0]?.message || 'Could not save.')
        setSaving(false)
        return
      }
      setName('')
      setAdding(false)
      setSaving(false)
      router.refresh()
    } catch {
      setError('Something went wrong.')
      setSaving(false)
    }
  }

  if (!adding) {
    return (
      <button type="button" className="si-cat-chip si-cat-chip--add" onClick={() => setAdding(true)}>
        + Add tag
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="si-cat-add-form">
      <input
        className="si-cat-input"
        type="text"
        placeholder="Tag name (e.g. art supplies)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        maxLength={40}
        disabled={saving}
      />
      <button type="submit" className="si-cat-add-save" disabled={saving || !name.trim()}>
        {saving ? '…' : 'Save'}
      </button>
      <button type="button" className="si-cat-add-cancel" onClick={() => { setAdding(false); setName(''); setError('') }}>✕</button>
      {error && <span className="si-error si-cat-error">{error}</span>}
    </form>
  )
}
