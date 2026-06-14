import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { UserSettings } from '@/types'
import { getRandomMessage } from '@/constants/notificationMessages'
import { scheduleEscalatingReminders } from '@/utils/notificationScheduler'

export { scheduleEscalatingReminders }

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
   * Reschedules reminders only if the pending queue is empty (chain exhausted).
   * Call on app startup so a depleted chain is recovered when the user opens the app.
   */
  async function rescheduleIfNeeded(
    settings: UserSettings,
    lastDrinkTime: Date | null,
  ): Promise<void> {
    if (!settings.notificationsEnabled) return
    const pending = await Notifications.getAllScheduledNotificationsAsync()
    if (pending.length === 0) {
      await scheduleEscalatingReminders(settings, lastDrinkTime)
    }
  }

  /** @deprecated Use scheduleEscalatingReminders instead. */
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
    rescheduleIfNeeded,
    /** @deprecated Use scheduleEscalatingReminders */
    scheduleFromLastDrink,
    sendTestNotification,
  }
}
