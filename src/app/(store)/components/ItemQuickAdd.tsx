'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function ItemQuickAdd() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.errors?.[0]?.message || data?.message || 'Could not save.')
        setSaving(false)
        return
      }
      setName('')
      setSaving(false)
      router.refresh()
      // Keep focus for rapid brain-dump
      inputRef.current?.focus()
    } catch {
      setError('Something went wrong.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="si-quickadd">
      <input
        ref={inputRef}
        className="si-quickadd-input"
        type="text"
        placeholder="Add an item — name it, hit enter, repeat"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        maxLength={120}
        disabled={saving}
      />
      <button type="submit" className="si-quickadd-btn" disabled={saving || !name.trim()}>
        {saving ? '…' : 'Add'}
      </button>
      {error && <div className="si-error si-quickadd-error">{error}</div>}
    </form>
  )
}
