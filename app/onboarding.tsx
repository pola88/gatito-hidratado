import React, { useState, useMemo } from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useWaterStore } from '@/stores/waterStore'
import { useNotifications } from '@/hooks/useNotifications'
import { calculateDailyGoal, calculateRecommendedInterval } from '@/utils/waterGoal'
import type { UserSettings } from '@/types'

type Sex = 'male' | 'female' | 'other'

const TOTAL_STEPS = 3

function ProgressDots({ current }: { current: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
      ))}
    </View>
  )
}

function SexSelector({ value, onChange }: { value: Sex; onChange: (v: Sex) => void }) {
  const options: { key: Sex; label: string }[] = [
    { key: 'male', label: 'Masc.' },
    { key: 'female', label: 'Fem.' },
    { key: 'other', label: 'Otro' },
  ]
  return (
    <View style={styles.chipRow}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.key}
          style={[styles.chip, value === opt.key && styles.chipActive]}
          onPress={() => onChange(opt.key)}
        >
          <Text style={[styles.chipText, value === opt.key && styles.chipTextActive]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

function adjustTime(time: string, deltaMinutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = ((h * 60 + m + deltaMinutes) + 24 * 60) % (24 * 60)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function TimeControl({ label, icon, value, onChange }: {
  label: string; icon: string; value: string; onChange: (v: string) => void
}) {
  return (
    <View style={styles.timeRow}>
      <View style={styles.timeLabelGroup}>
        <Text style={styles.timeIcon}>{icon}</Text>
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <View style={styles.timeControls}>
        <TouchableOpacity style={styles.timeBtn} onPress={() => onChange(adjustTime(value, -30))}>
          <Text style={styles.timeBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.timeValue}>{value}</Text>
        <TouchableOpacity style={styles.timeBtn} onPress={() => onChange(adjustTime(value, 30))}>
          <Text style={styles.timeBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function StepperControl({ value, step, min, max, format, onChange }: {
  value: number; step: number; min: number; max: number
  format: (v: number) => string; onChange: (v: number) => void
}) {
  return (
    <View style={styles.stepperRow}>
      <TouchableOpacity style={styles.stepperBtn} onPress={() => onChange(Math.max(min, value - step))}>
        <Text style={styles.stepperBtnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.stepperValue}>{format(value)}</Text>
      <TouchableOpacity style={styles.stepperBtn} onPress={() => onChange(Math.min(max, value + step))}>
        <Text style={styles.stepperBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

function formatInterval(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

// ─── Step 0: Bienvenida ────────────────────────────────────────────────────

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.stepCenter}>
      <Text style={styles.catEmoji}>🐱</Text>
      <Text style={styles.welcomeTitle}>Hola, soy tu{'\n'}gatito hidratado</Text>
      <Text style={styles.welcomeSubtitle}>
        Te voy a ayudar a tomar más agua cada día
      </Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={onNext}>
        <Text style={styles.primaryBtnText}>Empezar</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── Step 1: Perfil ────────────────────────────────────────────────────────

function StepProfile({
  weight, setWeight,
  sex, setSex,
  isPregnant, setIsPregnant,
  isBreastfeeding, setIsBreastfeeding,
  onBack, onNext,
}: {
  weight: string; setWeight: (v: string) => void
  sex: Sex; setSex: (v: Sex) => void
  isPregnant: boolean; setIsPregnant: (v: boolean) => void
  isBreastfeeding: boolean; setIsBreastfeeding: (v: boolean) => void
  onBack: () => void; onNext: () => void
}) {
  const handleNext = () => {
    const w = parseFloat(weight)
    if (isNaN(w) || w <= 0) {
      Alert.alert('Necesito tu peso', 'El gatito necesita saber tu peso para calcular tu meta de agua')
      return
    }
    onNext()
  }

  const handlePregnant = (v: boolean) => {
    setIsPregnant(v)
    if (v) setIsBreastfeeding(false)
  }

  return (
    <ScrollView contentContainerStyle={styles.stepScroll} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backBtn}>← Atrás</Text>
      </TouchableOpacity>
      <Text style={styles.stepTitle}>Tu perfil</Text>
      <Text style={styles.stepSubtitle}>Esto me ayuda a calcular tu meta de agua</Text>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Peso (kg)</Text>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          placeholder="70"
          placeholderTextColor="rgba(255,255,255,0.3)"
          keyboardType="decimal-pad"
          returnKeyType="done"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Sexo</Text>
        <SexSelector value={sex} onChange={setSex} />
      </View>

      {sex === 'female' && (
        <>
          <View style={styles.switchRow}>
            <View style={styles.switchLabelGroup}>
              <Text style={styles.fieldLabel}>Embarazo 🤰</Text>
              <Text style={styles.fieldHint}>Suma +300ml a la meta</Text>
            </View>
            <Switch
              value={isPregnant}
              onValueChange={handlePregnant}
              trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#F9A8D4' }}
              thumbColor="#fff"
            />
          </View>

          {!isPregnant && (
            <View style={styles.switchRow}>
              <View style={styles.switchLabelGroup}>
                <Text style={styles.fieldLabel}>Lactancia 🤱</Text>
                <Text style={styles.fieldHint}>Suma +700ml a la meta</Text>
              </View>
              <Switch
                value={isBreastfeeding}
                onValueChange={setIsBreastfeeding}
                trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#F9A8D4' }}
                thumbColor="#fff"
              />
            </View>
          )}
        </>
      )}

      <TouchableOpacity style={[styles.primaryBtn, styles.primaryBtnMt]} onPress={handleNext}>
        <Text style={styles.primaryBtnText}>Continuar</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

// ─── Step 2: Recordatorios ─────────────────────────────────────────────────

function StepNotifications({
  notificationsEnabled, setNotificationsEnabled,
  intervalMin, setIntervalMin,
  goalResult,
  wakeUp, setWakeUp,
  bedTime, setBedTime,
  onBack, onFinish,
}: {
  notificationsEnabled: boolean; setNotificationsEnabled: (v: boolean) => void
  intervalMin: number; setIntervalMin: (v: number) => void
  goalResult: { totalMl: number; totalGlasses: number }
  wakeUp: string; setWakeUp: (v: string) => void
  bedTime: string; setBedTime: (v: string) => void
  onBack: () => void; onFinish: () => void
}) {
  const { requestPermissions } = useNotifications()

  const handleToggle = async (v: boolean) => {
    if (v) {
      const granted = await requestPermissions()
      if (!granted) {
        Alert.alert(
          'Notificaciones bloqueadas',
          'Para que el gatito te recuerde tomar agua, activá las notificaciones en Configuración > Aplicaciones > Gatito Hidratado.',
        )
        return
      }
    }
    setNotificationsEnabled(v)
  }

  return (
    <ScrollView contentContainerStyle={styles.stepScroll}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backBtn}>← Atrás</Text>
      </TouchableOpacity>
      <Text style={styles.stepTitle}>Recordatorios</Text>
      <Text style={styles.stepSubtitle}>El gatito te avisa cuando es hora de tomar agua</Text>

      <View style={styles.goalBox}>
        <Text style={styles.goalLabel}>Tu meta diaria</Text>
        <Text style={styles.goalValue}>{goalResult.totalMl} ml</Text>
        <Text style={styles.goalGlasses}>{goalResult.totalGlasses} vasos por día</Text>
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchLabelGroup}>
          <Text style={styles.fieldLabel}>Activar notificaciones 🔔</Text>
          <Text style={styles.fieldHint}>El gatito te mandará recordatorios</Text>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={handleToggle}
          trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#60CFFF' }}
          thumbColor="#fff"
        />
      </View>

      {notificationsEnabled && (
        <>
          <View style={styles.card}>
            <TimeControl label="Me despierto" icon="🌅" value={wakeUp} onChange={setWakeUp} />
            <TimeControl label="Me voy a dormir" icon="🌙" value={bedTime} onChange={setBedTime} />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Cada cuánto te aviso</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setIntervalMin(Math.max(15, intervalMin - 15))}
              >
                <Text style={styles.stepperBtnText}>− 15min</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{formatInterval(intervalMin)}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setIntervalMin(Math.min(240, intervalMin + 15))}
              >
                <Text style={styles.stepperBtnText}>+ 15min</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldHint}>Entre {wakeUp} y {bedTime}</Text>
          </View>
        </>
      )}

      <TouchableOpacity style={[styles.primaryBtn, styles.primaryBtnMt]} onPress={onFinish}>
        <Text style={styles.primaryBtnText}>¡Listo, empezar! 🐱</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onFinish} style={styles.skipBtn}>
        <Text style={styles.skipBtnText}>Ahora no, quizás más tarde</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

// ─── Root ──────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter()
  const updateSettings = useWaterStore(s => s.updateSettings)
  const defaultSettings = useWaterStore(s => s.settings)

  const [step, setStep] = useState(0)

  // Step 1
  const [weight, setWeight] = useState('70')
  const [sex, setSex] = useState<Sex>('other')
  const [isPregnant, setIsPregnant] = useState(false)
  const [isBreastfeeding, setIsBreastfeeding] = useState(false)

  // Step 2
  const [wakeUp, setWakeUp] = useState(defaultSettings.wakeUpTime)
  const [bedTime, setBedTime] = useState(defaultSettings.bedTime)
  const glassVolumeMl = defaultSettings.glassVolumeMl
  const hotWeather = false

  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  const goalResult = useMemo(() => {
    const weightKg = parseFloat(weight) || 70
    return calculateDailyGoal({ weightKg, sex, exerciseMinutes: 0, isPregnant, isBreastfeeding, hotWeather, glassVolumeMl })
  }, [weight, sex, isPregnant, isBreastfeeding, hotWeather, glassVolumeMl])

  const recommendedInterval = useMemo(
    () => calculateRecommendedInterval(goalResult.totalGlasses, wakeUp, bedTime),
    [goalResult.totalGlasses, wakeUp, bedTime],
  )
  const [intervalMin, setIntervalMin] = useState(60)

  // keep intervalMin in sync when recommended changes (only if user hasn't manually adjusted)
  const [intervalTouched, setIntervalTouched] = useState(false)
  const handleIntervalChange = (v: number) => { setIntervalTouched(true); setIntervalMin(v) }
  const effectiveInterval = intervalTouched ? intervalMin : recommendedInterval

  const handleFinish = () => {
    const weightKg = parseFloat(weight) || 70
    const partial: Partial<UserSettings> = {
      weightKg,
      sex,
      isPregnant,
      isBreastfeeding,
      wakeUpTime: wakeUp,
      bedTime,
      glassVolumeMl,
      hotWeather,
      notificationsEnabled,
      reminderIntervalMin: effectiveInterval,
      hasCompletedOnboarding: true,
    }
    updateSettings(partial)
    router.replace('/(tabs)')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ProgressDots current={step} />

      {step === 0 && <StepWelcome onNext={() => setStep(1)} />}

      {step === 1 && (
        <StepProfile
          weight={weight} setWeight={setWeight}
          sex={sex} setSex={setSex}
          isPregnant={isPregnant} setIsPregnant={setIsPregnant}
          isBreastfeeding={isBreastfeeding} setIsBreastfeeding={setIsBreastfeeding}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <StepNotifications
          notificationsEnabled={notificationsEnabled}
          setNotificationsEnabled={setNotificationsEnabled}
          intervalMin={effectiveInterval}
          setIntervalMin={handleIntervalChange}
          goalResult={goalResult}
          wakeUp={wakeUp} setWakeUp={setWakeUp}
          bedTime={bedTime} setBedTime={setBedTime}
          onBack={() => setStep(1)}
          onFinish={handleFinish}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d1b2a' },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: 16, paddingBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive: { backgroundColor: '#60CFFF', width: 20 },

  // Welcome
  stepCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  catEmoji: { fontSize: 80 },
  welcomeTitle: { color: '#fff', fontSize: 28, fontWeight: '800', textAlign: 'center', lineHeight: 36 },
  welcomeSubtitle: { color: 'rgba(255,255,255,0.55)', fontSize: 16, textAlign: 'center', lineHeight: 24 },

  // Steps with scroll
  stepScroll: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8, gap: 20 },
  stepTitle: { color: '#fff', fontSize: 26, fontWeight: '800' },
  stepSubtitle: { color: 'rgba(255,255,255,0.55)', fontSize: 15, marginTop: -12, lineHeight: 22 },

  backBtn: { color: 'rgba(255,255,255,0.45)', fontSize: 14, fontWeight: '600', marginBottom: 4 },

  // Card wrapper for time controls
  card: { backgroundColor: '#0f2336', borderRadius: 20, padding: 16, gap: 16 },

  // Fields
  field: { gap: 8 },
  fieldLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  fieldHint: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  // Sex chips
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  chipActive: { backgroundColor: 'rgba(96,207,255,0.15)', borderColor: '#60CFFF' },
  chipText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: '#60CFFF' },

  // Switch row
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  switchLabelGroup: { flex: 1, gap: 2 },

  // Time control
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  timeIcon: { fontSize: 18 },
  timeControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(96,207,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  timeBtnText: { color: '#60CFFF', fontSize: 22, fontWeight: '700', lineHeight: 26 },
  timeValue: { color: '#fff', fontSize: 18, fontWeight: '800', minWidth: 56, textAlign: 'center' },

  // Stepper
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepperBtn: {
    flex: 1, paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  stepperBtnText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700' },
  stepperValue: { color: '#fff', fontSize: 17, fontWeight: '900', minWidth: 90, textAlign: 'center' },

  // Goal box (step 3)
  goalBox: {
    backgroundColor: 'rgba(96,207,255,0.08)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(96,207,255,0.2)',
    gap: 4,
  },
  goalLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  goalValue: { color: '#60CFFF', fontSize: 40, fontWeight: '900' },
  goalGlasses: { color: 'rgba(255,255,255,0.6)', fontSize: 15 },

  // Primary button
  primaryBtn: {
    backgroundColor: '#60CFFF',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  primaryBtnMt: { marginTop: 8 },
  primaryBtnText: { color: '#0d1b2a', fontSize: 16, fontWeight: '800' },

  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipBtnText: { color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: '600' },
})
