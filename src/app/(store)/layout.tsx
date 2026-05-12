import React from 'react'
import Link from 'next/link'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { LogoutButton } from './components/LogoutButton'
import './store.css'

export const metadata = {
  title: 'Store It — Store it. Find it.',
  description: 'A simple home organization app for creatives.',
}

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Determine auth state so we only show the logout button when signed in.
  let isAuthed = false
  try {
    const payload = await getPayload({ config })
    const headers = await nextHeaders()
    const { user } = await payload.auth({ headers })
    isAuthed = !!user
  } catch {
    isAuthed = false
  }

  return (
    <html lang="en">
      <body>
        <Link href="/" className="si-brand" aria-label="Store It — go to dashboard">
          <svg
            className="si-brand-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="3" y="3" width="18" height="18" rx="2.5" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <circle cx="11" cy="6" r="0.6" fill="currentColor" />
            <circle cx="13" cy="6" r="0.6" fill="currentColor" />
            <circle cx="11" cy="12" r="0.6" fill="currentColor" />
            <circle cx="13" cy="12" r="0.6" fill="currentColor" />
            <circle cx="11" cy="18" r="0.6" fill="currentColor" />
            <circle cx="13" cy="18" r="0.6" fill="currentColor" />
          </svg>
          <span className="si-brand-text">
            Store <span className="si-brand-dot" aria-hidden>·</span> It
          </span>
        </Link>
        {isAuthed && <LogoutButton />}
        {children}
      </body>
    </html>
  )
}
