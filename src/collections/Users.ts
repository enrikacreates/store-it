import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'displayName', 'role', 'updatedAt'],
  },
  auth: true,
  access: {
    admin: ({ req: { user } }) => user?.role === 'admin',
    create: () => true,
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin' || user.role === 'team') return true
      return { id: { equals: user.id } }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { id: { equals: user.id } }
    },
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      label: 'Display Name',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'subscriber',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Team', value: 'team' },
        { label: 'Subscriber', value: 'subscriber' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
