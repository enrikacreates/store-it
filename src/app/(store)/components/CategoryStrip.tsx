'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

type Cat = { id: string; name: string; color?: string | null }

export function CategoryStrip({ categories }: { categories: Cat[] }) {
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
      const res = await fetch('/api/categories', {
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

  return (
    <div className="si-cat-strip">
      {categories.map((c) => (
        <span key={c.id} className="si-cat-chip" style={c.color ? { background: c.color, color: '#fff' } : undefined}>
          {c.name}
        </span>
      ))}
      {adding ? (
        <form onSubmit={handleSubmit} className="si-cat-add-form">
          <input
            className="si-cat-input"
            type="text"
            placeholder="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={40}
            disabled={saving}
          />
          <button type="submit" className="si-cat-add-save" disabled={saving || !name.trim()}>
            {saving ? '…' : 'Save'}
          </button>
          <button type="button" className="si-cat-add-cancel" onClick={() => { setAdding(false); setName(''); setError('') }}>
            ✕
          </button>
        </form>
      ) : (
        <button type="button" className="si-cat-chip si-cat-chip--add" onClick={() => setAdding(true)}>
          + Add category
        </button>
      )}
      {error && <div className="si-error si-cat-error">{error}</div>}
    </div>
  )
}
