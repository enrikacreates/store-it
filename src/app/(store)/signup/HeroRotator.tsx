'use client'

import React, { useEffect, useReducer } from 'react'

type Props = {
  rows: number[]
  startIdx: number
  intervalMs?: number
}

type State = { active: 0 | 1; slots: [number, number] }
type Action = { type: 'tick'; rows: number[] }

function reducer(s: State, a: Action): State {
  if (a.type === 'tick') {
    const next: 0 | 1 = s.active === 0 ? 1 : 0
    const nowVisibleVal = next === 1 ? s.slots[1] : s.slots[0]
    const idx = a.rows.indexOf(nowVisibleVal)
    const preloadVal = a.rows[(idx + 1) % a.rows.length]
    const slots: [number, number] =
      next === 1 ? [preloadVal, s.slots[1]] : [s.slots[0], preloadVal]
    return { active: next, slots }
  }
  return s
}

export function HeroRotator({ rows, startIdx, intervalMs = 2500 }: Props) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    active: 0 as const,
    slots: [rows[startIdx], rows[(startIdx + 1) % rows.length]] as [number, number],
  }))

  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'tick', rows }), intervalMs)
    return () => clearInterval(id)
  }, [rows, intervalMs])

  return (
    <>
      <img
        src={`/signup-hero-${state.slots[0]}.png`}
        alt=""
        style={{ opacity: state.active === 0 ? 1 : 0 }}
      />
      <img
        src={`/signup-hero-${state.slots[1]}.png`}
        alt=""
        style={{ opacity: state.active === 1 ? 1 : 0 }}
      />
    </>
  )
}
