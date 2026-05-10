'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  parentId?: string
  label?: string
}

export function AddLocationButton({ parentId, label = '+ Add your first location' }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      const body: Record<string, unknown> = { name: name.trim() }
      if (parentId) body.parent = parentId
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.errors?.[0]?.message || data?.message || 'Could not save.')
        setSaving(false)
        return
      }
      setName('')
      setOpen(false)
      setSaving(false)
      router.refresh()
    } catch {
      setError('Something went wrong.')
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button className="si-btn" onClick={() => setOpen(true)} type="button">
        {label}
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="si-inline-form">
      <input
        className="si-field"
        type="text"
        placeholder="Name this location…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        required
        maxLength={80}
      />
      {error && <div className="si-error">{error}</div>}
      <div className="si-inline-actions">
        <button type="button" className="si-btn si-btn--ghost" onClick={() => { setOpen(false); setName(''); setError('') }}>
          Cancel
        </button>
        <button type="submit" className="si-btn" disabled={saving || !name.trim()}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}
