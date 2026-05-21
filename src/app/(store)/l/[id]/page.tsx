import { redirect, notFound } from 'next/navigation'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { LocationDetail } from './LocationDetail'

export const dynamic = 'force-dynamic'

type Args = { params: Promise<{ id: string }> }

export default async function LocationDetailPage({ params }: Args) {
  const { id } = await params
  const payload = await getPayload({ config })
  const headers = await nextHeaders()
  const { user } = await payload.auth({ headers })
  if (!user) redirect('/signup')

  let location
  try {
    location = await payload.findByID({
      collection: 'locations',
      id,
      depth: 2,
      user,
    })
  } catch {
    notFound()
  }

  const itemsRes = await payload.find({
    collection: 'items',
    where: { location: { equals: id } },
    sort: '-createdAt',
    limit: 200,
    depth: 1,
    user,
  })

  const allLocsRes = await payload.find({
    collection: 'locations',
    sort: 'name',
    limit: 500,
    depth: 0,
    user,
  })
  const tagsRes = await payload.find({ collection: 'tags', sort: 'name', limit: 500, depth: 0, user })
  const categoriesRes = await payload.find({ collection: 'categories', sort: 'name', limit: 200, depth: 0, user })
  // Unassigned items — offered in the "assign existing" picker on the detail page.
  const unassignedRes = await payload.find({
    collection: 'items',
    where: { location: { exists: false } },
    sort: '-createdAt',
    limit: 300,
    depth: 0,
    user,
  })
  const spacePagesRes = await payload.find({
    collection: 'space-pages',
    sort: 'pageIndex',
    limit: 100,
    depth: 0,
    user,
  })

  const allLocations = allLocsRes.docs.map((l) => ({ id: String(l.id), name: l.name }))
  const tags = tagsRes.docs.map((t) => ({ id: String(t.id), name: t.name }))
  const categories = categoriesRes.docs.map((c) => ({ id: String(c.id), name: c.name }))
  const pageNames = spacePagesRes.docs.map((sp) => ({
    pageIndex: (sp as unknown as { pageIndex: number }).pageIndex,
    name: (sp as unknown as { name: string }).name,
  }))
  const unassignedItems = unassignedRes.docs.map((i) => ({ id: String(i.id), name: i.name }))

  return (
    <main className="si-page">
      <LocationDetail
        location={location as never}
        items={itemsRes.docs as never[]}
        locations={allLocations}
        tags={tags}
        categories={categories}
        pageNames={pageNames}
        unassignedItems={unassignedItems}
      />
    </main>
  )
}
