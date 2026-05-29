export interface GoalFactors {
  weightKg: number
  sex: 'male' | 'female' | 'other'
  exerciseMinutes: number
  isPregnant: boolean
  isBreastfeeding: boolean
  hotWeather: boolean
}

export interface GoalResult {
  baseMl: number
  adjustmentsMl: number
  totalMl: number
  totalGlasses: number
  breakdown: string[]
}

export function calculateDailyGoal(factors: GoalFactors): GoalResult {
  // 1. BASE: peso × 35 ml (male/other) o × 31 ml (female)
  const mlPerKg = factors.sex === 'female' ? 31 : 35
  const baseMl = Math.round(factors.weightKg * mlPerKg)

  const adjustments: { label: string; ml: number }[] = []

  // 2. EJERCICIO: +500 ml por hora (proporcional a minutos)
  if (factors.exerciseMinutes > 0) {
    const extraMl = Math.round((factors.exerciseMinutes / 60) * 500)
    adjustments.push({ label: `Ejercicio (${factors.exerciseMinutes} min)`, ml: extraMl })
  }

  // 3. CLIMA CALUROSO: +400 ml
  if (factors.hotWeather) {
    adjustments.push({ label: 'Clima caluroso', ml: 400 })
  }

  // 4. EMBARAZO: +300 ml
  if (factors.isPregnant) {
    adjustments.push({ label: 'Embarazo', ml: 300 })
  }

  // 5. LACTANCIA: +700 ml (reemplaza embarazo, no se suman)
  if (factors.isBreastfeeding) {
    const idx = adjustments.findIndex(a => a.label === 'Embarazo')
    if (idx !== -1) adjustments.splice(idx, 1)
    adjustments.push({ label: 'Lactancia', ml: 700 })
  }

  const adjustmentsMl = adjustments.reduce((sum, a) => sum + a.ml, 0)
  const totalMl = baseMl + adjustmentsMl

  return {
    baseMl,
    adjustmentsMl,
    totalMl,
    totalGlasses: Math.ceil(totalMl / 250),
    breakdown: [
      `Base (${factors.weightKg} kg × ${mlPerKg} ml): ${baseMl} ml`,
      ...adjustments.map(a => `+ ${a.label}: ${a.ml} ml`),
      `Total: ${totalMl} ml (${Math.ceil(totalMl / 250)} vasos)`,
    ],
  }
}

/** Distributes glasses evenly across active hours, rounded to nearest 15 min. */
export function calculateRecommendedInterval(
  totalGlasses: number,
  wakeUpTime: string,
  bedTime: string,
): number {
  const [wakeH, wakeM] = wakeUpTime.split(':').map(Number)
  const [bedH, bedM] = bedTime.split(':').map(Number)
  const wakeMinutes = wakeH * 60 + wakeM
  const bedMinutes = bedH * 60 + bedM
  const activeMinutes = bedMinutes > wakeMinutes
    ? bedMinutes - wakeMinutes
    : 24 * 60 - wakeMinutes + bedMinutes

  if (totalGlasses <= 1) return Math.min(activeMinutes, 240)

  const raw = activeMinutes / (totalGlasses - 1)
  const rounded = Math.round(raw / 15) * 15
  return Math.max(15, Math.min(240, rounded))
}
