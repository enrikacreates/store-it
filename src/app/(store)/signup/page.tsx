import React from 'react'
import { SignUpForm } from './SignUpForm'
import { HeroRotator } from './HeroRotator'
import { HERO_ROWS } from '../heroRows'

export const metadata = { title: 'Create account — Store It' }
export const dynamic = 'force-dynamic'

export default function SignUpPage() {
  const startIdx = Math.floor(Math.random() * HERO_ROWS.length)
  return (
    <main className="si-auth-page">
      <div className="si-auth-card si-auth-card--hero">
        <div className="si-auth-hero" aria-hidden>
          <HeroRotator rows={HERO_ROWS} startIdx={startIdx} />
        </div>
        <div className="si-auth-body">
          <p className="si-auth-eyebrow">Store It</p>
          <h1 className="si-auth-title">Store your stuff.<br/>Find your stuff.</h1>
          <p className="si-auth-tagline">Always ready to create.</p>

          <SignUpForm />

          <p className="si-auth-footer">
            Already have an account? <a href="/login">Sign in</a>
          </p>
        </div>
      </div>
    </main>
  )
}
