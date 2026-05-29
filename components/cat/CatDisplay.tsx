import React, { useEffect } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated'
import { CAT_EMOJIS } from '@/constants/catConfig'
import type { CatMood } from '@/types'

export interface CatDisplayProps {
  mood: CatMood
  onPress: () => void
  isAnimating: boolean
}

export function CatDisplay({ mood, onPress, isAnimating }: CatDisplayProps) {
  const scale = useSharedValue(1)
  const rotation = useSharedValue(0)
  const opacity = useSharedValue(1)
  const glowOpacity = useSharedValue(0)

  useEffect(() => {
    cancelAnimation(scale)
    cancelAnimation(rotation)
    cancelAnimation(opacity)
    cancelAnimation(glowOpacity)

    scale.value = 1
    rotation.value = 0
    opacity.value = 1
    glowOpacity.value = 0

    if (mood === 'happy') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withSpring(1.2, { damping: 6, stiffness: 200 }),
          withSpring(1, { damping: 8, stiffness: 180 }),
          withTiming(1, { duration: 1400 }),
        ),
        -1,
        false,
      )
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800 }),
          withTiming(0.2, { duration: 800 }),
        ),
        -1,
        true,
      )
    } else if (mood === 'normal') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      )
    } else if (mood === 'thirsty') {
      rotation.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 80 }),
          withTiming(8, { duration: 80 }),
          withTiming(-8, { duration: 80 }),
          withTiming(8, { duration: 80 }),
          withTiming(-8, { duration: 80 }),
          withTiming(8, { duration: 80 }),
          withTiming(0, { duration: 80 }),
          withTiming(0, { duration: 1000 }),
        ),
        -1,
        false,
      )
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 600 }),
          withTiming(0, { duration: 600 }),
        ),
        -1,
        false,
      )
    } else if (mood === 'sleeping') {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      )
    }
  }, [mood, scale, rotation, opacity, glowOpacity])

  const handlePress = () => {
    if (isAnimating) return
    scale.value = withSequence(
      withSpring(1.3, { damping: 5, stiffness: 300 }),
      withSpring(0.9, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 10, stiffness: 180 }),
    )
    onPress()
  }

  const animatedCatStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }))

  const glowColor = mood === 'thirsty' ? '#EF4444' : '#60CFFF'
  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    backgroundColor: glowColor,
  }))

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={styles.container}>
      <Animated.View style={[styles.glow, animatedGlowStyle]} />
      <Animated.View style={[styles.catWrapper, animatedCatStyle]}>
        <Text style={styles.catEmoji}>{CAT_EMOJIS[mood]}</Text>
      </Animated.View>
      {mood === 'happy' && (
        <View style={styles.sparklesContainer} pointerEvents="none">
          <Text style={[styles.sparkle, styles.sparkleTopLeft]}>✨</Text>
          <Text style={[styles.sparkle, styles.sparkleTopRight]}>✨</Text>
          <Text style={[styles.sparkle, styles.sparkleBottomLeft]}>✨</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 180,
    height: 180,
  },
  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  catWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  catEmoji: {
    fontSize: 100,
    lineHeight: 120,
    textAlign: 'center',
  },
  sparklesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  sparkle: {
    position: 'absolute',
    fontSize: 20,
  },
  sparkleTopLeft: {
    top: 10,
    left: 10,
  },
  sparkleTopRight: {
    top: 10,
    right: 10,
  },
  sparkleBottomLeft: {
    bottom: 10,
    left: 20,
  },
})

export default CatDisplay
