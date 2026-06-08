import '../global.css'
import { Redirect, Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useWaterStore } from '@/stores/waterStore'

export { ErrorBoundary } from 'expo-router'

export const unstable_settings = {
  initialRouteName: '(tabs)',
}

export default function RootLayout() {
  const hasCompletedOnboarding = useWaterStore(s => s.settings.hasCompletedOnboarding)

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
