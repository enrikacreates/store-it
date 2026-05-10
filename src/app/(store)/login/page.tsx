import React from 'react'
import { SignInForm } from './SignInForm'

export const metadata = { title: 'Sign in — Store It' }
export const dynamic = 'force-dynamic'

export default function SignInPage() {
  return (
    <main className="si-auth-page">
      <div className="si-auth-card">
        <p className="si-auth-eyebrow">Store It</p>
        <h1 className="si-auth-title">Welcome back</h1>
        <p className="si-auth-lede">Sign in to find your stuff.</p>

        <SignInForm />

        <p className="si-auth-footer">
          New here? <a href="/signup">Create an account</a>
        </p>
      </div>
    </main>
  )
}
