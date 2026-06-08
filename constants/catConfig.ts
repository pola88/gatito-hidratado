export const CAT_EMOJIS = {
  happy: '😺',
  normal: '🐱',
  thirsty: '😿',
  sleeping: '😴',
} as const

export const CAT_TIME_THRESHOLDS = {
  happy: 30,    // minutesSinceLastDrink < 30  → happy
  normal: 60,   // minutesSinceLastDrink < 60  → normal
  thirsty: 90,  // minutesSinceLastDrink < 90  → thirsty
                // minutesSinceLastDrink >= 90 → sleeping
} as const

/** Hydration % thresholds used in widget cat emoji (CLAUDE.md spec). */
export const CAT_HYDRATION_THRESHOLDS = {
  happy: 70,
  normal: 40,
  thirsty: 15,
} as const

export const CAT_MESSAGES = {
  happy: ['Great job staying hydrated! 💪', 'You are amazing! Keep it up! 🌟'],
  normal: ['Time for a sip of water~ 💧', 'The cat reminds you: drink water!'],
  thirsty: ['MEOW! I need water NOW! 😿', 'Danger zone! Drink water immediately!'],
  sleeping: ['zzzz... wake me up when you hydrate...', 'So thirsty... barely can meow...'],
} as const
