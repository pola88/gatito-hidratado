import { useEffect, useState } from 'react'
import { CatMood } from '@/types'
import { CAT_TIME_THRESHOLDS } from '@/constants/catConfig'
import { minutesSince } from '@/utils/dateHelpers'

export function useCatMood(lastDrinkTime: Date | null) {
  const [minutesSinceLastDrink, setMinutesSinceLastDrink] = useState(
    lastDrinkTime ? minutesSince(lastDrinkTime.getTime()) : 999
  )

  useEffect(() => {
    const update = () => {
      setMinutesSinceLastDrink(
        lastDrinkTime ? minutesSince(lastDrinkTime.getTime()) : 999
      )
    }
    update()
    const interval = setInterval(update, 60_000)
    return () => clearInterval(interval)
  }, [lastDrinkTime])

  let mood: CatMood
  if (minutesSinceLastDrink < CAT_TIME_THRESHOLDS.happy) {
    mood = 'happy'
  } else if (minutesSinceLastDrink < CAT_TIME_THRESHOLDS.normal) {
    mood = 'normal'
  } else if (minutesSinceLastDrink < CAT_TIME_THRESHOLDS.thirsty) {
    mood = 'thirsty'
  } else {
    mood = 'sleeping'
  }

  const urgencyLevel: 1 | 2 | 3 =
    mood === 'sleeping' ? 3 : mood === 'thirsty' ? 2 : 1

  return { mood, minutesSinceLastDrink, urgencyLevel }
}
