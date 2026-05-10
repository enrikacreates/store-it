'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Item = { id: string; name: string; location?: { id: string; name: string } | string | null }
type Loc = { id: string; name: string }
type Cat = { id: string; name: string }

type CreateResult = { ok: true } | { ok: false; error: string }

type Props = {
  items: Item[]
  locations: Loc[]
  categories: Cat[]
  /** Optional optimistic create handler; falls back to direct POST + refresh if absent. */
  onCreate?: (name: string) => Promise<CreateResult>
}

type Row =
  | { kind: 'item'; item: Item }
  | { kind: 'location'; loc: Loc }
  | { kind: 'category'; cat: Cat }
  | { kind: 'create' }

export function SearchAdd({ items, locations, categories, onCreate }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const q = query.trim().toLowerCase()

  const matchedItems = useMemo(
    () => (q ? items.filter((i) => i.name.toLowerCase().includes(q)).slice(0, 6) : []),
    [q, items],
  )
  const matchedLocations = useMemo(
    () => (q ? locations.filter((l) => l.name.toLowerCase().includes(q)).slice(0, 3) : []),
    [q, locations],
  )
  const matchedCategories = useMemo(
    () => (q ? categories.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 3) : []),
    [q, categories],
  )

  const rows: Row[] = useMemo(() => {
    const r: Row[] = []
    matchedItems.forEach((item) => r.push({ kind: 'item', item }))
    matchedLocations.forEach((loc) => r.push({ kind: 'location', loc }))
    matchedCategories.forEach((cat) => r.push({ kind: 'category', cat }))
    if (q) r.push({ kind: 'create' })
    return r
  }, [matchedItems, matchedLocations, matchedCategories, q])

  // Reset highlight when results change
  useEffect(() => {
    setHighlightIdx(0)
  }, [q])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const handleCreate = async () => {
    if (!q) return
    setSaving(true)
    setError('')
    const name = query.trim()

    if (onCreate) {
      // Optimistic path: clear input first, parent handles state update
      setQuery('')
      setOpen(false)
      setSaving(false)
      inputRef.current?.focus()
      const result = await onCreate(name)
      if (!result.ok) {
        setError(result.error)
        setQuery(name) // restore input so user can retry
      }
      return
    }

    // Fallback: direct POST + refresh
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.errors?.[0]?.message || 'Could not save.')
        setSaving(false)
        return
      }
      setQuery('')
      setOpen(false)
      setSaving(false)
      router.refresh()
      inputRef.current?.focus()
    } catch {
      setError('Something went wrong.')
      setSaving(false)
    }
  }

  const handleSelect = (row: Row) => {
    if (row.kind === 'create') {
      handleCreate()
      return
    }
    // For now, selecting an existing thing just closes the dropdown.
    // (Future: jump-to-edit on the row/tile.)
    setQuery('')
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('')
      setOpen(false)
      return
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleCreate()
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (rows.length === 0) return
      const row = rows[Math.min(highlightIdx, rows.length - 1)]
      handleSelect(row)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIdx((i) => Math.min(rows.length - 1, i + 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIdx((i) => Math.max(0, i - 1))
      return
    }
  }

  return (
    <div className="si-search" ref={wrapRef}>
      <div className="si-search-input-wrap">
        <span className="si-search-input-icon" aria-hidden>🔍</span>
        <input
          ref={inputRef}
          className="si-search-input"
          type="text"
          placeholder="Find or add something…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          autoFocus
          maxLength={120}
          disabled={saving}
        />
        <button
          type="button"
          className="si-search-add-btn"
          onClick={handleCreate}
          disabled={saving || !q}
          title="Add as new item (⌘↵)"
        >
          {saving ? '…' : 'Add'}
        </button>
      </div>

      {open && q && (
        <div className="si-search-results" role="listbox">
          {rows.map((row, i) => {
            const isOn = i === highlightIdx
            const onMouseEnter = () => setHighlightIdx(i)

            if (row.kind === 'item') {
              const loc =
                row.item.location && typeof row.item.location === 'object' ? row.item.location : null
              return (
                <button
                  key={`item-${row.item.id}`}
                  type="button"
                  className={`si-search-row ${isOn ? 'is-on' : ''}`}
                  onClick={() => handleSelect(row)}
                  onMouseEnter={onMouseEnter}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <span className="si-search-icon" aria-hidden>📦</span>
                  <span className="si-search-name">{row.item.name}</span>
                  <span className="si-search-meta">{loc ? `in ${loc.name}` : 'Unassigned'}</span>
                </button>
              )
            }
            if (row.kind === 'location') {
              return (
                <button
                  key={`loc-${row.loc.id}`}
                  type="button"
                  className={`si-search-row ${isOn ? 'is-on' : ''}`}
                  onClick={() => handleSelect(row)}
                  onMouseEnter={onMouseEnter}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <span className="si-search-icon" aria-hidden>📍</span>
                  <span className="si-search-name">{row.loc.name}</span>
                  <span className="si-search-meta">space</span>
                </button>
              )
            }
            if (row.kind === 'category') {
              return (
                <button
                  key={`cat-${row.cat.id}`}
                  type="button"
                  className={`si-search-row ${isOn ? 'is-on' : ''}`}
                  onClick={() => handleSelect(row)}
                  onMouseEnter={onMouseEnter}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <span className="si-search-icon" aria-hidden>🏷</span>
                  <span className="si-search-name">{row.cat.name}</span>
                  <span className="si-search-meta">category</span>
                </button>
              )
            }
            // create row
            return (
              <button
                key="create"
                type="button"
                className={`si-search-row si-search-row--create ${isOn ? 'is-on' : ''}`}
                onClick={() => handleSelect(row)}
                onMouseEnter={onMouseEnter}
                onMouseDown={(e) => e.preventDefault()}
              >
                <span className="si-search-icon" aria-hidden>+</span>
                <span className="si-search-name">Add &ldquo;{query.trim()}&rdquo; as a new item</span>
                <span className="si-search-meta">⌘↵</span>
              </button>
            )
          })}
          {error && <div className="si-error si-search-error">{error}</div>}
        </div>
      )}
    </div>
  )
}
