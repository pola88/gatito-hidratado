import { isYesterday, parseISO } from 'date-fns'
import { useWaterStore } from '@/stores/waterStore'
import { getTodayString } from '@/utils/dateHelpers'
import { STREAK_COMPLETION_THRESHOLD } from '@/constants/waterConfig'

export function useStreak() {
  const { settings, today, history, updateSettings } = useWaterStore()

  const todayMl = today.entries.reduce((sum, e) => sum + e.amount, 0)
  const remainingMl = today.goalMl - todayMl
  const midnight = new Date()
  midnight.setHours(24, 0, 0, 0)
  const hoursToMidnight = (midnight.getTime() - Date.now()) / 3_600_000
  const isStreakAtRisk = remainingMl > 0 && hoursToMidnight < 2

  function checkAndUpdateStreak() {
    const yesterday = history[0]
    if (!yesterday) return

    const wasYesterday = isYesterday(parseISO(yesterday.date))
    if (!wasYesterday) return

    const yesterdayMl = yesterday.entries.reduce((sum, e) => sum + e.amount, 0)
    const completed = yesterdayMl >= yesterday.goalMl * STREAK_COMPLETION_THRESHOLD

    if (completed && settings.lastActiveDate !== getTodayString()) {
      updateSettings({
        streakCount: settings.streakCount + 1,
        lastActiveDate: getTodayString(),
      })
    } else if (!completed) {
      updateSettings({ streakCount: 0 })
    }
  }

  return {
    streak: settings.streakCount,
    isStreakAtRisk,
    checkAndUpdateStreak,
  }
}
