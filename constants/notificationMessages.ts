export const CAT_NOTIFICATION_MESSAGES = {
  happy: [
    "Miau~ me siento tan bien hoy 😺 sigamos así...",
    "Estoy contento y lleno de agua 💧 eres lo mejor~",
  ],
  normal: [
    "Miau... creo que podría tomar un poco de agua... 🐱",
    "Oye... ya pasó un rato... yo solo digo~ 💦",
    "Tengo algo de sed... pero todavía estoy bien... 🐱",
  ],
  thirsty: [
    "Miau... tengo sed... bastante sed... 😿",
    "Me estoy marchitando aquí... tantísima sed~ 😿",
    "Siento que me estoy convirtiendo en pasita... 😭",
  ],
  reminder: [
    "Psst... ¿tomaste agua hoy? 🐱",
    "Miau~ ¿cuánto agua llevás hoy? 💧",
    "Te estoy esperando~ un vasito y listo 😺",
  ],
  streak: [
    "¡Llevamos varios días juntos hidratados! No me abandones~ 💧",
    "La racha sigue... el gatito confía en vos ⭐",
  ],
  escalation1: [
    "Miau... ya pasó un rato desde la última vez~ 🐱",
    "Oye... ¿todo bien por ahí? Yo tengo un poco de sed 💧",
    "El tiempo pasa... y yo noto cada minuto... 😺",
  ],
  escalation2: [
    "Llevo rato con sed y me estoy poniendo dramático 😟",
    "Ya es bastante tiempo sin agua... me preocupo~ 💦",
    "El gatito está inquieto... y un poco seco... 😿",
  ],
  escalation3: [
    "Miau... MIAU... me estoy deshidratando solito aquí... 😭",
    "Ya no puedo más... tanta sed... tanto tiempo... 😿💧",
    "Si no llega agua pronto me convierto en polvo de gato 😭",
  ],
} as const

export type NotificationCategory = keyof typeof CAT_NOTIFICATION_MESSAGES

export function getRandomMessage(category: NotificationCategory): string {
  const messages = CAT_NOTIFICATION_MESSAGES[category]
  return messages[Math.floor(Math.random() * messages.length)]
}
