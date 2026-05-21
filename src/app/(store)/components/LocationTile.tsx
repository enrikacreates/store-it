import React from 'react'
import Link from 'next/link'
import { accessPatternDef } from '../accessPatterns'

type Media = { id: string; url?: string; sizes?: { card?: { url?: string }; thumbnail?: { url?: string } } }

type Location = {
  id: string
  name: string
  primarilyFor?: string | null
  image?: Media | string | null
  imageFocalY?: number | null
  imageFocalX?: number | null
  imageZoom?: number | null
  accessPattern?: string | null
  needsOrganizing?: boolean | null
  organizeBy?: string | null
}

/**
 * Compute urgency bucket from a target date.
 * - overdue: target date has passed
 * - soon: within 7 days
 * - later: more than 7 days out
 * - none: no date set
 */
function urgencyOf(organizeBy?: string | null): 'overdue' | 'soon' | 'later' | 'none' {
  if (!organizeBy) return 'none'
  const target = new Date(organizeBy)
  if (Number.isNaN(target.getTime())) return 'none'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((target.getTime() - today.getTime()) / 86_400_000)
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 7) return 'soon'
  return 'later'
}

function shortDate(organizeBy?: string | null): string {
  if (!organizeBy) return ''
  const d = new Date(organizeBy)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function LocationTile({ location }: { location: Location }) {
  const initialMedia = typeof location.image === 'object' && location.image !== null ? location.image : null
  // Prefer the original URL so the focal-point slider actually has the full image to reposition.
  // Falls back to sized variants if the original isn't available for some reason.
  const initialImgUrl = initialMedia?.url || initialMedia?.sizes?.card?.url || initialMedia?.sizes?.thumbnail?.url || null
  const ap = accessPatternDef(location.accessPattern)
  const focalY = typeof location.imageFocalY === 'number' ? location.imageFocalY : 50
  const focalX = typeof location.imageFocalX === 'number' ? location.imageFocalX : 50
  const zoom = typeof location.imageZoom === 'number' ? location.imageZoom : 100

  return (
    <Link className="si-tile" href={`/l/${location.id}`} aria-label={`Open ${location.name}`}>
      <div className="si-tile-image">
        {initialImgUrl ? (
          <img
            src={initialImgUrl}
            alt=""
            style={{
              objectPosition: `${focalX}% ${focalY}%`,
              transform: `scale(${zoom / 100})`,
              transformOrigin: `${focalX}% ${focalY}%`,
            }}
          />
        ) : (
          <div className="si-tile-placeholder" aria-hidden>📍</div>
        )}
        {location.needsOrganizing && (() => {
          const urgency = urgencyOf(location.organizeBy)
          const dateLabel = shortDate(location.organizeBy)
          const flagText = dateLabel
            ? urgency === 'overdue' ? `Overdue · ${dateLabel}` : `By ${dateLabel}`
            : 'Organize'
          const titleText = dateLabel
            ? urgency === 'overdue'
              ? `Overdue — target was ${dateLabel}`
              : `Organize by ${dateLabel}`
            : 'Needs organizing'
          return (
            <span
              className={`si-tile-flag si-tile-flag--${urgency}`}
              title={titleText}
              aria-label={titleText}
            >
              <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden>
                <path d="M3 1.5a.75.75 0 0 1 1.5 0V2h7.25a.75.75 0 0 1 .6 1.2L10.5 6l1.85 2.8a.75.75 0 0 1-.6 1.2H4.5v4.5a.75.75 0 0 1-1.5 0V1.5z" />
              </svg>
              <span className="si-tile-flag-label">{flagText}</span>
            </span>
          )
        })()}
      </div>
      <div className="si-tile-text">
        <div className="si-tile-name">{location.name}</div>
        {location.primarilyFor && <div className="si-tile-subtitle">{location.primarilyFor}</div>}
        {ap && (
          <span
            className="si-tile-ap"
            style={{ background: ap.color, color: ap.textColor }}
          >
            {ap.label}
          </span>
        )}
      </div>
    </Link>
  )
}
