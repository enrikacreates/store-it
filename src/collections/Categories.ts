import type { CollectionConfig } from 'payload'
import { ownerScopedRead, ownerScopedWrite } from '../access'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'color', 'icon', 'updatedAt'],
  },
  access: {
    read: ownerScopedRead,
    create: ownerScopedWrite,
    update: ownerScopedWrite,
    delete: ownerScopedWrite,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'color', type: 'text', admin: { description: 'Hex color e.g. #FA9B64' } },
    { name: 'icon', type: 'text', admin: { description: 'Lucide icon name e.g. Wrench' } },
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
