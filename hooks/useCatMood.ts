import { useEffect, useState } from 'react'
import { CatMood } from '@/types'
import { CAT_THRESHOLDS } from '@/constants/catConfig'
import { THIRSTY_THRESHOLD_MINUTES } from '@/constants/waterConfig'
import { minutesSince } from '@/utils/dateHelpers'

export function useCatMood(progressPercent: number, lastDrinkTime: Date | null) {
  const [minutesSinceLastDrink, setMinutesSinceLastDrink] = useState(0)

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
  if (progressPercent < CAT_THRESHOLDS.sleeping) {
    mood = 'sleeping'
  } else if (
    progressPercent < CAT_THRESHOLDS.thirsty ||
    minutesSinceLastDrink > THIRSTY_THRESHOLD_MINUTES
  ) {
    mood = 'thirsty'
  } else if (progressPercent >= CAT_THRESHOLDS.happy) {
    mood = 'happy'
  } else {
    mood = 'normal'
  }

  const urgencyLevel: 1 | 2 | 3 =
    mood === 'sleeping' ? 3 : mood === 'thirsty' ? 2 : 1

  return { mood, minutesSinceLastDrink, urgencyLevel }
}
