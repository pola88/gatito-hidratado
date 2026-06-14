import AsyncStorage from '@react-native-async-storage/async-storage'
import { registerWidgetTaskHandler } from 'react-native-android-widget'
import React from 'react'
import { WaterWidget } from './WaterWidget'
import { getTodayString } from '@/utils/dateHelpers'
import { calcTotalMl, calcGlasses, calcProgressPercent } from '@/utils/hydrationCalc'
import { scheduleEscalatingReminders } from '@/utils/notificationScheduler'

const STORAGE_KEY = '@gatito_store'

interface PersistedEntry {
  id: string
  timestamp: number
  amount: number
}

interface PersistedState {
  state: {
    today: { date: string; entries: PersistedEntry[]; goal: number; goalMl: number }
    settings: {
      glassVolumeMl: number
      notificationsEnabled: boolean
      reminderIntervalMin: number
      wakeUpTime: string
      bedTime: string
    }
  }
}

interface WaterState {
  glasses: number
  goal: number
  progressPercent: number
  glassVolumeMl: number
  canUndo: boolean
  notificationsEnabled: boolean
  reminderIntervalMin: number
  wakeUpTime: string
  bedTime: string
}

async function readWaterState(): Promise<WaterState> {
  const defaults: WaterState = {
    glasses: 0, goal: 8, progressPercent: 0, glassVolumeMl: 250, canUndo: false,
    notificationsEnabled: false, reminderIntervalMin: 60, wakeUpTime: '07:00', bedTime: '22:00',
  }
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    const { state }: PersistedState = JSON.parse(raw)
    const glassVolumeMl = state.settings?.glassVolumeMl ?? 250
    const entries = state.today.date === getTodayString() ? state.today.entries : []
    const goalMl = state.today.goalMl ?? 2000
    const totalMl = calcTotalMl(entries)
    return {
      glasses: calcGlasses(totalMl, glassVolumeMl),
      goal: state.today.goal ?? 8,
      progressPercent: calcProgressPercent(totalMl, goalMl),
      glassVolumeMl,
      canUndo: entries.length > 0,
      notificationsEnabled: state.settings?.notificationsEnabled ?? false,
      reminderIntervalMin: state.settings?.reminderIntervalMin ?? 60,
      wakeUpTime: state.settings?.wakeUpTime ?? '07:00',
      bedTime: state.settings?.bedTime ?? '22:00',
    }
  } catch {
    return defaults
  }
}

async function addWaterToStorage(glassVolumeMl: number): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const persisted: PersistedState = JSON.parse(raw)
    const todayStr = getTodayString()
    if (persisted.state.today.date !== todayStr) {
      persisted.state.today = { ...persisted.state.today, date: todayStr, entries: [] }
    }
    persisted.state.today.entries = [
      ...persisted.state.today.entries,
      { id: Math.random().toString(36).slice(2), timestamp: Date.now(), amount: glassVolumeMl },
    ]
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
  } catch {
    // widget shows stale data but won't crash
  }
}

async function removeLastWaterFromStorage(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const persisted: PersistedState = JSON.parse(raw)
    if (persisted.state.today.date !== getTodayString()) return
    if (persisted.state.today.entries.length === 0) return
    persisted.state.today.entries = persisted.state.today.entries.slice(0, -1)
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
  } catch {
    // widget shows stale data but won't crash
  }
}

registerWidgetTaskHandler(async ({ widgetAction, clickAction, renderWidget }) => {
  if (widgetAction === 'WIDGET_DELETED') return

  if (widgetAction === 'WIDGET_CLICK') {
    if (clickAction === 'ADD_WATER') {
      const { glassVolumeMl, notificationsEnabled, reminderIntervalMin, wakeUpTime, bedTime } = await readWaterState()
      await addWaterToStorage(glassVolumeMl)
      await scheduleEscalatingReminders(
        { notificationsEnabled, reminderIntervalMin, wakeUpTime, bedTime },
        new Date(),
      )
    } else if (clickAction === 'REMOVE_WATER') {
      await removeLastWaterFromStorage()
    }
  }

  const { glasses, goal, progressPercent, canUndo } = await readWaterState()
  renderWidget(React.createElement(WaterWidget, { glasses, goal, progressPercent, canUndo }))
})
