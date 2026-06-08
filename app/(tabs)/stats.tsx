import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useWaterStore } from '@/stores/waterStore'
import { useStreak } from '@/hooks/useStreak'
import { useWaterTracker } from '@/hooks/useWaterTracker'
import { calcTotalMl, calcProgressPercent, getProgressColor } from '@/utils/hydrationCalc'

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
}

function HistoryBar({ record }: { record: { date: string; entries: { amount: number }[]; goalMl: number; goal: number } }) {
  const totalMl = calcTotalMl(record.entries)
  const pct = calcProgressPercent(totalMl, record.goalMl)
  const reached = pct >= 80
  const barColor = getProgressColor(pct)

  return (
    <View style={styles.histRow}>
      <Text style={styles.histDate}>{formatDate(record.date)}</Text>
      <View style={styles.histBarWrap}>
        <View style={[styles.histBarFill, { width: `${pct}%` as `${number}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={[styles.histPct, { color: barColor }]}>{pct}%</Text>
      <Text style={styles.histMark}>{reached ? '✅' : '❌'}</Text>
    </View>
  )
}

export default function StatsScreen() {
  const { todayMl, goalMl, progressPercent, todayGlasses, goal, todayEntries } = useWaterTracker()
  const { streak, isStreakAtRisk } = useStreak()
  const history = useWaterStore(s => s.history)

  const litros = (todayMl / 1000).toFixed(2)
  const barBg = getProgressColor(progressPercent)

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>📊 Estadísticas</Text>

        {/* Today summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hoy</Text>
          <View style={styles.todayRow}>
            <View style={styles.todayStat}>
              <Text style={styles.todayValue}>{todayGlasses}</Text>
              <Text style={styles.todayLabel}>de {goal} vasos</Text>
            </View>
            <View style={styles.todayStat}>
              <Text style={styles.todayValue}>{litros}L</Text>
              <Text style={styles.todayLabel}>de {(goalMl / 1000).toFixed(1)}L</Text>
            </View>
            <View style={styles.todayStat}>
              <Text style={[styles.todayValue, { color: barBg }]}>{Math.round(progressPercent)}%</Text>
              <Text style={styles.todayLabel}>completado</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` as `${number}%`, backgroundColor: barBg }]} />
          </View>
        </View>

        {/* Streak */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Racha</Text>
          <View style={styles.streakBox}>
            <Text style={styles.streakEmoji}>{streak > 0 ? '🔥' : '💧'}</Text>
            <View>
              <Text style={[styles.streakDays, { color: isStreakAtRisk ? '#EF4444' : '#FB923C' }]}>
                {streak} {streak === 1 ? 'día' : 'días'}
              </Text>
              {isStreakAtRisk && streak > 0 && (
                <Text style={styles.streakRisk}>¡Tu racha está en riesgo!</Text>
              )}
              {streak === 0 && (
                <Text style={styles.streakHint}>Completá el 80% de tu meta para empezar</Text>
              )}
            </View>
          </View>
        </View>

        {/* History */}
        {history.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Últimos {history.length} días</Text>
            <View style={styles.histList}>
              {history.slice(0, 7).map(record => (
                <HistoryBar key={record.date} record={record} />
              ))}
            </View>
          </View>
        )}

        {/* Today's entries */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Registro de hoy</Text>
          {todayEntries.length === 0 ? (
            <Text style={styles.emptyText}>Todavía no tomaste agua hoy 🥤</Text>
          ) : (
            <View style={styles.entriesList}>
              {[...todayEntries].reverse().map((entry, i) => (
                <View key={entry.id} style={[styles.entryRow, i > 0 && styles.entryRowBorder]}>
                  <Text style={styles.entryTime}>{formatTime(entry.timestamp)}</Text>
                  <Text style={styles.entryAmount}>{entry.amount} ml</Text>
                </View>
              ))}
            </View>
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

  card: { backgroundColor: '#0f2336', borderRadius: 20, padding: 20, gap: 14 },
  cardTitle: { color: '#60CFFF', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },

  // Today
  todayRow: { flexDirection: 'row', justifyContent: 'space-between' },
  todayStat: { alignItems: 'center', gap: 2 },
  todayValue: { color: '#fff', fontSize: 26, fontWeight: '900' },
  todayLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600' },
  progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 100 },

  // Streak
  streakBox: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  streakEmoji: { fontSize: 40 },
  streakDays: { fontSize: 32, fontWeight: '900' },
  streakRisk: { color: '#EF4444', fontSize: 12, fontWeight: '700', marginTop: 2 },
  streakHint: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },

  // History
  histList: { gap: 10 },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  histDate: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', width: 68 },
  histBarWrap: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' },
  histBarFill: { height: '100%', borderRadius: 100 },
  histPct: { fontSize: 11, fontWeight: '700', width: 34, textAlign: 'right' },
  histMark: { fontSize: 13, width: 20, textAlign: 'center' },

  // Entries
  entriesList: { gap: 0 },
  entryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  entryRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  entryTime: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
  entryAmount: { color: '#60CFFF', fontSize: 14, fontWeight: '700' },
  emptyText: { color: 'rgba(255,255,255,0.35)', fontSize: 14, textAlign: 'center', paddingVertical: 8 },
})
