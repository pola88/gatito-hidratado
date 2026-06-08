import { useNotifications } from '@/hooks/useNotifications'
import { useWaterStore } from '@/stores/waterStore'
import type { UserSettings } from '@/types'
import { calculateDailyGoal, calculateRecommendedInterval } from '@/utils/waterGoal'
import { useMemo, useState } from 'react'
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

// ─── Helpers ────────────────────────────────────────────────────────────────

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

// ─── Sub-components ──────────────────────────────────────────────────────────

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

function IntervalControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.stepperRow}>
      <TouchableOpacity style={styles.stepperBtn} onPress={() => onChange(Math.max(15, value - 15))}>
        <Text style={styles.stepperBtnText}>− 15min</Text>
      </TouchableOpacity>
      <Text style={styles.stepperValue}>{formatInterval(value)}</Text>
      <TouchableOpacity style={styles.stepperBtn} onPress={() => onChange(Math.min(240, value + 15))}>
        <Text style={styles.stepperBtnText}>+ 15min</Text>
      </TouchableOpacity>
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
    { key: 'male', label: 'Masculino' },
    { key: 'female', label: 'Femenino' },
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

// ─── Screen ──────────────────────────────────────────────────────────────────

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

  const goalSummary = useMemo(() => {
    if (settings.goalMode === 'manual') {
      return {
        totalMl: settings.dailyGoalMl,
        totalGlasses: Math.ceil(settings.dailyGoalMl / settings.glassVolumeMl),
        adjustmentsMl: 0,
        breakdown: [],
      }
    }
    return calculateDailyGoal({
      weightKg: settings.weightKg,
      sex: settings.sex,
      exerciseMinutes: settings.exerciseMinutesToday,
      isPregnant: settings.isPregnant,
      isBreastfeeding: settings.isBreastfeeding,
      hotWeather: settings.hotWeather,
      glassVolumeMl: settings.glassVolumeMl,
    })
  }, [settings])

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
        <Text style={styles.pageTitle}>Configuración</Text>

        {/* ── Tu perfil ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Tu perfil</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              onEndEditing={handleNameBlur}
              placeholder="Tu nombre"
              placeholderTextColor={C.placeholder}
              returnKeyType="done"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Sexo biológico</Text>
            <SexSelector value={settings.sex} onChange={v => updateSettings({ sex: v })} />
            <Text style={styles.fieldHint}>Afecta el cálculo base de hidratación</Text>
          </View>

          {settings.sex === 'female' && (
            <View style={styles.femaleSection}>
              <Text style={styles.femaleSectionTitle}>Salud femenina</Text>

              <View style={styles.switchRow}>
                <View style={styles.switchLabelGroup}>
                  <Text style={styles.fieldLabel}>Embarazo 🤰</Text>
                  <Text style={styles.fieldHint}>Suma +300ml a la meta</Text>
                </View>
                <Switch
                  value={settings.isPregnant}
                  onValueChange={handlePregnantChange}
                  trackColor={{ false: C.switchOff, true: C.pink }}
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
                    trackColor={{ false: C.switchOff, true: C.pink }}
                    thumbColor="#fff"
                  />
                </View>
              )}
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Peso</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                value={weight}
                onChangeText={setWeight}
                onEndEditing={handleWeightBlur}
                placeholder="70"
                placeholderTextColor={C.placeholder}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
              <Text style={styles.inputUnit}>kg</Text>
            </View>
          </View>
        </View>

        {/* ── Tu meta ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Tu meta</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Tamaño del vaso</Text>
            <StepperControl
              value={settings.glassVolumeMl}
              step={25} min={100} max={2000}
              format={v => `${v} ml`}
              onChange={v => updateSettings({ glassVolumeMl: v })}
            />
            <Text style={styles.fieldHint}>Define cuántos vasos equivalen a tu meta diaria</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.switchLabelGroup}>
              <Text style={styles.fieldLabel}>Calcular automáticamente</Text>
              <Text style={styles.fieldHint}>Según tu peso y los ajustes del día</Text>
            </View>
            <Switch
              value={settings.goalMode === 'auto'}
              onValueChange={v => updateSettings({ goalMode: v ? 'auto' : 'manual' })}
              trackColor={{ false: C.switchOff, true: C.blue }}
              thumbColor="#fff"
            />
          </View>

          {settings.goalMode !== 'auto' && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Meta personalizada</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  value={String(settings.dailyGoalMl)}
                  onChangeText={v => { const n = parseInt(v, 10); if (!isNaN(n) && n > 0) updateSettings({ dailyGoalMl: n }) }}
                  placeholder="2000"
                  placeholderTextColor={C.placeholder}
                  keyboardType="number-pad"
                  returnKeyType="done"
                />
                <Text style={styles.inputUnit}>ml</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Ajustes del día ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Ajustes del día</Text>
            <Text style={styles.cardBadge}>↺ medianoche</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Ejercicio</Text>
            <StepperControl
              value={settings.exerciseMinutesToday}
              step={15} min={0} max={180}
              format={v => v === 0 ? 'Sin ejercicio' : `${v} min`}
              onChange={v => updateSettings({ exerciseMinutesToday: v })}
            />
            <Text style={styles.fieldHint}>+500ml/hora, proporcional · 30min = +250ml</Text>
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchLabelGroup}>
              <Text style={styles.fieldLabel}>Clima caluroso 🌡️</Text>
              <Text style={styles.fieldHint}>Suma +400ml a la meta</Text>
            </View>
            <Switch
              value={settings.hotWeather}
              onValueChange={v => updateSettings({ hotWeather: v })}
              trackColor={{ false: C.switchOff, true: C.orange }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.goalResultBox}>
            <Text style={styles.goalResultLabel}>Tu meta de hoy</Text>
            <Text style={styles.goalResultValue}>
              {(goalSummary.totalMl / 1000).toFixed(1)}L
              <Text style={styles.goalResultSub}> · {goalSummary.totalGlasses} vasos</Text>
            </Text>
            {goalSummary.adjustmentsMl > 0 && (
              <Text style={styles.goalResultDetail}>
                Base + {goalSummary.adjustmentsMl}ml por ajustes de hoy
              </Text>
            )}
          </View>
        </View>

        {/* ── Recordatorios ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recordatorios</Text>
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchLabelGroup}>
              <Text style={styles.fieldLabel}>Notificaciones</Text>
              <Text style={styles.fieldHint}>El gatito te avisará que tomes agua 🔔</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: C.switchOff, true: C.blue }}
              thumbColor="#fff"
            />
          </View>

          {notificationsEnabled && (
            <>
              <TouchableOpacity style={styles.testBtn} onPress={sendTestNotification}>
                <Text style={styles.testBtnText}>🔔 Probar notificación (en 3 seg)</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TimeControl label="Me despierto"    icon="🌅" value={wakeUp}   onChange={setWakeUp} />
              <TimeControl label="Me voy a dormir" icon="🌙" value={bedTime}  onChange={setBedTime} />

              <View style={styles.divider} />

              <View style={styles.recommendedBox}>
                <View style={styles.recommendedHeader}>
                  <Text style={styles.recommendedTitle}>Intervalo recomendado</Text>
                  <TouchableOpacity onPress={handleUseRecommended} style={styles.useBtn}>
                    <Text style={styles.useBtnText}>Usar</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.recommendedValue}>{formatInterval(recommendedInterval)}</Text>
                <Text style={styles.fieldHint}>{todayGoal} vasos en {activeHours} de horario activo</Text>
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
                <Text style={styles.saveBtnText}>{saving ? 'Programando...' : 'Guardar recordatorios'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Colors (named constants for clarity) ────────────────────────────────────
// All opacities chosen to meet WCAG AA (≥4.5:1 on #0E1F35 background)
const C = {
  blue:        '#60CFFF',   // 8.3:1 — accent, interactive elements
  orange:      '#FB923C',   // 5.8:1 — warm/weather
  pink:        '#F472B6',   // 6.1:1 — female health
  green:       '#4ADE80',   // 9.2:1 — success/complete
  switchOff:   'rgba(255,255,255,0.15)',
  placeholder: 'rgba(255,255,255,0.30)',
  // Text — checked against card bg #0E1F35
  textPrimary:   '#FFFFFF',              // 20:1 ✓
  textSecondary: 'rgba(255,255,255,0.65)', // ~7.2:1 ✓  (was 0.35 → 3.3:1 ✗)
  textMuted:     'rgba(255,255,255,0.50)', // ~5.0:1 ✓  used only for large/bold
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A1628' },
  scroll: { paddingVertical: 24, paddingHorizontal: 20, gap: 12 },

  pageTitle: { color: C.textPrimary, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4 },

  card: { backgroundColor: '#0E1F35', borderRadius: 20, padding: 20, gap: 20 },

  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle:  { color: C.textPrimary, fontSize: 17, fontWeight: '800' },
  cardBadge:  { color: C.textSecondary, fontSize: 12 },

  field:           { gap: 8 },
  fieldLabel:      { color: C.textPrimary, fontSize: 15, fontWeight: '700' },
  fieldHint:       { color: C.textSecondary, fontSize: 12 },

  inputRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputFlex: { flex: 1 },
  inputUnit: { color: C.textSecondary, fontSize: 14, fontWeight: '700' },

  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    color: C.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  switchRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  switchLabelGroup: { flex: 1, gap: 3 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },

  // Sex chips
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1, paddingVertical: 11, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  chipActive:     { backgroundColor: 'rgba(96,207,255,0.15)', borderColor: C.blue },
  chipText:       { color: C.textSecondary, fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: C.blue },

  // Female health sub-section
  femaleSection: {
    backgroundColor: 'rgba(244,114,182,0.08)',
    borderRadius: 14,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(244,114,182,0.22)',
  },
  femaleSectionTitle: {
    color: C.pink,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Goal result
  goalResultBox: {
    backgroundColor: 'rgba(96,207,255,0.08)',
    borderRadius: 14,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(96,207,255,0.20)',
  },
  goalResultLabel:  { color: C.textSecondary, fontSize: 12, fontWeight: '700' },
  goalResultValue:  { color: C.blue, fontSize: 26, fontWeight: '900', marginTop: 2 },
  goalResultSub:    { color: C.textSecondary, fontSize: 18, fontWeight: '600' },
  goalResultDetail: { color: C.textSecondary, fontSize: 12, marginTop: 2 },

  // Time control
  timeRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeLabelGroup:{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  timeIcon:      { fontSize: 18 },
  timeControls:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(96,207,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  timeBtnText: { color: C.blue, fontSize: 20, fontWeight: '700', lineHeight: 24 },
  timeValue:   { color: C.textPrimary, fontSize: 18, fontWeight: '800', minWidth: 56, textAlign: 'center' },

  // Recommended interval
  recommendedBox: {
    backgroundColor: 'rgba(96,207,255,0.06)',
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(96,207,255,0.15)',
    gap: 4,
  },
  recommendedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recommendedTitle:  { color: C.textSecondary, fontSize: 12, fontWeight: '700' },
  useBtn:    { backgroundColor: 'rgba(96,207,255,0.18)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  useBtnText:{ color: C.blue, fontSize: 12, fontWeight: '700' },
  recommendedValue: { color: C.blue, fontSize: 28, fontWeight: '900' },

  // Stepper / interval controls
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  stepperBtn: {
    flex: 1, paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  stepperBtnText:  { color: C.textPrimary, fontSize: 13, fontWeight: '700' },
  stepperValue:    { color: C.textPrimary, fontSize: 18, fontWeight: '900', minWidth: 80, textAlign: 'center' },

  // Escalation preview
  escalationBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14, padding: 14, gap: 12,
  },
  escalationTitle:     { color: C.textSecondary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  escalationSub:       { color: C.textSecondary, fontSize: 11, marginTop: -8 },
  escalationRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  escalationLeft:      { alignItems: 'center', width: 56 },
  escalationDelta:     { color: C.blue, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  escalationConnector: { width: 1, flex: 1, backgroundColor: 'rgba(96,207,255,0.2)', marginTop: 4, minHeight: 16 },
  escalationRight:     { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingBottom: 8 },
  escalationEmoji:     { fontSize: 22 },
  escalationTone:      { color: C.textPrimary, fontSize: 13, fontWeight: '700' },
  escalationCumulative:{ color: C.textSecondary, fontSize: 11, marginTop: 1 },

  // Test button
  testBtn: {
    backgroundColor: 'rgba(96,207,255,0.08)',
    borderRadius: 12, paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(96,207,255,0.18)',
  },
  testBtnText: { color: C.blue, fontSize: 13, fontWeight: '700' },

  // Save button
  saveBtn:         { backgroundColor: C.blue, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText:     { color: '#0A1628', fontSize: 15, fontWeight: '800' },
})
