import React from 'react'
import Link from 'next/link'

type Crumb = { id: string | null; name: string }

export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className="si-crumb" aria-label="Location path">
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1
        const node = c.id ? (
          <Link href={c.id === 'home' ? '/' : `/l/${c.id}`} className="si-crumb-link">{c.name}</Link>
        ) : (
          <span className="si-crumb-current">{c.name}</span>
        )
        return (
          <React.Fragment key={`${c.id ?? 'cur'}-${i}`}>
            {isLast ? <span className="si-crumb-current">{c.name}</span> : node}
            {!isLast && <span className="si-crumb-sep" aria-hidden>·</span>}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
