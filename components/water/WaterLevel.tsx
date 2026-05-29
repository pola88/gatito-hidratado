import React, { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated'

export interface WaterLevelProps {
  progressPercent: number
  goalMl: number
  currentMl: number
}

const BAR_MAX_WIDTH = 260

function getBarColor(percent: number): string {
  if (percent >= 70) return '#4ade80'
  if (percent >= 40) return '#FB923C'
  return '#EF4444'
}

export function WaterLevel({ progressPercent, goalMl, currentMl }: WaterLevelProps) {
  const widthProgress = useSharedValue(0)

  useEffect(() => {
    const clamped = Math.min(Math.max(progressPercent, 0), 100)
    widthProgress.value = withTiming(clamped / 100, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    })
  }, [progressPercent, widthProgress])

  const color = getBarColor(progressPercent)

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: widthProgress.value * BAR_MAX_WIDTH,
    backgroundColor: color,
  }))

  return (
    <View style={styles.container}>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, animatedBarStyle]} />
      </View>
      <Text style={styles.label}>
        {currentMl}ml / {goalMl}ml
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  barTrack: {
    width: BAR_MAX_WIDTH,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 10,
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
})

export default WaterLevel
