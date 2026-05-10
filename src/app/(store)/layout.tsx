import React from 'react'
import './store.css'

export const metadata = {
  title: 'Store It — Store your stuff. Find your stuff.',
  description: 'A simple home organization app for creatives.',
}

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
