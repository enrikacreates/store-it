import { redirect } from 'next/navigation'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { LocationDetail } from '../[id]/LocationDetail'

export const dynamic = 'force-dynamic'

type Args = { searchParams: Promise<{ slot?: string }> }

export default async function NewLocationPage({ searchParams }: Args) {
  const { slot } = await searchParams
  const slotNum = slot ? Number.parseInt(slot, 10) : 0

  const payload = await getPayload({ config })
  const headers = await nextHeaders()
  const { user } = await payload.auth({ headers })
  if (!user) redirect('/signup')

  const [allLocsRes, tagsRes, categoriesRes] = await Promise.all([
    payload.find({ collection: 'locations', sort: 'name', limit: 500, depth: 0, user }),
    payload.find({ collection: 'tags', sort: 'name', limit: 500, depth: 0, user }),
    payload.find({ collection: 'categories', sort: 'name', limit: 200, depth: 0, user }),
  ])

  const allLocations = allLocsRes.docs.map((l) => ({ id: String(l.id), name: l.name }))
  const tags = tagsRes.docs.map((t) => ({ id: String(t.id), name: t.name }))
  const categories = categoriesRes.docs.map((c) => ({ id: String(c.id), name: c.name }))

  return (
    <main className="si-page">
      <LocationDetail
        location={null}
        creatingSlot={Number.isFinite(slotNum) ? slotNum : 0}
        items={[]}
        locations={allLocations}
        tags={tags}
        categories={categories}
      />
    </main>
  )
}
