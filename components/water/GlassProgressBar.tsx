import React, { useEffect, useRef } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

export interface GlassProgressBarProps {
  totalGlasses: number
  completedGlasses: number
  todayMl: number
  goalMl: number
}

const MAX_GLASSES = 10

interface GlassItemProps {
  completed: boolean
  isLastCompleted: boolean
}

function GlassItem({ completed, isLastCompleted }: GlassItemProps) {
  const scale = useSharedValue(1)
  const opacity = useSharedValue(completed ? 1 : 0.35)
  const prevIsLast = useRef(false)

  useEffect(() => {
    if (isLastCompleted && !prevIsLast.current) {
      scale.value = withSequence(
        withSpring(1.35, { damping: 5, stiffness: 300 }),
        withSpring(0.9, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 10, stiffness: 180 }),
      )
    }
    prevIsLast.current = isLastCompleted
  }, [isLastCompleted, scale])

  useEffect(() => {
    opacity.value = withTiming(completed ? 1 : 0.35, { duration: 300 })
  }, [completed, opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View style={[styles.glassWrapper, completed && styles.glassWrapperCompleted, animatedStyle]}>
      <Text style={styles.glassEmoji}>{completed ? '🥤' : '🥛'}</Text>
    </Animated.View>
  )
}

export function GlassProgressBar({ totalGlasses, completedGlasses, todayMl, goalMl }: GlassProgressBarProps) {
  const showAsPercent = totalGlasses > MAX_GLASSES
  const displayCount = showAsPercent ? MAX_GLASSES : totalGlasses
  const percent = goalMl > 0 ? Math.min(100, Math.round((todayMl / goalMl) * 100)) : 0
  const clampedCompleted = showAsPercent
    ? Math.round((percent / 100) * MAX_GLASSES)
    : Math.min(completedGlasses, displayCount)

  const label = showAsPercent
    ? `${percent}% · ${todayMl} / ${goalMl} ml`
    : `${clampedCompleted} of ${displayCount} glasses · ${todayMl} / ${goalMl} ml`

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {Array.from({ length: displayCount }, (_, i) => (
          <GlassItem
            key={i}
            completed={i < clampedCompleted}
            isLastCompleted={i === clampedCompleted - 1}
          />
        ))}
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 10, width: '100%' },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  glassWrapper: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  glassWrapperCompleted: { backgroundColor: '#1a3a5c' },
  glassEmoji: { fontSize: 28, textAlign: 'center' },
  label: { color: '#60CFFF', fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
})

export default GlassProgressBar
