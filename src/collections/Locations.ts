import type { CollectionConfig } from 'payload'
import { ownerScopedRead, ownerScopedWrite } from '../access'

export const Locations: CollectionConfig = {
  slug: 'locations',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'parent', 'owner', 'updatedAt'],
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
      name: 'parent',
      type: 'relationship',
      relationTo: 'locations',
      hasMany: false,
      admin: {
        description: 'Leave empty for top-level locations',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Lead photo — appears on the dashboard tile.',
      },
    },
    {
      name: 'gallery',
      type: 'array',
      label: 'Gallery',
      admin: {
        description: 'Additional photos showing detail, drawers, organization views, etc.',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
        },
      ],
    },
    {
      name: 'icon',
      type: 'text',
      admin: {
        description: 'Lucide icon name — used as fallback when no photo is set (e.g., DoorOpen, Bed, Archive).',
      },
    },
    {
      name: 'accessPattern',
      type: 'select',
      label: 'Access pattern',
      options: [
        { label: 'Quick access', value: 'quick-access' },
        { label: 'Long-term storage', value: 'long-term' },
        { label: 'Seasonal', value: 'seasonal' },
        { label: 'On-the-go', value: 'on-the-go' },
        { label: 'Active project', value: 'active-project' },
      ],
      admin: {
        description: 'How this space is primarily used.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'primarilyFor',
      type: 'text',
      label: 'Primarily for',
      admin: {
        description: 'What this location is primarily for. e.g., "storing dog\'s items".',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
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
