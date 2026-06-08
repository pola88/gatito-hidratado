export function calcTotalMl(entries: { amount: number }[]): number {
  return entries.reduce((sum, e) => sum + e.amount, 0)
}

export function calcGlasses(totalMl: number, glassVolumeMl: number): number {
  return Math.floor(totalMl / glassVolumeMl)
}

/** ML-based progress — canonical across app and widget. Always in [0, 100]. */
export function calcProgressPercent(totalMl: number, goalMl: number): number {
  return goalMl > 0 ? Math.min(100, Math.round((totalMl / goalMl) * 100)) : 0
}

/** Progress bar color: green ≥80%, blue ≥50%, orange otherwise. */
export function getProgressColor(pct: number): string {
  if (pct >= 80) return '#4ade80'
  if (pct >= 50) return '#60CFFF'
  return '#FB923C'
}
