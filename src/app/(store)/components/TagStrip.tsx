'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Tag = { id: string; name: string }

export function TagStrip({ tags: initialTags }: { tags: Tag[] }) {
  const [tags, setTags] = useState<Tag[]>(initialTags)

  // Reconcile from server
  useEffect(() => {
    setTags(initialTags)
  }, [initialTags])

  const handleUpdate = (id: string, name: string) => {
    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)))
  }
  const handleDelete = (id: string) => {
    setTags((prev) => prev.filter((t) => t.id !== id))
  }
  const handleAdd = (tag: Tag) => {
    setTags((prev) => [...prev, tag])
  }
  const handleReplace = (tempId: string, real: Tag) => {
    setTags((prev) => prev.map((t) => (t.id === tempId ? real : t)))
  }
  const handleRevertAdd = (tempId: string) => {
    setTags((prev) => prev.filter((t) => t.id !== tempId))
  }

  return (
    <div className="si-cat-strip">
      {tags.map((t) => (
        <TagChip key={t.id} tag={t} onUpdate={handleUpdate} onDelete={handleDelete} />
      ))}
      <AddTagChip onAdd={handleAdd} onReplace={handleReplace} onRevert={handleRevertAdd} />
    </div>
  )
}

function TagChip({
  tag,
  onUpdate,
  onDelete,
}: {
  tag: Tag
  onUpdate: (id: string, name: string) => void
  onDelete: (id: string) => void
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(tag.name)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setError('')
    setEditing(false)
    const before = tag.name
    onUpdate(tag.id, trimmed) // optimistic
    setSaving(true)
    try {
      const res = await fetch(`/api/tags/${tag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (!res.ok) {
        onUpdate(tag.id, before) // revert
        setError('Could not save.')
        setEditing(true)
      } else {
        router.refresh()
      }
    } catch {
      onUpdate(tag.id, before)
      setError('Something went wrong.')
      setEditing(true)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete category "${tag.name}"?`)) return
    onDelete(tag.id) // optimistic
    setSaving(true)
    try {
      const res = await fetch(`/api/tags/${tag.id}`, { method: 'DELETE' })
      if (!res.ok) {
        // Re-add for clarity (caller would need to know — for simplicity just refresh)
        router.refresh()
      } else {
        router.refresh()
      }
    } catch {
      router.refresh()
    } finally {
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

function AddTagChip({
  onAdd,
  onReplace,
  onRevert,
}: {
  onAdd: (tag: Tag) => void
  onReplace: (tempId: string, real: Tag) => void
  onRevert: (tempId: string) => void
}) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setError('')
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    onAdd({ id: tempId, name: trimmed })
    setName('')
    setAdding(false)
    setSaving(true)
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (!res.ok) {
        onRevert(tempId)
        const data = await res.json().catch(() => ({}))
        setError(data?.errors?.[0]?.message || 'Could not save.')
        setAdding(true)
        setName(trimmed)
        setSaving(false)
        return
      }
      const data = await res.json()
      const real = data?.doc
      if (real?.id) {
        onReplace(tempId, { id: String(real.id), name: real.name })
      }
      router.refresh()
    } catch {
      onRevert(tempId)
      setError('Something went wrong.')
      setAdding(true)
      setName(trimmed)
    } finally {
      setSaving(false)
    }
  }

  if (!adding) {
    return (
      <button type="button" className="si-cat-chip si-cat-chip--add" onClick={() => setAdding(true)}>
        + Add category
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="si-cat-add-form">
      <input
        className="si-cat-input"
        type="text"
        placeholder="Category name (e.g. art supplies)"
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
