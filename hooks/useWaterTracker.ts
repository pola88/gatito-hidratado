import { useCallback, useEffect } from 'react'
import { useWaterStore } from '@/stores/waterStore'
import { calculateDailyGoal } from '@/utils/waterGoal'
import { useStreak } from './useStreak'
import { useNotifications } from './useNotifications'

export function useWaterTracker() {
  const store = useWaterStore()
  const { checkAndUpdateStreak } = useStreak()
  const { scheduleEscalatingReminders } = useNotifications()

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

  /**
   * Log a drink and immediately reschedule the escalating reminder chain
   * anchored to now (the drink just happened).
   */
  const addWater = useCallback(
    (ml?: number) => {
      store.addWater(ml)
      // The drink timestamp is "now"; schedule from this moment.
      scheduleEscalatingReminders(store.settings, new Date())
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.addWater, store.settings, scheduleEscalatingReminders],
  )

  return {
    todayGlasses,
    todayMl,
    goal: store.today.goal,
    goalMl: store.today.goalMl,
    progressPercent,
    lastDrinkTime,
    goalBreakdown,
    addWater,
    undoLastDrink: store.undoLast,
    removeDrink: store.removeLast,
    todayEntries: store.today.entries,
  }
}
