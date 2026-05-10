import type { Access, Where } from 'payload'

/** Owner-scoped read: admins see all; everyone else only their own records. */
export const ownerScopedRead: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.role === 'admin' || user.role === 'team') return true
  return { owner: { equals: user.id } } as Where
}

/** Owner-scoped write (create/update/delete) — same rules. */
export const ownerScopedWrite: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.role === 'admin' || user.role === 'team') return true
  return { owner: { equals: user.id } } as Where
}
