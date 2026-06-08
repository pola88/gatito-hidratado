import React, { useState, useEffect } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  withRepeat,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated'
import { WaterDrops } from '@/components/cat/WaterDrops'
import { ContainerIcon, getContainerType } from '@/components/ui/ContainerIcon'
import { useWaterStore } from '@/stores/waterStore'
import { useWaterTracker } from '@/hooks/useWaterTracker'
import { useCatMood } from '@/hooks/useCatMood'
import { useStreak } from '@/hooks/useStreak'
import type { CatMood } from '@/types'

const CAT_EMOJIS: Record<CatMood, string> = {
  happy: '😺',
  normal: '🐱',
  thirsty: '😿',
  sleeping: '🐱',
}

const CAT_MESSAGES: Record<CatMood, string> = {
  happy: '¡Estoy súper hidratado! 💦',
  normal: 'Podría tomar un poco más de agua...',
  thirsty: '¡Tengo mucha sed! 😭 ¡Toma agua ya!',
  sleeping: 'Zzz... descansando... pero igual toma agua',
}

const DRINK_SOUNDS = ['¡Glup!', '¡Splash!', '¡Aaah~!', '¡Fresquito!', '¡Qué rico! 😺']

function ZzzAnimation() {
  const z1Opacity = useSharedValue(0)
  const z1Y = useSharedValue(0)
  const z2Opacity = useSharedValue(0)
  const z2Y = useSharedValue(0)
  const z3Opacity = useSharedValue(0)
  const z3Y = useSharedValue(0)

  useEffect(() => {
    const cycle = 2000
    const startZ = (delay: number, opacity: typeof z1Opacity, y: typeof z1Y) => {
      setTimeout(() => {
        opacity.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 400 }),
            withTiming(1, { duration: 600 }),
            withTiming(0, { duration: 400 }),
            withTiming(0, { duration: 600 }),
          ), -1, false,
        )
        y.value = withRepeat(
          withSequence(
            withTiming(0, { duration: 0 }),
            withTiming(-30, { duration: 1400, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: 600 }),
          ), -1, false,
        )
      }, delay)
    }
    startZ(0, z1Opacity, z1Y)
    startZ(600, z2Opacity, z2Y)
    startZ(1200, z3Opacity, z3Y)
    return () => {
      cancelAnimation(z1Opacity); cancelAnimation(z1Y)
      cancelAnimation(z2Opacity); cancelAnimation(z2Y)
      cancelAnimation(z3Opacity); cancelAnimation(z3Y)
    }
  }, [])

  const s1 = useAnimatedStyle(() => ({ opacity: z1Opacity.value, transform: [{ translateY: z1Y.value }] }))
  const s2 = useAnimatedStyle(() => ({ opacity: z2Opacity.value, transform: [{ translateY: z2Y.value }] }))
  const s3 = useAnimatedStyle(() => ({ opacity: z3Opacity.value, transform: [{ translateY: z3Y.value }] }))

  return (
    <View style={styles.zzzRow}>
      <Animated.Text style={[styles.zText, { fontSize: 14 }, s1]}>z</Animated.Text>
      <Animated.Text style={[styles.zText, { fontSize: 18 }, s2]}>Z</Animated.Text>
      <Animated.Text style={[styles.zText, { fontSize: 22 }, s3]}>z</Animated.Text>
    </View>
  )
}

export default function HomeScreen() {
  const {
    goal, goalMl, todayGlasses, todayMl,
    progressPercent, lastDrinkTime, addWater,
    removeDrink,
  } = useWaterTracker()
  const glassVolumeMl = useWaterStore(s => s.settings.glassVolumeMl)
  const containerType = getContainerType(glassVolumeMl)
  const { mood, minutesSinceLastDrink } = useCatMood(lastDrinkTime)
  const { streak, isStreakAtRisk } = useStreak()


  const [showDrops, setShowDrops] = useState(false)
  const [drinkSound, setDrinkSound] = useState('')
  const [showSound, setShowSound] = useState(false)
  const [showPaws, setShowPaws] = useState(false)

  const catY = useSharedValue(0)
  const catScale = useSharedValue(1)
  const soundOpacity = useSharedValue(0)
  const soundY = useSharedValue(0)

  useEffect(() => {
    cancelAnimation(catScale)
    if (mood === 'thirsty') {
      catScale.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 750 }),
          withTiming(1, { duration: 750 }),
        ), -1, false,
      )
    } else if (mood === 'sleeping') {
      catScale.value = withRepeat(
        withSequence(
          withTiming(0.96, { duration: 1800 }),
          withTiming(1, { duration: 1800 }),
        ), -1, false,
      )
    } else {
      catScale.value = 1
    }
  }, [mood, catScale])

  const handleDrink = () => {
    catY.value = withSequence(
      withSpring(-18, { damping: 5, stiffness: 300 }),
      withSpring(-6, { damping: 8, stiffness: 200 }),
      withSpring(0, { damping: 10, stiffness: 180 }),
    )
    setShowDrops(true)
    setShowPaws(true)
    setTimeout(() => setShowPaws(false), 900)

    const sound = DRINK_SOUNDS[Math.floor(Math.random() * DRINK_SOUNDS.length)]
    setDrinkSound(sound)
    soundOpacity.value = 0
    soundY.value = 0
    soundOpacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(1, { duration: 600 }),
      withTiming(0, { duration: 350 }),
    )
    soundY.value = withTiming(-48, { duration: 1100, easing: Easing.out(Easing.quad) })
    setShowSound(true)
    setTimeout(() => setShowSound(false), 1100)

    addWater()
  }

  const catAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: catY.value }, { scale: catScale.value }],
  }))
  const soundAnimStyle = useAnimatedStyle(() => ({
    opacity: soundOpacity.value,
    transform: [{ translateY: soundY.value }],
  }))

  const progress = progressPercent
  const litros = (todayMl / 1000).toFixed(2)
  const goalLitros = (goalMl / 1000).toFixed(1)
  const catStateLabel = { happy: '😻 Feliz', normal: '🐱 Normal', thirsty: '😿 Sediento', sleeping: '💤 Dormido' }[mood]

  const lastDrinkLabel = minutesSinceLastDrink >= 999
    ? 'Sin registro aún'
    : minutesSinceLastDrink === 0 ? 'Hace un momento'
    : minutesSinceLastDrink < 60 ? `Hace ${minutesSinceLastDrink} min`
    : `Hace ${Math.floor(minutesSinceLastDrink / 60)}h`

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Text style={styles.title}>💧 Gatito Hidratado</Text>
        <View style={styles.streakRow}>
          <Text style={styles.streakLabel}>Racha:</Text>
          {Array.from({ length: Math.min(streak, 5) }).map((_, i) => (
            <Text key={i} style={styles.flame}>🔥</Text>
          ))}
          {streak > 0
            ? <Text style={[styles.streakDays, { color: isStreakAtRisk ? '#EF4444' : '#FB923C' }]}>{streak} días</Text>
            : <Text style={styles.streakEmpty}>¡Empezá tu racha!</Text>
          }
        </View>

        {/* Main card — whole thing is the drink button */}
        <TouchableOpacity style={styles.mainCard} onPress={handleDrink} activeOpacity={0.9}>

          {showSound && (
            <Animated.Text style={[styles.soundPop, soundAnimStyle]}>
              {drinkSound}
            </Animated.Text>
          )}

          {/* Cat */}
          <View style={styles.catArea}>
            <Animated.Text style={[styles.catEmoji, catAnimStyle]}>
              {CAT_EMOJIS[mood]}
            </Animated.Text>

            {mood === 'sleeping' && <ZzzAnimation />}

            {mood === 'happy' && (
              <>
                <Text style={[styles.sparkle, { top: 4, left: 40 }]}>✨</Text>
                <Text style={[styles.sparkle, { top: 4, right: 40 }]}>✨</Text>
              </>
            )}

            {showPaws && (
              <View style={styles.pawsRow}>
                <Text style={styles.paw}>🐾</Text>
                <Text style={styles.paw}>🐾</Text>
              </View>
            )}
          </View>

          {/* Message bubble */}
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{CAT_MESSAGES[mood]}</Text>
          </View>

          <Text style={styles.tapHint}>👆 TOCA PARA BEBER AGUA</Text>
        </TouchableOpacity>

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Tu progreso hoy</Text>
            <Text style={styles.lastDrink}>{lastDrinkLabel}</Text>
          </View>

          <View style={styles.glassesRow}>
            {Array.from({ length: goal }).map((_, i) => {
              const filled = i < todayGlasses
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => filled ? removeDrink() : addWater()}
                  activeOpacity={0.6}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                >
                  <ContainerIcon
                    type={containerType}
                    size={28}
                    filled={filled}
                  />
                </TouchableOpacity>
              )
            })}
          </View>

          <View style={styles.barHeader}>
            <Text style={styles.barLabel}>{todayGlasses} de {goal} vasos</Text>
            <Text style={[styles.barPct, { color: progress >= 100 ? '#4ade80' : '#60CFFF' }]}>{progress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` as `${number}%` }]} />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Estado', value: catStateLabel },
            { label: 'Meta', value: `${goal} vasos` },
            { label: 'Tomado', value: `${litros}L / ${goalLitros}L` },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      {showDrops && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <WaterDrops visible={showDrops} onComplete={() => setShowDrops(false)} />
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d1b2a' },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, gap: 14 },

  title: { fontSize: 26, color: '#fff', textAlign: 'center', fontWeight: '800', letterSpacing: 0.5 },
  streakRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  streakLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '700' },
  flame: { fontSize: 14 },
  streakDays: { fontSize: 13, fontWeight: '800' },
  streakEmpty: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '700' },

  mainCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    gap: 14,
    overflow: 'hidden',
  },
  soundPop: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    color: '#60CFFF',
    fontSize: 22,
    fontWeight: '900',
    zIndex: 30,
  },

  catArea: { alignItems: 'center', justifyContent: 'center', height: 110 },
  catEmoji: { fontSize: 88, textAlign: 'center' },
  sparkle: { position: 'absolute', fontSize: 16 },
  zzzRow: { position: 'absolute', top: 0, right: 50, flexDirection: 'row', gap: 3, alignItems: 'flex-end' },
  zText: { color: '#9B8EC4', fontWeight: '900' },
  pawsRow: { position: 'absolute', bottom: -4, flexDirection: 'row', gap: 28 },
  paw: { fontSize: 22 },

  bubble: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  bubbleText: { color: '#fff', fontSize: 13, fontWeight: '700', textAlign: 'center' },

  tapHint: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  progressSection: { gap: 10 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '800' },
  lastDrink: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  glassesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  barPct: { fontSize: 12, fontWeight: '900' },
  progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 100, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 100, backgroundColor: '#818CF8' },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16, paddingVertical: 10, paddingHorizontal: 8,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', gap: 3,
  },
  statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700' },
  statValue: { color: '#fff', fontSize: 13, fontWeight: '900', textAlign: 'center' },
})
