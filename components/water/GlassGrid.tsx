import React, { useEffect, useRef } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

export interface GlassGridProps {
  totalGlasses: number
  completedGlasses: number
}

const MAX_GLASSES = 8

interface GlassItemProps {
  index: number
  completed: boolean
  isLastCompleted: boolean
}

function GlassItem({ completed, isLastCompleted }: GlassItemProps) {
  const scale = useSharedValue(1)
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

  const opacity = useSharedValue(completed ? 1 : 0.3)

  useEffect(() => {
    opacity.value = withTiming(completed ? 1 : 0.3, { duration: 300 })
  }, [completed, opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View style={[styles.glassWrapper, animatedStyle]}>
      <Text style={styles.glassEmoji}>🥤</Text>
      {completed && <View style={styles.completedGlow} />}
    </Animated.View>
  )
}

export function GlassGrid({ totalGlasses, completedGlasses }: GlassGridProps) {
  const displayCount = Math.min(totalGlasses, MAX_GLASSES)
  const clampedCompleted = Math.min(completedGlasses, displayCount)

  return (
    <View style={styles.grid}>
      {Array.from({ length: displayCount }, (_, i) => {
        const completed = i < clampedCompleted
        const isLastCompleted = i === clampedCompleted - 1
        return (
          <GlassItem
            key={i}
            index={i}
            completed={completed}
            isLastCompleted={isLastCompleted}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    maxWidth: 280,
  },
  glassWrapper: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glassEmoji: {
    fontSize: 36,
    textAlign: 'center',
  },
  completedGlow: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#60CFFF',
    opacity: 0.18,
  },
})

export default GlassGrid
