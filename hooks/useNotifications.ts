import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { UserSettings } from '@/types'
import { getRandomMessage } from '@/constants/notificationMessages'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

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
   * Schedules reminders starting from `lastDrinkTime + interval`.
   * If lastDrinkTime is null, the first reminder fires `interval` minutes from now.
   * Only schedules within the active window (wakeUpTime–bedTime), today and tomorrow.
   */
  async function scheduleFromLastDrink(
    settings: UserSettings,
    lastDrinkTime: Date | null,
  ): Promise<void> {
    await cancelAllReminders()
    if (!settings.notificationsEnabled) return

    const now = new Date()
    const intervalMs = settings.reminderIntervalMin * 60_000

    const [wakeH, wakeM] = settings.wakeUpTime.split(':').map(Number)
    const [bedH, bedM] = settings.bedTime.split(':').map(Number)

    const times: Date[] = []

    for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
      const base = new Date(now)
      base.setDate(base.getDate() + dayOffset)

      const wake = new Date(base)
      wake.setHours(wakeH, wakeM, 0, 0)

      const bed = new Date(base)
      bed.setHours(bedH, bedM, 0, 0)

      // First reminder: lastDrink + interval (day 0), or wake time (day 1)
      const startFrom = dayOffset === 0
        ? new Date((lastDrinkTime ?? now).getTime() + intervalMs)
        : new Date(wake)

      let cursor = new Date(startFrom)

      // Snap cursor forward to the active window if it starts before wake
      if (cursor < wake) cursor = new Date(wake)

      while (cursor <= bed && times.length < 25) {
        if (cursor > now) times.push(new Date(cursor))
        cursor = new Date(cursor.getTime() + intervalMs)
      }
    }

    for (const time of times.slice(0, 25)) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Gatito Hidratado 💧',
          body: getRandomMessage('reminder'),
          sound: 'default',
          data: { type: 'water-reminder' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: time,
        },
      })
    }
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
    scheduleFromLastDrink,
    sendTestNotification,
  }
}
