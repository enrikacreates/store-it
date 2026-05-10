'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SearchAdd } from './SearchAdd'
import { ItemRow } from './ItemRow'

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
  accessPattern?: string | null
}

type Props = {
  initialItems: Item[]
  locations: Loc[]
  categories: Cat[]
  tags: Tag[]
}

export function ItemsBoard({ initialItems, locations, categories, tags }: Props) {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>(initialItems)

  // Reconcile when server pushes new prop (after refresh)
  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  // Items shown on dashboard = unassigned only (no location)
  const unassigned = items.filter((it) => {
    const loc = it.location
    return loc === null || loc === undefined
  })

  // Build the search-friendly item list (all items, with resolved location object)
  const searchItems = items.map((i) => {
    const loc = typeof i.location === 'object' && i.location !== null ? i.location : null
    return {
      id: i.id,
      name: i.name,
      location: loc ? { id: String((loc as Loc).id), name: (loc as Loc).name } : null,
    }
  })

  const handleCreateItem = async (name: string): Promise<{ ok: true } | { ok: false; error: string }> => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const tempItem: Item = { id: tempId, name }
    // Optimistic: prepend to list (sorted by createdAt desc)
    setItems((prev) => [tempItem, ...prev])

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        // Revert
        setItems((prev) => prev.filter((i) => i.id !== tempId))
        return { ok: false, error: data?.errors?.[0]?.message || 'Could not save.' }
      }
      const data = await res.json()
      const real = data?.doc
      if (real?.id) {
        // Replace temp with real
        setItems((prev) => prev.map((i) => (i.id === tempId ? { ...real, id: String(real.id) } : i)))
      }
      router.refresh()
      return { ok: true }
    } catch {
      setItems((prev) => prev.filter((i) => i.id !== tempId))
      return { ok: false, error: 'Something went wrong.' }
    }
  }

  const handleUpdateItem = async (
    id: string,
    updates: Partial<Item>,
  ): Promise<{ ok: true } | { ok: false; error: string }> => {
    const before = items.find((i) => i.id === id)
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)))
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        // Revert
        if (before) setItems((prev) => prev.map((i) => (i.id === id ? before : i)))
        return { ok: false, error: data?.errors?.[0]?.message || 'Could not save.' }
      }
      router.refresh()
      return { ok: true }
    } catch {
      if (before) setItems((prev) => prev.map((i) => (i.id === id ? before : i)))
      return { ok: false, error: 'Something went wrong.' }
    }
  }

  const handleDeleteItem = async (id: string): Promise<{ ok: true } | { ok: false; error: string }> => {
    const before = items.find((i) => i.id === id)
    setItems((prev) => prev.filter((i) => i.id !== id))
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        if (before) setItems((prev) => [...prev, before])
        return { ok: false, error: 'Could not delete.' }
      }
      router.refresh()
      return { ok: true }
    } catch {
      if (before) setItems((prev) => [...prev, before])
      return { ok: false, error: 'Something went wrong.' }
    }
  }

  return (
    <>
      <SearchAdd
        items={searchItems}
        locations={locations}
        categories={categories}
        onCreate={handleCreateItem}
      />
      <section className="si-section" style={{ marginTop: 32 }}>
        <h2 className="si-section-title">Unassigned items</h2>
        {unassigned.length > 0 ? (
          <ul className="si-item-list">
            {unassigned.map((it) => (
              <ItemRow
                key={it.id}
                item={it as never}
                locations={locations}
                categories={categories}
                tags={tags}
                onUpdate={handleUpdateItem}
                onDelete={handleDeleteItem}
              />
            ))}
          </ul>
        ) : (
          <p className="si-section-empty">All items have a home. Add more above to keep brain-dumping.</p>
        )}
      </section>
    </>
  )
}
