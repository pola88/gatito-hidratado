import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { UserSettings } from '@/types'
import { getRandomMessage, NotificationCategory } from '@/constants/notificationMessages'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

/**
 * Escalation steps relative to the last drink.
 * Each step defines:
 *   - delayFactor: multiplier applied to reminderIntervalMin to get the delay
 *     from the *previous* event (last drink for step 0, previous step for the rest)
 *   - category: which message pool to draw from
 */
interface EscalationStep {
  delayFactor: number
  category: NotificationCategory
}

const ESCALATION_STEPS: EscalationStep[] = [
  { delayFactor: 1.0,  category: 'escalation1' }, // base interval  → gentle
  { delayFactor: 0.75, category: 'escalation2' }, // 75 % of base   → medium
  { delayFactor: 0.5,  category: 'escalation3' }, // 50 % of base   → urgent
]

/** Parse 'HH:mm' into { hours, minutes }. */
function parseTime(hhmm: string): { hours: number; minutes: number } {
  const [hours, minutes] = hhmm.split(':').map(Number)
  return { hours, minutes }
}

/** Build a Date for the given day offset with the specified HH:mm. */
function buildTime(base: Date, { hours, minutes }: { hours: number; minutes: number }, dayOffset: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hours, minutes, 0, 0)
  return d
}

/**
 * Given a candidate Date, return the earliest Date >= candidate that falls
 * within the daily wake/bed window.  If candidate is already inside the
 * window, it is returned unchanged.  If it is after bedTime, it is pushed
 * to wakeUpTime of the next day (up to maxDayOffset days ahead).
 *
 * Returns null if no valid slot is found within maxDayOffset days.
 */
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

    // Candidate falls within this day's window
    if (candidate >= wake && candidate <= bed && candidate > now) {
      return candidate
    }

    // Candidate is before this day's wake time — snap to wake
    if (candidate < wake && wake > now) {
      return wake
    }

    // Candidate is after this day's bed time — try next day
  }
  return null
}

export function useNotifications() {
  async function requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('water-reminders', {
        name: 'Water Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#60CFFF',
      })
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    if (existingStatus === 'granted') return true

    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    })
    return status === 'granted'
  }

  async function cancelAllReminders(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync()
  }

  /**
   * Schedules an escalating chain of reminders starting from `lastDrinkTime`.
   * If `lastDrinkTime` is null, `now` is used as the anchor.
   *
   * Each step fires `reminderIntervalMin * delayFactor` minutes after the
   * previous event.  Times outside the wake/bed window are shifted forward
   * to the next window (up to 2 days ahead).
   *
   * Returns the number of notifications actually scheduled.
   */
  async function scheduleEscalatingReminders(
    settings: UserSettings,
    lastDrinkTime: Date | null,
  ): Promise<number> {
    await cancelAllReminders()
    if (!settings.notificationsEnabled) return 0

    const now = new Date()
    const anchor = lastDrinkTime ?? now
    const baseMs = settings.reminderIntervalMin * 60_000

    const wakeTime = parseTime(settings.wakeUpTime)
    const bedTime  = parseTime(settings.bedTime)

    let scheduledCount = 0
    // cursor tracks the absolute time of the "previous event" so we can add
    // each step's delay on top of the last scheduled time (not on top of anchor).
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

  /**
   * @deprecated Use `scheduleEscalatingReminders` instead.
   * Kept as a thin alias so any call-sites not yet migrated keep compiling.
   */
  async function scheduleFromLastDrink(
    settings: UserSettings,
    lastDrinkTime: Date | null,
  ): Promise<void> {
    await scheduleEscalatingReminders(settings, lastDrinkTime)
  }

  async function sendTestNotification(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Gatito Hidratado 💧',
        body: getRandomMessage('reminder'),
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 3,
      },
    })
  }

  return {
    requestPermissions,
    cancelAllReminders,
    scheduleEscalatingReminders,
    /** @deprecated Use scheduleEscalatingReminders */
    scheduleFromLastDrink,
    sendTestNotification,
  }
}
