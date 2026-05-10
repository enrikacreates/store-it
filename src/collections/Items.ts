import type { CollectionConfig } from 'payload'
import { ownerScopedRead, ownerScopedWrite } from '../access'

export const Items: CollectionConfig = {
  slug: 'items',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'location', 'category', 'updatedAt'],
  },
  access: {
    read: ownerScopedRead,
    create: ownerScopedWrite,
    update: ownerScopedWrite,
    delete: ownerScopedWrite,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'location',
      type: 'relationship',
      relationTo: 'locations',
      hasMany: false,
      admin: {
        description: 'Optional — leave empty to brain-dump first, assign a location later.',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: false,
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Photo of the item itself (out of context)',
      },
    },
    {
      name: 'hotspotX',
      type: 'number',
      min: 0,
      max: 1,
      admin: {
        description: 'X coordinate (0–1) on the parent location\'s photo',
      },
    },
    {
      name: 'hotspotY',
      type: 'number',
      min: 0,
      max: 1,
    },
    {
      name: 'quantity',
      type: 'number',
      defaultValue: 1,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      admin: { position: 'sidebar', readOnly: true },
      hooks: {
        beforeValidate: [
          ({ req, value }) => value || req.user?.id,
        ],
      },
    },
  ],
}
