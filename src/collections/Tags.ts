import type { CollectionConfig } from 'payload'
import { ownerScopedRead, ownerScopedWrite } from '../access'

export const Tags: CollectionConfig = {
  slug: 'tags',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'updatedAt'],
  },
  access: {
    read: ownerScopedRead,
    create: ownerScopedWrite,
    update: ownerScopedWrite,
    delete: ownerScopedWrite,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      admin: { position: 'sidebar', readOnly: true },
      hooks: {
        beforeValidate: [({ req, value }) => value || req.user?.id],
      },
    },
  ],
}
