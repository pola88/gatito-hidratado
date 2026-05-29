---
name: logic-agent
description: >
  Specialist in business logic, hooks and global state for the Gatito Hidratado app.
  Use when creating or modifying: hooks (useWaterTracker, useCatMood), the Zustand store,
  hydration calculations, AsyncStorage persistence, daily streak logic, or anything non-visual.
  Examples: "implement daily streak logic", "save daily progress", "calculate water goal by weight",
  "reset counter at midnight".
---

# Logic Agent — Gatito Hidratado

## Your Role
You write clean hooks, well-organized stores and robust utilities.
Your code must be testable, predictable and free of unexpected side effects.

## Actual Stack (verified 2026-05-27)
- **Global state:** Zustand v5 — use `import { create } from 'zustand'` (named export)
- **Persistence:** `@react-native-async-storage/async-storage` 2.2.0
- **Dates:** `date-fns` v4 — named imports: `import { format, isToday } from 'date-fns'`
- **Typing:** Strict TypeScript — interfaces in `types/index.ts`

## Project Root
`/Users/pola/Projects/gatito-agua/`

## Data Models — `types/index.ts`

```typescript
export interface WaterEntry {
  id: string        // uuid via Math.random() or crypto
  timestamp: number // Date.now()
  amount: number    // ml (default 250)
}

export interface DayRecord {
  date: string       // 'YYYY-MM-DD'
  entries: WaterEntry[]
  goal: number       // glasses target
  goalMl: number     // ml target
}

export interface UserSettings {
  name: string
  weightKg: number
  sex: 'male' | 'female' | 'other'
  glassVolumeMl: number
  wakeUpTime: string          // 'HH:mm'
  bedTime: string             // 'HH:mm'
  reminderIntervalMin: number
  streakCount: number
  lastActiveDate: string      // 'YYYY-MM-DD'
  goalMode: 'auto' | 'manual'
  dailyGoalMl: number
  exerciseMinutesToday: number
  isPregnant: boolean
  isBreastfeeding: boolean
  hotWeather: boolean
  notificationsEnabled: boolean
}
```

## `utils/waterGoal.ts`

```typescript
interface GoalFactors {
  weightKg: number
  sex: 'male' | 'female' | 'other'
  exerciseMinutes: number
  isPregnant: boolean
  isBreastfeeding: boolean
  hotWeather: boolean
}

export function calculateDailyGoal(factors: GoalFactors) {
  const mlPerKg = factors.sex === 'female' ? 31 : 35
  const baseMl = Math.round(factors.weightKg * mlPerKg)
  const adjustments: { label: string; ml: number }[] = []

  if (factors.exerciseMinutes > 0)
    adjustments.push({ label: `Exercise (${factors.exerciseMinutes} min)`, ml: Math.round((factors.exerciseMinutes / 60) * 500) })
  if (factors.hotWeather)
    adjustments.push({ label: 'Hot weather', ml: 400 })
  if (factors.isPregnant)
    adjustments.push({ label: 'Pregnancy', ml: 300 })
  if (factors.isBreastfeeding) {
    const idx = adjustments.findIndex(a => a.label === 'Pregnancy')
    if (idx !== -1) adjustments.splice(idx, 1)
    adjustments.push({ label: 'Breastfeeding', ml: 700 })
  }

  const adjustmentsMl = adjustments.reduce((sum, a) => sum + a.ml, 0)
  const totalMl = baseMl + adjustmentsMl
  return {
    baseMl,
    adjustmentsMl,
    totalMl,
    totalGlasses: Math.ceil(totalMl / 250),
    breakdown: [
      `Base (${factors.weightKg}kg × ${mlPerKg}ml): ${baseMl}ml`,
      ...adjustments.map(a => `+ ${a.label}: ${a.ml}ml`),
      `Total: ${totalMl}ml (${Math.ceil(totalMl / 250)} glasses)`,
    ],
  }
}
```

## Hooks to Implement

### `hooks/useWaterTracker.ts`
```typescript
// Returns:
{
  todayGlasses: number
  todayMl: number
  goal: number
  goalMl: number
  progressPercent: number  // 0–100
  lastDrinkTime: Date | null
  goalBreakdown: string[]
  addWater: (ml?: number) => void   // default 250ml
  undoLastDrink: () => void         // only if last drink < 5 min ago
  todayEntries: WaterEntry[]
}
```

### `hooks/useCatMood.ts`
```typescript
// Returns mood based on progressPercent and time since last drink
{
  mood: 'happy' | 'normal' | 'thirsty' | 'sleeping'
  minutesSinceLastDrink: number
  urgencyLevel: 1 | 2 | 3
}
// Logic:
// happy:    progressPercent >= 70
// sleeping: progressPercent < 15
// thirsty:  progressPercent < 40 OR minutesSinceLastDrink > 90
// normal:   everything else
```

### `hooks/useStreak.ts`
```typescript
{
  streak: number
  isStreakAtRisk: boolean  // < 2 hours to midnight without completing goal
  checkAndUpdateStreak: () => void  // call on app open
}
```

## Zustand Store — `stores/waterStore.ts`

```typescript
// Zustand v5: named import
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

// AsyncStorage keys: '@gatito_today', '@gatito_settings', '@gatito_history'

interface WaterStore {
  today: DayRecord
  settings: UserSettings
  history: DayRecord[]   // last 30 days
  addWater: (ml: number) => void
  undoLast: () => void
  updateSettings: (s: Partial<UserSettings>) => void
  resetDay: () => void    // called at midnight
  archiveDay: () => void  // moves today to history
}
```

## Business Rules
1. Daily reset when user opens app on a new day (compare stored date vs today)
2. Goal is calculated with `calculateDailyGoal()` using `UserSettings` factors
3. If `goalMode === 'manual'`, use `dailyGoalMl` directly — do not recalculate
4. Default fallback if weight not set: 2000ml (8 glasses)
5. Recalculate goal when weight, sex, exercise, weather, pregnancy or breastfeeding changes
6. Streak increments only if previous day reached 80% of goal
7. `undoLast` only works if last entry was < 5 minutes ago
8. Debounce AsyncStorage writes by 500ms to avoid writing on every tap
9. `exerciseMinutesToday` resets to 0 with the daily counter at midnight

## Checklist Before Delivering
- [ ] No `any` in TypeScript
- [ ] All side effects in `useEffect` with cleanup
- [ ] AsyncStorage operations wrapped in `try/catch`
- [ ] Date logic uses `date-fns`, not raw `new Date()` comparisons
- [ ] Store has a valid `initialState` exported for testing
- [ ] Zustand v5 — using `create` as named import
