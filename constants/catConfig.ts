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
  happy: ['¡Estoy súper hidratado! 💦', '¡Miau~ me siento tan bien hoy! 😺'],
  normal: ['Podría tomar un poco más de agua...', 'Miau... creo que tengo algo de sed~ 💧'],
  thirsty: ['Miau... tengo tantísima sed... me estoy marchitando 😿', 'Siento que me estoy convirtiendo en pasita... 😭'],
  sleeping: ['zzz... tan seco... tan cansado... zzz...', 'zzz... agua... por favor... zzz...'],
} as const
