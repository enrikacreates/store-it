import { redirect } from 'next/navigation'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { LocationDetail } from '../[id]/LocationDetail'

export const dynamic = 'force-dynamic'

type Args = { searchParams: Promise<{ slot?: string; space?: string }> }

const PAGE_SIZE = 6

export default async function NewLocationPage({ searchParams }: Args) {
  const { space } = await searchParams
  const spaceNum = space ? Number.parseInt(space, 10) : 0
  const creatingSpace = Number.isFinite(spaceNum) && spaceNum >= 0 ? spaceNum : 0

  const payload = await getPayload({ config })
  const headers = await nextHeaders()
  const { user } = await payload.auth({ headers })
  if (!user) redirect('/signup')

  const [allLocsRes, tagsRes, categoriesRes, spacePagesRes] = await Promise.all([
    payload.find({ collection: 'locations', sort: 'name', limit: 500, depth: 0, user }),
    payload.find({ collection: 'tags', sort: 'name', limit: 500, depth: 0, user }),
    payload.find({ collection: 'categories', sort: 'name', limit: 200, depth: 0, user }),
    payload.find({ collection: 'space-pages', sort: 'pageIndex', limit: 100, depth: 0, user }),
  ])

  const spaceOf = (l: { space?: number | null; sortOrder?: number | null }) =>
    typeof l.space === 'number' ? l.space : Math.floor((l.sortOrder ?? 0) / PAGE_SIZE)

  // Next within-space order = max sortOrder in this space + 1 (append).
  const inSpace = allLocsRes.docs.filter((l) => spaceOf(l as never) === creatingSpace)
  const creatingSortOrder =
    inSpace.length === 0 ? 0 : Math.max(...inSpace.map((l) => (l as { sortOrder?: number }).sortOrder ?? 0)) + 1

  const allLocations = allLocsRes.docs.map((l) => ({ id: String(l.id), name: l.name }))
  const tags = tagsRes.docs.map((t) => ({ id: String(t.id), name: t.name }))
  const categories = categoriesRes.docs.map((c) => ({ id: String(c.id), name: c.name }))
  const pageNames = spacePagesRes.docs.map((sp) => ({
    pageIndex: (sp as unknown as { pageIndex: number }).pageIndex,
    name: (sp as unknown as { name: string }).name,
  }))

  return (
    <main className="si-page">
      <LocationDetail
        location={null}
        creatingSpace={creatingSpace}
        creatingSortOrder={creatingSortOrder}
        items={[]}
        locations={allLocations}
        tags={tags}
        categories={categories}
        pageNames={pageNames}
      />
    </main>
  )
}
