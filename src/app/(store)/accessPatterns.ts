export type AccessPattern = 'quick-access' | 'long-term' | 'seasonal' | 'on-the-go' | 'active-project' | 'general'

export type AccessPatternDef = {
  value: AccessPattern
  label: string
  /** Pill background color */
  color: string
  /** Text color on the pill */
  textColor: string
}

export const ACCESS_PATTERNS: AccessPatternDef[] = [
  { value: 'quick-access', label: 'Quick access', color: '#FA9B64', textColor: '#FFFFFF' },
  { value: 'long-term', label: 'Long-term', color: '#34547A', textColor: '#FFFFFF' },
  { value: 'seasonal', label: 'Seasonal', color: '#FDC4C5', textColor: '#1A1A1A' },
  { value: 'on-the-go', label: 'On-the-go', color: '#79C9B1', textColor: '#FFFFFF' },
  { value: 'active-project', label: 'Active project', color: '#F2D052', textColor: '#1A1A1A' },
  { value: 'general', label: 'General storage', color: '#33A7FF', textColor: '#FFFFFF' },
]

export function accessPatternDef(value?: string | null): AccessPatternDef | null {
  return ACCESS_PATTERNS.find((p) => p.value === value) ?? null
}

export function accessPatternLabel(value?: string | null): string | null {
  return accessPatternDef(value)?.label ?? null
}
