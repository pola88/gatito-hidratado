import React, { useEffect, useRef } from 'react'
import { Dimensions, StyleSheet, Text } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const DROP_COUNT = 6
const DROP_FALL_DURATION = 500
const SCREEN_HEIGHT_APPROX = 300

export interface WaterDropsProps {
  visible: boolean
  onComplete: () => void
}

interface DropConfig {
  x: number
  delay: number
}

function generateDropConfigs(): DropConfig[] {
  return Array.from({ length: DROP_COUNT }, (_, i) => ({
    x: Math.random() * (SCREEN_WIDTH - 40) + 10,
    delay: i * 60,
  }))
}

interface SingleDropProps {
  x: number
  delay: number
  onComplete: () => void
}

function SingleDrop({ x, delay, onComplete }: SingleDropProps) {
  const translateY = useSharedValue(-30)
  const opacity = useSharedValue(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 80 })
      translateY.value = withTiming(
        SCREEN_HEIGHT_APPROX,
        { duration: DROP_FALL_DURATION, easing: Easing.in(Easing.quad) },
        (finished) => {
          if (finished) {
            opacity.value = withTiming(0, { duration: 150 }, (done) => {
              if (done) {
                runOnJS(onComplete)()
              }
            })
          }
        },
      )
    }, delay)

    return () => clearTimeout(timeout)
  }, [translateY, opacity, delay, onComplete])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
    position: 'absolute',
    left: x,
    top: 0,
  }))

  return (
    <Animated.View style={animatedStyle}>
      <Text style={styles.dropEmoji}>💧</Text>
    </Animated.View>
  )
}

export function WaterDrops({ visible, onComplete }: WaterDropsProps) {
  const dropConfigs = useRef<DropConfig[]>(generateDropConfigs())
  const completedCount = useRef(0)

  useEffect(() => {
    if (visible) {
      dropConfigs.current = generateDropConfigs()
      completedCount.current = 0
    }
  }, [visible])

  if (!visible) {
    return null
  }

  const handleDropComplete = () => {
    completedCount.current += 1
    if (completedCount.current >= DROP_COUNT) {
      onComplete()
    }
  }

  return (
    <>
      {dropConfigs.current.map((cfg, i) => (
        <SingleDrop
          key={i}
          x={cfg.x}
          delay={cfg.delay}
          onComplete={handleDropComplete}
        />
      ))}
    </>
  )
}

const styles = StyleSheet.create({
  dropEmoji: {
    fontSize: 24,
  },
})

export default WaterDrops
