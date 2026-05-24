import type { CollectionConfig } from 'payload'
import { ownerScopedRead, ownerScopedWrite } from '../access'

/**
 * VOCABULARY MAP (UI label ↔ data model) — keep in sync to avoid future confusion:
 *   • UI "Zone"        = a `locations` record (a storage spot, e.g. "Music Cabinet").
 *                        The DB collection stays `locations` even though the UI says "Zone".
 *   • UI "Space"       = a container/page of zones. A zone's space is the `space` field (0-based;
 *                        falls back to floor(sortOrder/6) when null). Spaces hold UNLIMITED zones.
 *                        Space NAMES live in the `space-pages` collection keyed by pageIndex
 *                        (= the space index). `sortOrder` orders zones WITHIN their space.
 *   • UI "Hot Zone"    = `isHotspot` (a zone prone to clutter).
 *                        `hotspotImage`      = the cluttered BEFORE photo.
 *                        `hotspotAfterImage` = the cleaned AFTER photo (before/after motivation).
 *   • UI "Organize it?"= `needsOrganizing` (+ `organizeBy` target date).
 *   • Tile crop for the dashboard image: `imageFocalX` / `imageFocalY` (0–100) + `imageZoom` (100–300).
 */
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
      label: 'Hot Zone',
      defaultValue: false,
      admin: {
        description: 'UI "Hot Zone" — a zone prone to clutter you keep needing to clear.',
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
      name: 'lastOrganizedAt',
      type: 'date',
      admin: {
        description: 'Timestamp set when the user taps "Done" — when this zone was last organized.',
        readOnly: true,
      },
    },
    {
      name: 'hotspotImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Hot Zone BEFORE photo — what this zone looks like when cluttered.',
      },
    },
    {
      name: 'hotspotAfterImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Hot Zone AFTER photo — captured via the "Done" button once the zone is cleaned up (before/after).',
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
      name: 'space',
      type: 'number',
      admin: {
        position: 'sidebar',
        description: 'Which Space (page) this zone belongs to (0-based). Spaces hold unlimited zones. If null, falls back to floor(sortOrder/6) for backward compatibility.',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Order of this zone WITHIN its space (ascending).',
      },
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
