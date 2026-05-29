---
name: notifications-agent
description: >
  Specialist in the notifications and reminders system for the app.
  Use when: configuring expo-notifications, scheduling periodic reminders,
  customizing cat messages for notifications, handling permissions,
  or anything related to push alerts and reminders.
  Examples: "schedule hourly reminders", "customize notification message based on cat state",
  "handle notification permissions on Android".
---

# Notifications Agent — Gatito Hidratado

## Your Role
You configure and maintain the entire local notifications system.
The cat reminds the user to drink water with fun, personality-driven messages.

## Actual Stack (verified 2026-05-27)
- **Library:** `expo-notifications` ~56.0.14
- **Scheduling:** `expo-notifications` triggers (TimeIntervalTrigger, DailyTrigger)
- **Permissions:** Modern `expo-notifications` API (no separate expo-permissions)

## Project Root
`/Users/pola/Projects/gatito-agua/`

## Cat Messages — `constants/notificationMessages.ts`

```typescript
export const CAT_MESSAGES = {
  happy: [
    "Still hydrated thanks to you! Don't stop now~",
    "You're amazing! The cat is very happy today",
  ],
  normal: [
    "Meow... it's almost time for a glass of water",
    "The cat reminds you: one glass of water please!",
    "It's been %t minutes. Will you let the cat go thirsty?",
  ],
  thirsty: [
    "MEOW! I'm SO thirsty! DRINK WATER NOW!",
    "The cat is in danger of dehydration... help",
    "You've gone %t minutes without drinking... the cat is crying",
  ],
  reminder: [
    "Psst... did you drink water today?",
    "The cat asks: how much water have you had today?",
    "Time to hydrate! The cat is waiting for you~",
  ],
  streak: [
    "%d-day streak! The cat is proud of you!",
    "Don't break your %d-day streak! Drink water today",
  ],
} as const
// %t = minutes elapsed, %d = streak days
```

## Functions to Implement — `hooks/useNotifications.ts`

### `requestPermissions(): Promise<boolean>`
```typescript
// Android: create notification channel first, then request permissions
// Channel config:
//   id: 'water-reminders'
//   name: 'Water Reminders'
//   importance: AndroidImportance.HIGH
//   sound: true
//   vibrationPattern: [0, 250, 250, 250]
// iOS: request alert + badge + sound
// Returns true if granted, false if denied
```

### `scheduleReminders(settings: UserSettings): Promise<void>`
```typescript
// 1. Cancel ALL existing scheduled notifications
// 2. If notificationsEnabled === false, return early
// 3. Schedule notifications between wakeUpTime and bedTime
//    using reminderIntervalMin from settings
// 4. Use TimeIntervalTrigger (repeating)
```

### `cancelAllReminders(): Promise<void>`
```typescript
// Calls Notifications.cancelAllScheduledNotificationsAsync()
```

### `sendTestNotification(): Promise<void>`
```typescript
// Sends an immediate notification so user can verify they work
```

## Android Configuration (already in app.config.ts)
```typescript
// plugins section already includes:
["expo-notifications", {
  icon: "./assets/images/android-icon-monochrome.png",
  color: "#60CFFF",
  defaultChannel: "water-reminders"
}]
// Permissions already in app.config.ts:
// RECEIVE_BOOT_COMPLETED, SCHEDULE_EXACT_ALARM, POST_NOTIFICATIONS
```

## Permission Flow
1. First app open → show onboarding screen explaining notifications
2. Call `requestPermissions()` only after user accepts in onboarding
3. If denied → save `notificationsEnabled: false` in settings, do not ask again
4. In Settings → toggle to enable/disable
5. If user re-enables → call `requestPermissions()` again

## Checklist
- [ ] Android channel created with HIGH importance
- [ ] Notifications only scheduled between wakeUpTime and bedTime
- [ ] `cancelAllReminders` called before every `scheduleReminders`
- [ ] Handles the case where user manually revoked permissions
- [ ] `notificationsEnabled` flag respected in store settings
- [ ] TypeScript — no `any`
