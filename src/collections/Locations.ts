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
      name: 'imageFocalY',
      type: 'number',
      defaultValue: 50,
      min: 0,
      max: 100,
      admin: {
        description: 'Vertical focal point of the lead image on the dashboard tile (0 = top, 100 = bottom).',
      },
    },
    {
      name: 'imageFocalX',
      type: 'number',
      defaultValue: 50,
      min: 0,
      max: 100,
      admin: {
        description: 'Horizontal focal point of the lead image on the dashboard tile (0 = left, 100 = right).',
      },
    },
    {
      name: 'imageZoom',
      type: 'number',
      defaultValue: 100,
      min: 100,
      max: 300,
      admin: {
        description: 'Zoom percentage of the lead image on the dashboard tile (100 = fit, 300 = 3x zoom). More zoom gives more crop room on both axes.',
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
      name: 'isHotspot',
      type: 'checkbox',
      label: 'Hotspot',
      defaultValue: false,
      admin: {
        description: 'A place that attracts clutter — track problem areas you keep needing to clear.',
      },
    },
    {
      name: 'needsOrganizing',
      type: 'checkbox',
      label: 'Organize it?',
      defaultValue: false,
      admin: {
        description: 'Flag a space that needs attention — shows a flag on the dashboard tile and lets you filter for spaces to tackle.',
      },
    },
    {
      name: 'organizeBy',
      type: 'date',
      label: 'By when?',
      admin: {
        description: 'Optional target date for organizing this space — shown on the flag to help prioritize.',
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'MMM d, yyyy',
        },
      },
    },
    {
      name: 'hotspotImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'A photo showing what this space looks like when cluttered.',
      },
    },
    {
      name: 'accessPattern',
      type: 'select',
      label: 'Access frequency',
      options: [
        { label: 'Quick access', value: 'quick-access' },
        { label: 'Long-term', value: 'long-term' },
        { label: 'Seasonal', value: 'seasonal' },
        { label: 'On-the-go', value: 'on-the-go' },
        { label: 'Active project', value: 'active-project' },
        { label: 'General storage', value: 'general' },
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
