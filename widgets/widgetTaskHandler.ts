import AsyncStorage from '@react-native-async-storage/async-storage'
import { registerWidgetTaskHandler } from 'react-native-android-widget'
import React from 'react'
import { WaterWidget } from './WaterWidget'

const STORAGE_KEY = '@gatito_store'

interface PersistedEntry {
  id: string
  timestamp: number
  amount: number
}

interface PersistedState {
  state: {
    today: { date: string; entries: PersistedEntry[]; goal: number; goalMl: number }
    settings: { glassVolumeMl: number }
  }
}

function getTodayString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

async function readWaterState(): Promise<{ glasses: number; goal: number; glassVolumeMl: number; canUndo: boolean }> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return { glasses: 0, goal: 8, glassVolumeMl: 250, canUndo: false }
    const { state }: PersistedState = JSON.parse(raw)
    const glassVolumeMl = state.settings?.glassVolumeMl ?? 250
    const entries = state.today.date === getTodayString() ? state.today.entries : []
    const totalMl = entries.reduce((sum, e) => sum + e.amount, 0)
    return {
      glasses: Math.floor(totalMl / glassVolumeMl),
      goal: state.today.goal ?? 8,
      glassVolumeMl,
      canUndo: entries.length > 0,
    }
  } catch {
    return { glasses: 0, goal: 8, glassVolumeMl: 250, canUndo: false }
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
      const { glassVolumeMl } = await readWaterState()
      await addWaterToStorage(glassVolumeMl)
    } else if (clickAction === 'REMOVE_WATER') {
      await removeLastWaterFromStorage()
    }
  }

  const { glasses, goal, canUndo } = await readWaterState()
  renderWidget(React.createElement(WaterWidget, { glasses, goal, canUndo }))
})
