import '../global.css'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

export { ErrorBoundary } from 'expo-router'

export const unstable_settings = {
  initialRouteName: '(tabs)',
}

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0d1b2a' },
        }}
      />
      <StatusBar style="light" />
    </>
  )
}
