import { useEffect } from 'react'
import { useWaterStore } from '@/stores/waterStore'
import { calculateDailyGoal } from '@/utils/waterGoal'
import { useStreak } from './useStreak'

export function useWaterTracker() {
  const store = useWaterStore()
  const { checkAndUpdateStreak } = useStreak()

  useEffect(() => {
    store.checkDayReset()
    checkAndUpdateStreak()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const todayMl = store.today.entries.reduce((sum, e) => sum + e.amount, 0)
  const todayGlasses = Math.floor(todayMl / store.settings.glassVolumeMl)
  const progressPercent = store.today.goalMl > 0
    ? Math.min(100, Math.round((todayMl / store.today.goalMl) * 100))
    : 0
  const lastEntry = store.today.entries[store.today.entries.length - 1]
  const lastDrinkTime = lastEntry ? new Date(lastEntry.timestamp) : null

  const goalBreakdown: string[] =
    store.settings.goalMode === 'auto'
      ? calculateDailyGoal({
          weightKg: store.settings.weightKg,
          sex: store.settings.sex,
          exerciseMinutes: store.settings.exerciseMinutesToday,
          isPregnant: store.settings.isPregnant,
          isBreastfeeding: store.settings.isBreastfeeding,
          hotWeather: store.settings.hotWeather,
        }).breakdown
      : [`Manual goal: ${store.settings.dailyGoalMl}ml`]

  return {
    todayGlasses,
    todayMl,
    goal: store.today.goal,
    goalMl: store.today.goalMl,
    progressPercent,
    lastDrinkTime,
    goalBreakdown,
    addWater: store.addWater,
    undoLastDrink: store.undoLast,
    todayEntries: store.today.entries,
  }
}
