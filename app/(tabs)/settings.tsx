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
import { useWaterStore } from '@/stores/waterStore'
import { useNotifications } from '@/hooks/useNotifications'
import { calculateRecommendedInterval } from '@/utils/waterGoal'
import type { UserSettings } from '@/types'

function formatInterval(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

function adjustTime(time: string, deltaMinutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = ((h * 60 + m + deltaMinutes) + 24 * 60) % (24 * 60)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function TimeControl({ label, icon, value, onChange }: {
  label: string
  icon: string
  value: string
  onChange: (v: string) => void
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

function IntervalControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.intervalRow}>
      <TouchableOpacity
        style={styles.intervalBtn}
        onPress={() => onChange(Math.max(15, value - 15))}
      >
        <Text style={styles.intervalBtnText}>− 15min</Text>
      </TouchableOpacity>
      <Text style={styles.intervalValue}>{formatInterval(value)}</Text>
      <TouchableOpacity
        style={styles.intervalBtn}
        onPress={() => onChange(Math.min(240, value + 15))}
      >
        <Text style={styles.intervalBtnText}>+ 15min</Text>
      </TouchableOpacity>
    </View>
  )
}

function StepperControl({ value, step, min, max, format, onChange }: {
  value: number
  step: number
  min: number
  max: number
  format: (v: number) => string
  onChange: (v: number) => void
}) {
  return (
    <View style={styles.intervalRow}>
      <TouchableOpacity
        style={styles.intervalBtn}
        onPress={() => onChange(Math.max(min, value - step))}
      >
        <Text style={styles.intervalBtnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.intervalValue}>{format(value)}</Text>
      <TouchableOpacity
        style={styles.intervalBtn}
        onPress={() => onChange(Math.min(max, value + step))}
      >
        <Text style={styles.intervalBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

const ESCALATION_FACTORS = [1.0, 0.75, 0.5]
const ESCALATION_META = [
  { emoji: '🐱', tone: 'Suave' },
  { emoji: '😿', tone: 'Insistente' },
  { emoji: '🆘', tone: 'Urgente' },
]

function EscalationPreview({ intervalMin }: { intervalMin: number }) {
  let cumulative = 0
  const steps = ESCALATION_FACTORS.map((factor, i) => {
    const delta = Math.round(intervalMin * factor)
    cumulative += delta
    return { delta, cumulative, ...ESCALATION_META[i] }
  })

  return (
    <View style={styles.escalationBox}>
      <Text style={styles.escalationTitle}>Cadena de recordatorios</Text>
      <Text style={styles.escalationSub}>Desde tu último vaso</Text>
      {steps.map((step, i) => (
        <View key={i} style={styles.escalationRow}>
          <View style={styles.escalationLeft}>
            <Text style={styles.escalationDelta}>+{formatInterval(step.delta)}</Text>
            {i < steps.length - 1 && <View style={styles.escalationConnector} />}
          </View>
          <View style={styles.escalationRight}>
            <Text style={styles.escalationEmoji}>{step.emoji}</Text>
            <View>
              <Text style={styles.escalationTone}>{step.tone}</Text>
              <Text style={styles.escalationCumulative}>{formatInterval(step.cumulative)} sin tomar agua</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  )
}

type Sex = 'male' | 'female' | 'other'

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

export default function SettingsScreen() {
  const settings = useWaterStore(s => s.settings)
  const updateSettings = useWaterStore(s => s.updateSettings)
  const todayGoal = useWaterStore(s => s.today.goal)
  const lastEntryTimestamp = useWaterStore(s => {
    const entries = s.today.entries
    return entries.length > 0 ? entries[entries.length - 1].timestamp : null
  })
  const lastEntry = lastEntryTimestamp !== null ? new Date(lastEntryTimestamp) : null
  const { requestPermissions, scheduleFromLastDrink, cancelAllReminders, sendTestNotification } = useNotifications()

  const [name, setName] = useState(settings.name)
  const [weight, setWeight] = useState(String(settings.weightKg))
  const [wakeUp, setWakeUp] = useState(settings.wakeUpTime)
  const [bedTime, setBedTime] = useState(settings.bedTime)
  const [intervalMin, setIntervalMin] = useState(settings.reminderIntervalMin)
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled)
  const [saving, setSaving] = useState(false)

  const recommendedInterval = useMemo(
    () => calculateRecommendedInterval(todayGoal, wakeUp, bedTime),
    [todayGoal, wakeUp, bedTime],
  )

  const activeHours = useMemo(() => {
    const [wH, wM] = wakeUp.split(':').map(Number)
    const [bH, bM] = bedTime.split(':').map(Number)
    const mins = (bH * 60 + bM) - (wH * 60 + wM)
    const h = Math.floor(Math.abs(mins) / 60)
    const m = Math.abs(mins) % 60
    return m > 0 ? `${h}h ${m}min` : `${h}h`
  }, [wakeUp, bedTime])

  const handleUseRecommended = () => setIntervalMin(recommendedInterval)

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestPermissions()
      if (!granted) {
        Alert.alert(
          'Permisos necesarios',
          'Para recibir recordatorios, habilitá las notificaciones en Configuración del sistema.',
        )
        return
      }
    }
    setNotificationsEnabled(value)
  }

  const handlePregnantChange = (v: boolean) => {
    updateSettings({ isPregnant: v, ...(v ? { isBreastfeeding: false } : {}) })
  }

  const handleNameBlur = () => {
    const trimmed = name.trim()
    if (trimmed) updateSettings({ name: trimmed })
  }

  const handleWeightBlur = () => {
    const parsed = parseFloat(weight)
    if (!isNaN(parsed) && parsed > 0) updateSettings({ weightKg: parsed })
  }

  const handleSchedule = async () => {
    setSaving(true)
    const notifSettings: Partial<UserSettings> = {
      wakeUpTime: wakeUp,
      bedTime,
      reminderIntervalMin: intervalMin,
      notificationsEnabled,
    }
    updateSettings(notifSettings)
    const fullSettings: UserSettings = { ...settings, ...notifSettings }
    if (notificationsEnabled) {
      await scheduleFromLastDrink(fullSettings, lastEntry)
    } else {
      await cancelAllReminders()
    }
    setSaving(false)
    Alert.alert('¡Listo!', notificationsEnabled
      ? `Recordatorios programados cada ${formatInterval(intervalMin)} entre ${wakeUp} y ${bedTime} 🔔`
      : 'Recordatorios desactivados.',
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>⚙️ Configuración</Text>

        {/* Profile */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Perfil</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              onEndEditing={handleNameBlur}
              placeholder="Tu nombre"
              placeholderTextColor="rgba(255,255,255,0.3)"
              returnKeyType="done"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Peso (kg)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              onEndEditing={handleWeightBlur}
              placeholder="70"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
            <Text style={styles.fieldHint}>Afecta el cálculo de la meta diaria</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Sexo</Text>
            <SexSelector value={settings.sex} onChange={v => updateSettings({ sex: v })} />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Tamaño del vaso</Text>
            <StepperControl
              value={settings.glassVolumeMl}
              step={50}
              min={100}
              max={500}
              format={v => `${v} ml`}
              onChange={v => updateSettings({ glassVolumeMl: v })}
            />
            <Text style={styles.fieldHint}>Define cuántos vasos equivale tu meta</Text>
          </View>
        </View>

        {/* Goal */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meta diaria</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchLabelGroup}>
              <Text style={styles.fieldLabel}>Meta automática</Text>
              <Text style={styles.fieldHint}>Calculada en base a tu peso</Text>
            </View>
            <Switch
              value={settings.goalMode === 'auto'}
              onValueChange={v => updateSettings({ goalMode: v ? 'auto' : 'manual' })}
              trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#60CFFF' }}
              thumbColor="#fff"
            />
          </View>

          {settings.goalMode !== 'auto' && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Meta personalizada (ml)</Text>
              <TextInput
                style={styles.input}
                value={String(settings.dailyGoalMl)}
                onChangeText={v => { const n = parseInt(v, 10); if (!isNaN(n) && n > 0) updateSettings({ dailyGoalMl: n }) }}
                placeholder="2000"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="number-pad"
                returnKeyType="done"
              />
            </View>
          )}

          <View style={styles.switchRow}>
            <View style={styles.switchLabelGroup}>
              <Text style={styles.fieldLabel}>Clima caluroso 🌡️</Text>
              <Text style={styles.fieldHint}>Suma +400ml a la meta</Text>
            </View>
            <Switch
              value={settings.hotWeather}
              onValueChange={v => updateSettings({ hotWeather: v })}
              trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#FB923C' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Ejercicio hoy</Text>
            <StepperControl
              value={settings.exerciseMinutesToday}
              step={15}
              min={0}
              max={180}
              format={v => v === 0 ? 'Sin ejercicio' : `${v} min`}
              onChange={v => updateSettings({ exerciseMinutesToday: v })}
            />
            <Text style={styles.fieldHint}>+500ml por hora de ejercicio</Text>
          </View>

          {settings.sex === 'female' && (
            <>
              <View style={styles.switchRow}>
                <View style={styles.switchLabelGroup}>
                  <Text style={styles.fieldLabel}>Embarazo 🤰</Text>
                  <Text style={styles.fieldHint}>Suma +300ml a la meta</Text>
                </View>
                <Switch
                  value={settings.isPregnant}
                  onValueChange={handlePregnantChange}
                  trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#F9A8D4' }}
                  thumbColor="#fff"
                />
              </View>

              {!settings.isPregnant && (
                <View style={styles.switchRow}>
                  <View style={styles.switchLabelGroup}>
                    <Text style={styles.fieldLabel}>Lactancia 🤱</Text>
                    <Text style={styles.fieldHint}>Suma +700ml a la meta</Text>
                  </View>
                  <Switch
                    value={settings.isBreastfeeding}
                    onValueChange={v => updateSettings({ isBreastfeeding: v })}
                    trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#F9A8D4' }}
                    thumbColor="#fff"
                  />
                </View>
              )}
            </>
          )}
        </View>

        {/* Reminders */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recordatorios</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchLabelGroup}>
              <Text style={styles.fieldLabel}>Activar notificaciones 🔔</Text>
              <Text style={styles.fieldHint}>El gatito te avisará que tomes agua</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#60CFFF' }}
              thumbColor="#fff"
            />
          </View>

          {notificationsEnabled && (
            <>
              <TouchableOpacity
                style={styles.testBtn}
                onPress={sendTestNotification}
              >
                <Text style={styles.testBtnText}>🔔 Probar notificación (en 3 seg)</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TimeControl
                label="Me despierto"
                icon="🌅"
                value={wakeUp}
                onChange={setWakeUp}
              />
              <TimeControl
                label="Me voy a dormir"
                icon="🌙"
                value={bedTime}
                onChange={setBedTime}
              />

              <View style={styles.divider} />

              <View style={styles.recommendedBox}>
                <View style={styles.recommendedHeader}>
                  <Text style={styles.recommendedTitle}>Intervalo recomendado</Text>
                  <TouchableOpacity onPress={handleUseRecommended} style={styles.useBtn}>
                    <Text style={styles.useBtnText}>Usar</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.recommendedValue}>{formatInterval(recommendedInterval)}</Text>
                <Text style={styles.recommendedHint}>
                  {todayGoal} vasos en {activeHours} de horario activo
                </Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Ajuste manual</Text>
                <IntervalControl value={intervalMin} onChange={setIntervalMin} />
              </View>

              <EscalationPreview intervalMin={intervalMin} />

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSchedule}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Programando...' : 'Programar recordatorios 🔔'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}


const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d1b2a' },
  scroll: { paddingVertical: 24, paddingHorizontal: 20, gap: 16 },

  title: { color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 4 },

  card: { backgroundColor: '#0f2336', borderRadius: 20, padding: 20, gap: 16 },
  cardTitle: { color: '#60CFFF', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },

  field: { gap: 6 },
  fieldLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  fieldHint: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  switchLabelGroup: { flex: 1, gap: 2 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },

  // Sex selector chips
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipActive: {
    backgroundColor: 'rgba(96,207,255,0.15)',
    borderColor: '#60CFFF',
  },
  chipText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: '#60CFFF' },

  // Time control
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  timeIcon: { fontSize: 18 },
  timeControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(96,207,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  timeBtnText: { color: '#60CFFF', fontSize: 20, fontWeight: '700', lineHeight: 24 },
  timeValue: { color: '#fff', fontSize: 18, fontWeight: '800', minWidth: 56, textAlign: 'center' },

  // Recommended
  recommendedBox: {
    backgroundColor: 'rgba(96,207,255,0.08)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(96,207,255,0.2)',
    gap: 4,
  },
  recommendedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recommendedTitle: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700' },
  useBtn: { backgroundColor: 'rgba(96,207,255,0.2)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  useBtnText: { color: '#60CFFF', fontSize: 12, fontWeight: '700' },
  recommendedValue: { color: '#60CFFF', fontSize: 28, fontWeight: '900' },
  recommendedHint: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },

  // Interval / Stepper control
  intervalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  intervalBtn: {
    flex: 1, paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  intervalBtnText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700' },
  intervalValue: { color: '#fff', fontSize: 18, fontWeight: '900', minWidth: 80, textAlign: 'center' },

  // Escalation preview
  escalationBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  escalationTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  escalationSub: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: -8 },
  escalationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  escalationLeft: { alignItems: 'center', width: 56 },
  escalationDelta: { color: '#60CFFF', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  escalationConnector: { width: 1, flex: 1, backgroundColor: 'rgba(96,207,255,0.2)', marginTop: 4, minHeight: 16 },
  escalationRight: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingBottom: 8 },
  escalationEmoji: { fontSize: 22 },
  escalationTone: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700' },
  escalationCumulative: { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 1 },

  // Test button
  testBtn: {
    backgroundColor: 'rgba(96,207,255,0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(96,207,255,0.25)',
  },
  testBtnText: { color: '#60CFFF', fontSize: 13, fontWeight: '700' },

  // Save
  saveBtn: { backgroundColor: '#60CFFF', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#0d1b2a', fontSize: 16, fontWeight: '800' },
})
