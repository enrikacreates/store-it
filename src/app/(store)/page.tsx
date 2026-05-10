import { redirect } from 'next/navigation'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { BentoGrid } from './components/BentoGrid'
import { LocationTile } from './components/LocationTile'
import { AddLocationTile } from './components/AddLocationTile'
import { ItemQuickAdd } from './components/ItemQuickAdd'
import { ItemRow } from './components/ItemRow'
import { pickRandomTiles } from './heroRows'

export const dynamic = 'force-dynamic'

const MIN_BENTO_CELLS = 6

export default async function HomePage() {
  const payload = await getPayload({ config })
  const headers = await nextHeaders()
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/signup')
  }

  const [topLocationsRes, allLocationsRes, unassignedRes, categoriesRes, tagsRes] = await Promise.all([
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
      where: { location: { exists: false } },
      sort: '-createdAt',
      limit: 200,
      depth: 1,
      user,
    }),
    payload.find({ collection: 'categories', sort: 'name', limit: 200, depth: 0, user }),
    payload.find({ collection: 'tags', sort: 'name', limit: 500, depth: 0, user }),
  ])

  const topLocations = topLocationsRes.docs
  const allLocations = allLocationsRes.docs.map((l) => ({ id: String(l.id), name: l.name }))
  const unassignedItems = unassignedRes.docs
  const categories = categoriesRes.docs.map((c) => ({ id: String(c.id), name: c.name, color: (c as { color?: string | null }).color ?? null }))
  const tags = tagsRes.docs.map((t) => ({ id: String(t.id), name: t.name }))

  const heroTiles = pickRandomTiles(4)

  // Always show at least 6 cells in the bento. Trailing cells are "Add a space" placeholders.
  const placeholderCount = Math.max(1, MIN_BENTO_CELLS - topLocations.length)

  return (
    <main className="si-page">
      <div className="si-dash-strip" aria-hidden>
        {heroTiles.map((t, i) => (
          <div className="si-dash-strip-cell" key={`${t.row}-${t.col}-${i}`}>
            <img src={`/signup-tile-${t.row}-${t.col}.png`} alt="" />
          </div>
        ))}
      </div>

      <header className="si-header">
        <p className="si-eyebrow">Store It</p>
        <h1 className="si-title">Store it, find it.</h1>
        <p className="si-lede">A simple home organization app for creatives.</p>
      </header>

      <section className="si-section">
        <ItemQuickAdd />
      </section>

      <section className="si-section">
        <h2 className="si-section-title">Spaces</h2>
        <BentoGrid>
          {topLocations.map((loc) => (
            <LocationTile key={loc.id} location={loc as never} />
          ))}
          {Array.from({ length: placeholderCount }).map((_, i) => (
            <AddLocationTile key={`add-${i}`} />
          ))}
        </BentoGrid>
      </section>

      <section className="si-section">
        <h2 className="si-section-title">Unassigned items</h2>
        {unassignedItems.length > 0 ? (
          <ul className="si-item-list">
            {unassignedItems.map((it) => (
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
          <p className="si-section-empty">All items have a home. Add more above to keep brain-dumping.</p>
        )}
      </section>
    </main>
  )
}
