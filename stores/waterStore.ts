import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import { requestWidgetUpdate } from 'react-native-android-widget'
import React from 'react'
import { DayRecord, UserSettings, WaterEntry } from '@/types'
import { getTodayString } from '@/utils/dateHelpers'
import { DEFAULT_DAILY_GOAL_ML, DEFAULT_GLASS_ML, MAX_HISTORY_DAYS, UNDO_WINDOW_MS } from '@/constants/waterConfig'
import { calculateDailyGoal } from '@/utils/waterGoal'
import { calcTotalMl, calcGlasses, calcProgressPercent } from '@/utils/hydrationCalc'
import { WaterWidget } from '@/widgets/WaterWidget'

const DEFAULT_SETTINGS: UserSettings = {
  name: '',
  weightKg: 70,
  sex: 'other',
  glassVolumeMl: DEFAULT_GLASS_ML,
  wakeUpTime: '07:00',
  bedTime: '22:00',
  reminderIntervalMin: 60,
  streakCount: 0,
  lastActiveDate: '',
  streakBrokenFrom: 0,
  streakBrokenAt: '',
  goalMode: 'auto',
  dailyGoalMl: DEFAULT_DAILY_GOAL_ML,
  exerciseMinutesToday: 0,
  isPregnant: false,
  isBreastfeeding: false,
  hotWeather: false,
  notificationsEnabled: false,
  hasCompletedOnboarding: false,
}

function createEmptyDay(settings: UserSettings): DayRecord {
  if (settings.goalMode === 'auto') {
    const goalResult = calculateDailyGoal({
      weightKg: settings.weightKg,
      sex: settings.sex,
      exerciseMinutes: settings.exerciseMinutesToday,
      isPregnant: settings.isPregnant,
      isBreastfeeding: settings.isBreastfeeding,
      hotWeather: settings.hotWeather,
      glassVolumeMl: settings.glassVolumeMl,
    })
    return {
      date: getTodayString(),
      entries: [],
      goal: goalResult.totalGlasses,
      goalMl: goalResult.totalMl,
    }
  }

  return {
    date: getTodayString(),
    entries: [],
    goal: Math.ceil(settings.dailyGoalMl / settings.glassVolumeMl),
    goalMl: settings.dailyGoalMl,
  }
}

interface WaterStore {
  today: DayRecord
  settings: UserSettings
  history: DayRecord[]
  addWater: (ml?: number) => void
  undoLast: () => void
  removeLast: () => void
  updateSettings: (s: Partial<UserSettings>) => void
  resetDay: () => void
  archiveDay: () => void
  checkDayReset: () => void
}

function pushWidgetUpdate(today: DayRecord, glassVolumeMl: number): void {
  const totalMl = calcTotalMl(today.entries)
  const glasses = calcGlasses(totalMl, glassVolumeMl)
  const progressPercent = calcProgressPercent(totalMl, today.goalMl)
  requestWidgetUpdate({
    widgetName: 'WaterWidget',
    renderWidget: () => React.createElement(WaterWidget, {
      glasses,
      goal: today.goal,
      progressPercent,
      canUndo: today.entries.length > 0,
    }),
  }).catch(() => {})
}

export const useWaterStore = create<WaterStore>()(
  persist(
    (set, get) => ({
      today: createEmptyDay(DEFAULT_SETTINGS),
      settings: DEFAULT_SETTINGS,
      history: [],

      addWater: (ml) => {
        const { settings } = get()
        const amount = ml ?? settings.glassVolumeMl
        const entry: WaterEntry = {
          id: Math.random().toString(36).slice(2),
          timestamp: Date.now(),
          amount,
        }
        set(state => ({
          today: { ...state.today, entries: [...state.today.entries, entry] },
        }))
        if (Platform.OS === 'android') {
          pushWidgetUpdate(get().today, get().settings.glassVolumeMl)
        }
      },

      undoLast: () => {
        const { today } = get()
        if (today.entries.length === 0) return
        const last = today.entries[today.entries.length - 1]
        if (Date.now() - last.timestamp > UNDO_WINDOW_MS) return
        set(state => ({
          today: { ...state.today, entries: state.today.entries.slice(0, -1) },
        }))
        if (Platform.OS === 'android') {
          pushWidgetUpdate(get().today, get().settings.glassVolumeMl)
        }
      },

      removeLast: () => {
        set(state => {
          if (state.today.entries.length === 0) return state
          return { today: { ...state.today, entries: state.today.entries.slice(0, -1) } }
        })
        if (Platform.OS === 'android') {
          pushWidgetUpdate(get().today, get().settings.glassVolumeMl)
        }
      },

      updateSettings: (s) => {
        set(state => {
          const newSettings = { ...state.settings, ...s }
          const goalFields: (keyof UserSettings)[] = [
            'glassVolumeMl', 'weightKg', 'sex', 'goalMode', 'dailyGoalMl',
            'exerciseMinutesToday', 'isPregnant', 'isBreastfeeding', 'hotWeather',
          ]
          if (!goalFields.some(f => f in s)) return { settings: newSettings }
          const { goal, goalMl } = createEmptyDay(newSettings)
          return { settings: newSettings, today: { ...state.today, goal, goalMl } }
        })
      },

      archiveDay: () => {
        const { today, history } = get()
        const newHistory = [today, ...history].slice(0, MAX_HISTORY_DAYS)
        set({ history: newHistory })
      },

      resetDay: () => {
        const { settings } = get()
        const freshDay = createEmptyDay(settings)
        set({
          today: freshDay,
          settings: { ...settings, exerciseMinutesToday: 0 },
        })
      },

      checkDayReset: () => {
        const { today } = get()
        if (today.date !== getTodayString()) {
          get().archiveDay()
          get().resetDay()
        }
      },
    }),
    {
      name: '@gatito_store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

export const initialState = {
  today: createEmptyDay(DEFAULT_SETTINGS),
  settings: DEFAULT_SETTINGS,
  history: [] as DayRecord[],
}
