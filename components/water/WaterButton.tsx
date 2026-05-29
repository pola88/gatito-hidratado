import React from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated'

export interface WaterButtonProps {
  onPress: () => void
  glassVolumeMl?: number
}

export function WaterButton({ onPress, glassVolumeMl = 250 }: WaterButtonProps) {
  const scale = useSharedValue(1)

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.9, { damping: 6, stiffness: 300 }),
      withSpring(1, { damping: 8, stiffness: 200 }),
    )
    onPress()
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
      <Animated.View style={[styles.button, animatedStyle]}>
        <Text style={styles.buttonText}>Drank water! 💧</Text>
        <Text style={styles.volumeText}>{glassVolumeMl}ml</Text>
      </Animated.View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#60CFFF',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#60CFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: '#0d1b2a',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  volumeText: {
    color: '#0d1b2a',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.75,
  },
})

export default WaterButton
