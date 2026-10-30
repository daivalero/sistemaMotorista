import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Card, EmptyState, StatusBadge, ui } from '../components/NativeUi'
import { formatDateTime, formatMoney } from '../data'
import { expenseTotal, expensesOf } from '../logic'
import { useStore } from '../store'
import { colors } from '../theme'
import type { Screen, TripStatus } from '../types'

const filters: { id: 'todas' | TripStatus; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'rascunho', label: 'Rascunhos' },
  { id: 'aguardando_conferencia', label: 'Enviados' },
  { id: 'precisa_correcao', label: 'Correção' },
  { id: 'concluida', label: 'Concluídas' },
]

export function TripsScreen({ navigate }: { navigate: (screen: Screen) => void }) {
  const { state } = useStore()
  const profile = state.session.profile
  const [filter, setFilter] = useState<(typeof filters)[number]['id']>('todas')
  const trips = useMemo(
    () =>
      state.trips
        .filter((trip) => profile?.role === 'admin' || trip.driverId === profile?.id)
        .filter((trip) => {
          if (filter === 'todas') return true
          if (filter === 'rascunho') return ['rascunho', 'em_andamento'].includes(trip.status)
          return trip.status === filter
        })
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [filter, profile, state.trips],
  )

  return (
    <ScrollView contentContainerStyle={ui.content}>
      <View>
        <Text style={ui.eyebrow}>Histórico</Text>
        <Text style={ui.pageTitle}>Meus registros</Text>
        <Text style={ui.muted}>Viagens salvas, rascunhos e status de conferência.</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filters.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setFilter(item.id)}
            style={[styles.chip, filter === item.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, filter === item.id && styles.chipTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {trips.length === 0 ? (
        <EmptyState title="Nenhum registro aqui" message="Crie uma viagem pela tela Hoje." />
      ) : (
        trips.map((trip) => (
          <Card
            key={trip.id}
            onPress={() => navigate({ name: 'viagem', id: trip.id, from: 'viagens' })}
          >
            <View style={ui.between}>
              <Text style={styles.title}>{trip.tripDate}</Text>
              <StatusBadge status={trip.status} />
            </View>
            <Text style={ui.muted}>
              {expensesOf(state, trip.id).length} gastos ·{' '}
              {formatMoney(expenseTotal(expensesOf(state, trip.id)))}
              {trip.distanceKm != null ? ` · ${trip.distanceKm} km` : ''}
            </Text>
            <Text style={ui.subtle}>Atualizado {formatDateTime(trip.updatedAt)}</Text>
            <Text style={styles.sync}>
              {trip.syncState === 'sincronizado' ? 'Sincronizado' : 'Neste aparelho'}
            </Text>
          </Card>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  filters: { gap: 8, paddingRight: 16 },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.surfaceHover, borderColor: colors.borderStrong },
  chipText: { color: colors.muted, fontWeight: '800' },
  chipTextActive: { color: colors.text },
  title: { color: colors.text, fontSize: 17, fontWeight: '800' },
  sync: {
    alignSelf: 'flex-start',
    color: colors.subtle,
    fontSize: 11,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
})
