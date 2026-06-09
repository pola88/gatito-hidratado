export interface WaterEntry {
  id: string
  timestamp: number
  amount: number // ml
}

export interface DayRecord {
  date: string // 'YYYY-MM-DD'
  entries: WaterEntry[]
  goal: number // glasses
  goalMl: number // ml
}

export interface UserSettings {
  name: string
  weightKg: number
  sex: 'male' | 'female' | 'other'
  glassVolumeMl: number
  wakeUpTime: string // 'HH:mm'
  bedTime: string // 'HH:mm'
  reminderIntervalMin: number
  streakCount: number
  lastActiveDate: string    // 'YYYY-MM-DD'
  streakBrokenFrom: number  // days lost when streak broke, 0 if never broke
  streakBrokenAt: string    // 'YYYY-MM-DD' of the day it broke, '' if never
  goalMode: 'auto' | 'manual'
  dailyGoalMl: number
  exerciseMinutesToday: number
  isPregnant: boolean
  isBreastfeeding: boolean
  hotWeather: boolean
  notificationsEnabled: boolean
  hasCompletedOnboarding: boolean
}

export type CatMood = 'happy' | 'normal' | 'thirsty' | 'sleeping'
