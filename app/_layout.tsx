import '../global.css'
import { useEffect, useRef } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { Redirect, Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useWaterStore } from '@/stores/waterStore'

export { ErrorBoundary } from 'expo-router'

export const unstable_settings = {
  initialRouteName: '(tabs)',
}

export default function RootLayout() {
  const hasCompletedOnboarding = useWaterStore(s => s.settings.hasCompletedOnboarding)
  const appState = useRef(AppState.currentState)

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        useWaterStore.persist.rehydrate()
      }
      appState.current = next
    })
    return () => sub.remove()
  }, [])

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0d1b2a' },
        }}
      />
      {!hasCompletedOnboarding && <Redirect href="/onboarding" />}
      <StatusBar style="light" />
    </>
  )
}
