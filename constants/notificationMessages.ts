export const CAT_NOTIFICATION_MESSAGES = {
  happy: [
    "Still hydrated thanks to you! Don't stop now~ 😺",
    "You're amazing! The cat is very happy today 💧",
  ],
  normal: [
    "Meow... it's almost time for a glass of water 🐱",
    "The cat reminds you: one glass of water please! 💦",
    "The cat is watching the clock... drink water! ⏰",
  ],
  thirsty: [
    "MEOW! I'm SO thirsty! DRINK WATER NOW! 😿",
    "The cat is in danger of dehydration... help! 🆘",
    "You've been away too long... the cat is crying 😭",
  ],
  reminder: [
    "Psst... did you drink water today? 🐱",
    "The cat asks: how much water have you had? 💧",
    "Time to hydrate! The cat is waiting for you~ 😺",
  ],
  streak: [
    "Don't break your streak! Drink water today 💪",
    "Keep the habit going! The cat believes in you ⭐",
  ],
  escalation1: [
    "It's been a while since your last sip... the cat is watching 🐱",
    "Psst, have you had any water lately? 💧",
    "The cat noticed some time has passed... how about a glass? 😺",
  ],
  escalation2: [
    "It's been quite a while without water! The cat is worried 😟",
    "Hey! You've gone too long without hydrating. Drink up now! 💦",
    "The cat is getting restless... you really need water! 😿",
  ],
  escalation3: [
    "THE CAT IS IN DANGER OF DEHYDRATION! DRINK WATER NOW! 🆘",
    "MAXIMUM ALERT! Way too long without water! The cat is crying! 😭",
    "HELP! The cat can't take it anymore! A GLASS OF WATER NOW! 😿💧",
  ],
} as const

export type NotificationCategory = keyof typeof CAT_NOTIFICATION_MESSAGES

export function getRandomMessage(category: NotificationCategory): string {
  const messages = CAT_NOTIFICATION_MESSAGES[category]
  return messages[Math.floor(Math.random() * messages.length)]
}
