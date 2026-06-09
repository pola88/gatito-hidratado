import { isYesterday, parseISO } from 'date-fns'
import { useWaterStore } from '@/stores/waterStore'
import { getTodayString } from '@/utils/dateHelpers'
import { STREAK_COMPLETION_THRESHOLD } from '@/constants/waterConfig'
import { calcTotalMl } from '@/utils/hydrationCalc'

export function useStreak() {
  const { settings, today, history, updateSettings } = useWaterStore()

  const todayMl = calcTotalMl(today.entries)
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

    const yesterdayMl = calcTotalMl(yesterday.entries)
    const completed = yesterdayMl >= yesterday.goalMl * STREAK_COMPLETION_THRESHOLD

    if (completed && settings.lastActiveDate !== getTodayString()) {
      updateSettings({
        streakCount: settings.streakCount + 1,
        lastActiveDate: getTodayString(),
      })
    } else if (!completed && settings.streakCount > 0) {
      updateSettings({
        streakBrokenFrom: settings.streakCount,
        streakBrokenAt: getTodayString(),
        streakCount: 0,
      })
    }
  }

  const todayStr = getTodayString()
  const streakJustBroke = settings.streakBrokenAt === todayStr && settings.streakBrokenFrom > 0

  return {
    streak: settings.streakCount,
    isStreakAtRisk,
    checkAndUpdateStreak,
    streakJustBroke,
    streakBrokenFrom: settings.streakBrokenFrom,
  }
}
