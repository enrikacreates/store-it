import { redirect } from 'next/navigation'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { BentoGrid } from './components/BentoGrid'
import { LocationTile } from './components/LocationTile'
import { AddLocationTile } from './components/AddLocationTile'
import { ItemQuickAdd } from './components/ItemQuickAdd'
import { ItemRow } from './components/ItemRow'
import { HeroRotator } from './signup/HeroRotator'
import { HERO_ROWS } from './heroRows'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const payload = await getPayload({ config })
  const headers = await nextHeaders()
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/signup')
  }

  const [topLocationsRes, allLocationsRes, itemsRes, categoriesRes, tagsRes] = await Promise.all([
    payload.find({
      collection: 'locations',
      where: { parent: { exists: false } },
      sort: 'sortOrder',
      limit: 100,
      depth: 1,
      user,
    }),
    payload.find({
      collection: 'locations',
      sort: 'name',
      limit: 500,
      depth: 0,
      user,
    }),
    payload.find({
      collection: 'items',
      sort: '-createdAt',
      limit: 200,
      depth: 1,
      user,
    }),
    payload.find({ collection: 'categories', sort: 'name', limit: 200, depth: 0, user }),
    payload.find({ collection: 'tags', sort: 'name', limit: 500, depth: 0, user }),
  ])

  const locations = topLocationsRes.docs
  const allLocations = allLocationsRes.docs.map((l) => ({ id: String(l.id), name: l.name }))
  const items = itemsRes.docs
  const categories = categoriesRes.docs.map((c) => ({ id: String(c.id), name: c.name, color: (c as { color?: string | null }).color ?? null }))
  const tags = tagsRes.docs.map((t) => ({ id: String(t.id), name: t.name }))
  const hasItems = items.length > 0
  const hasLocations = locations.length > 0
  const heroStartIdx = Math.floor(Math.random() * HERO_ROWS.length)

  return (
    <main className="si-page">
      <div className="si-dash-hero" aria-hidden>
        <HeroRotator rows={HERO_ROWS} startIdx={heroStartIdx} />
      </div>

      <header className="si-header">
        <p className="si-eyebrow">Store It</p>
        <h1 className="si-title">Store your stuff.<br/>Find your stuff.</h1>
        <p className="si-lede">A simple home organization app for creatives.</p>
      </header>

      <section className="si-section">
        <h2 className="si-section-title">Items</h2>
        <ItemQuickAdd />
        {hasItems ? (
          <ul className="si-item-list">
            {items.map((it) => (
              <ItemRow
                key={it.id}
                item={it as never}
                locations={allLocations}
                categories={categories}
                tags={tags}
              />
            ))}
          </ul>
        ) : (
          <p className="si-section-empty">Brain-dump anything. Sort it later.</p>
        )}
      </section>

      <section className="si-section">
        <h2 className="si-section-title">Locations</h2>
        {hasLocations ? (
          <BentoGrid>
            {locations.map((loc) => (
              <LocationTile key={loc.id} location={loc as never} />
            ))}
            <AddLocationTile />
          </BentoGrid>
        ) : (
          <div className="si-section-empty-card">
            <p>No locations yet. You can add items first and decide where to put them later.</p>
            <BentoGrid>
              <AddLocationTile />
            </BentoGrid>
          </div>
        )}
      </section>
    </main>
  )
}
