// Active row banners for the rotating mood-board hero (signup card).
// Excluded rows had AI-glitches or imagery the user vetoed.
export const HERO_ROWS = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 17, 18]

// Individual tile assets (each row banner cropped into 3 tiles).
// Used as a static dashboard hero strip — random subset shown per page render.
export const HERO_TILES: Array<{ row: number; col: 1 | 2 | 3 }> = HERO_ROWS.flatMap(
  (row) => [1, 2, 3].map((col) => ({ row, col: col as 1 | 2 | 3 })),
)

export function pickRandomTiles(count: number): Array<{ row: number; col: 1 | 2 | 3 }> {
  // Fisher-Yates partial shuffle so the same tile doesn't appear twice.
  const pool = [...HERO_TILES]
  const out: Array<{ row: number; col: 1 | 2 | 3 }> = []
  for (let i = 0; i < count && pool.length > 0; i++) {
    const j = Math.floor(Math.random() * pool.length)
    out.push(pool[j])
    pool.splice(j, 1)
  }
  return out
}
