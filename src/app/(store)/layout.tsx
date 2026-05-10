import React from 'react'
import Link from 'next/link'
import './store.css'

export const metadata = {
  title: 'Store It — Store it. Find it.',
  description: 'A simple home organization app for creatives.',
}

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Link href="/" className="si-brand" aria-label="Store It — go to dashboard">
          Store <span className="si-brand-dot" aria-hidden>·</span> It
        </Link>
        {children}
      </body>
    </html>
  )
}
