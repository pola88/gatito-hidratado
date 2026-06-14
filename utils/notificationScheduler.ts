import * as Notifications from 'expo-notifications'
import { getRandomMessage, NotificationCategory } from '@/constants/notificationMessages'

interface EscalationStep {
  delayFactor: number
  category: NotificationCategory
}

const ESCALATION_STEPS: EscalationStep[] = [
  { delayFactor: 1.0,  category: 'escalation1' },
  { delayFactor: 0.75, category: 'escalation2' },
  { delayFactor: 0.5,  category: 'escalation3' },
]

function parseTime(hhmm: string): { hours: number; minutes: number } {
  const [hours, minutes] = hhmm.split(':').map(Number)
  return { hours, minutes }
}

function buildTime(base: Date, { hours, minutes }: { hours: number; minutes: number }, dayOffset: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hours, minutes, 0, 0)
  return d
}

function shiftIntoWindow(
  candidate: Date,
  now: Date,
  wakeTime: { hours: number; minutes: number },
  bedTime: { hours: number; minutes: number },
  maxDayOffset: number,
): Date | null {
  for (let offset = 0; offset <= maxDayOffset; offset++) {
    const wake = buildTime(now, wakeTime, offset)
    const bed  = buildTime(now, bedTime,  offset)

    if (candidate >= wake && candidate <= bed && candidate > now) return candidate
    if (candidate < wake && wake > now) return wake
  }
  return null
}

export interface NotificationSettings {
  notificationsEnabled: boolean
  reminderIntervalMin: number
  wakeUpTime: string
  bedTime: string
}

/**
 * Cancels all pending reminders and schedules a fresh 3-step escalation chain
 * anchored to `lastDrinkTime` (or now if null).
 * Returns the number of notifications scheduled.
 */
export async function scheduleEscalatingReminders(
  settings: NotificationSettings,
  lastDrinkTime: Date | null,
): Promise<number> {
  await Notifications.cancelAllScheduledNotificationsAsync()
  if (!settings.notificationsEnabled) return 0

  const now = new Date()
  const anchor = lastDrinkTime ?? now
  const baseMs = settings.reminderIntervalMin * 60_000
  const wakeTime = parseTime(settings.wakeUpTime)
  const bedTime  = parseTime(settings.bedTime)

  let scheduledCount = 0
  let previousTime = anchor

  for (const step of ESCALATION_STEPS) {
    const delayMs = Math.round(baseMs * step.delayFactor)
    const candidate = new Date(previousTime.getTime() + delayMs)
    const scheduled = shiftIntoWindow(candidate, now, wakeTime, bedTime, 2)
    if (scheduled === null) continue

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Gatito Hidratado 💧',
        body: getRandomMessage(step.category),
        sound: 'default',
        data: { type: 'water-reminder', escalationLevel: scheduledCount + 1 },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduled,
      },
    })

    previousTime = scheduled
    scheduledCount++
  }

  return scheduledCount
}
