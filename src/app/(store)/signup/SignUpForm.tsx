'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const createRes = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          displayName: displayName || email.split('@')[0],
          role: 'subscriber',
        }),
      })

      if (!createRes.ok) {
        const data = await createRes.json().catch(() => ({}))
        setError(data?.errors?.[0]?.message || data?.message || 'Sign-up failed. Try again.')
        setLoading(false)
        return
      }

      const loginRes = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!loginRes.ok) {
        router.push('/login?redirect=' + encodeURIComponent(redirectTo))
        return
      }

      router.push(redirectTo)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="si-form">
      {error && <div className="si-error">{error}</div>}
      <input
        className="si-field"
        type="text"
        placeholder="Your name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        autoComplete="name"
        required
      />
      <input
        className="si-field"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />
      <input
        className="si-field"
        type="password"
        placeholder="Password (8+ characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        minLength={8}
        required
      />
      <button className="si-submit" type="submit" disabled={loading}>
        {loading ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}
