export type AccessPattern = 'quick-access' | 'long-term' | 'seasonal' | 'on-the-go' | 'active-project'

export const ACCESS_PATTERNS: { value: AccessPattern; label: string }[] = [
  { value: 'quick-access', label: 'Quick access' },
  { value: 'long-term', label: 'Long-term storage' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'on-the-go', label: 'On-the-go' },
  { value: 'active-project', label: 'Active project' },
]

export function accessPatternLabel(value?: string | null): string | null {
  return ACCESS_PATTERNS.find((p) => p.value === value)?.label ?? null
}
