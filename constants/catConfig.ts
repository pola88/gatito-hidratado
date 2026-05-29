export const CAT_EMOJIS = {
  happy: '😺',
  normal: '🐱',
  thirsty: '😿',
  sleeping: '😴',
} as const

export const CAT_THRESHOLDS = {
  happy: 70,    // progressPercent >= 70
  thirsty: 40,  // progressPercent < 40
  sleeping: 15, // progressPercent < 15
} as const

export const CAT_MESSAGES = {
  happy: ['Great job staying hydrated! 💪', 'You are amazing! Keep it up! 🌟'],
  normal: ['Time for a sip of water~ 💧', 'The cat reminds you: drink water!'],
  thirsty: ['MEOW! I need water NOW! 😿', 'Danger zone! Drink water immediately!'],
  sleeping: ['zzzz... wake me up when you hydrate...', 'So thirsty... barely can meow...'],
} as const
