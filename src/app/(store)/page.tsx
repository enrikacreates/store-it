import { redirect } from 'next/navigation'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { SpacesBento } from './components/SpacesBento'
import { ItemsBoard } from './components/ItemsBoard'
import { TagStrip } from './components/TagStrip'
import { pickRandomTiles } from './heroRows'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const payload = await getPayload({ config })
  const headers = await nextHeaders()
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/signup')
  }

  const [topLocationsRes, allLocationsRes, allItemsRes, categoriesRes, tagsRes, spacePagesRes] = await Promise.all([
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
      limit: 500,
      depth: 1,
      user,
    }),
    payload.find({ collection: 'categories', sort: 'name', limit: 200, depth: 0, user }),
    payload.find({ collection: 'tags', sort: 'name', limit: 500, depth: 0, user }),
    payload.find({ collection: 'space-pages', sort: 'pageIndex', limit: 100, depth: 0, user }),
  ])

  const topLocations = topLocationsRes.docs
  const allLocations = allLocationsRes.docs.map((l) => ({ id: String(l.id), name: l.name }))
  const allItems = allItemsRes.docs.map((i) => ({ ...i, id: String(i.id) }))
  const categories = categoriesRes.docs.map((c) => ({ id: String(c.id), name: c.name, color: (c as { color?: string | null }).color ?? null }))
  const tags = tagsRes.docs.map((t) => ({ id: String(t.id), name: t.name }))
  const pageNames = spacePagesRes.docs.map((sp) => ({
    id: String(sp.id),
    pageIndex: (sp as { pageIndex: number }).pageIndex,
    name: sp.name,
  }))

  const heroTiles = pickRandomTiles(4)

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
        <h1 className="si-title">Store it. Find it.</h1>
        <p className="si-lede">A simple home organization app for creatives.</p>
      </header>

      <ItemsBoard
        initialItems={allItems as never[]}
        locations={allLocations}
        categories={categories}
        tags={tags}
      >
        <section className="si-section">
          <h2 className="si-section-title">Categories</h2>
          <TagStrip tags={tags} />
        </section>

        <section className="si-section">
          <h2 className="si-section-title">Spaces</h2>
          <SpacesBento locations={topLocations as never[]} initialPageNames={pageNames} />
        </section>
      </ItemsBoard>
    </main>
  )
}
