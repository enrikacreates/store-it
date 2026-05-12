import type { CollectionConfig } from 'payload'
import { ownerScopedRead, ownerScopedWrite } from '../access'

export const SpacePages: CollectionConfig = {
  slug: 'space-pages',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'pageIndex', 'owner', 'updatedAt'],
  },
  access: {
    read: ownerScopedRead,
    create: ownerScopedWrite,
    update: ownerScopedWrite,
    delete: ownerScopedWrite,
  },
  fields: [
    {
      name: 'pageIndex',
      type: 'number',
      required: true,
      admin: { description: '0-based page index in the spaces bento' },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
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
