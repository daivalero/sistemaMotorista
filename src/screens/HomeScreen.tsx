import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { ChevronRight, ClipboardCheck, FilePlus2, Route } from 'lucide-react-native'
import { Card, StatusBadge, ui } from '../components/NativeUi'
import { formatLongDate, formatMoney } from '../data'
import { expenseTotal, expensesOf } from '../logic'
import { useStore } from '../store'
import { colors } from '../theme'
import type { Screen } from '../types'

export function HomeScreen({ navigate }: { navigate: (screen: Screen) => void }) {
  const { state } = useStore()
  const profile = state.session.profile
  if (!profile) return null

  const trips = state.trips
    .filter((trip) => profile.role === 'admin' || trip.driverId === profile.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const drafts = trips.filter((trip) => ['rascunho', 'em_andamento'].includes(trip.status))
  const awaiting = trips.filter((trip) => trip.status === 'aguardando_conferencia').length

  return (
    <ScrollView contentContainerStyle={ui.content}>
      <View>
        <Text style={ui.muted}>Olá,</Text>
        <Text style={ui.pageTitle}>{profile.nome}</Text>
        <Text style={ui.subtle}>
          {formatLongDate(new Date().toISOString())} ·{' '}
          {profile.role === 'admin' ? 'Administração' : 'Motorista agregado'}
        </Text>
      </View>

      <Card onPress={() => navigate({ name: 'registrar' })} style={styles.hero}>
        <View style={ui.between}>
          <View style={styles.heroIcon}>
            <FilePlus2 size={24} color={colors.accent} />
          </View>
          <ChevronRight size={20} color={colors.subtle} />
        </View>
        <View>
          <Text style={ui.eyebrow}>Registro rápido</Text>
          <Text style={styles.heroTitle}>Registrar viagem</Text>
          <Text style={ui.muted}>
            Data, KM, relato, gastos e comprovantes em um único formulário.
          </Text>
        </View>
      </Card>

      <View style={styles.actions}>
        <Card onPress={() => navigate({ name: 'viagens' })} style={styles.action}>
          <Route size={21} color={colors.accent} />
          <Text style={styles.actionTitle}>Meus registros</Text>
          <Text style={ui.subtle}>{trips.length} no histórico</Text>
        </Card>
        <Card onPress={() => navigate({ name: 'registrar' })} style={styles.action}>
          <FilePlus2 size={21} color={colors.accent} />
          <Text style={styles.actionTitle}>Nova viagem</Text>
          <Text style={ui.subtle}>Formulário simples</Text>
        </Card>
        {profile.role === 'admin' ? (
          <Card onPress={() => navigate({ name: 'admin' })} style={styles.action}>
            <ClipboardCheck size={21} color={colors.accent} />
            <Text style={styles.actionTitle}>Conferência</Text>
            <Text style={ui.subtle}>{awaiting} aguardando</Text>
          </Card>
        ) : null}
      </View>

      {drafts.length ? (
        <View style={ui.stack}>
          <Text style={ui.eyebrow}>Continuar rascunho</Text>
          {drafts.slice(0, 3).map((trip) => (
            <Card key={trip.id} onPress={() => navigate({ name: 'registrar', id: trip.id })}>
              <View style={ui.between}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{trip.tripDate}</Text>
                  <Text style={ui.subtle}>
                    {expensesOf(state, trip.id).length} gastos ·{' '}
                    {formatMoney(expenseTotal(expensesOf(state, trip.id)))}
                  </Text>
                </View>
                <StatusBadge status={trip.status} />
              </View>
            </Card>
          ))}
        </View>
      ) : null}

      {trips.length ? (
        <View style={ui.stack}>
          <Text style={ui.eyebrow}>Recentes</Text>
          {trips.slice(0, 5).map((trip) => (
            <Card
              key={trip.id}
              onPress={() => navigate({ name: 'viagem', id: trip.id, from: 'hoje' })}
            >
              <View style={ui.between}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{trip.tripDate}</Text>
                  <Text style={ui.subtle}>
                    {trip.distanceKm != null ? `${trip.distanceKm} km` : 'KM pendente'}
                  </Text>
                </View>
                <StatusBadge status={trip.status} />
              </View>
            </Card>
          ))}
        </View>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  hero: { minHeight: 178, justifyContent: 'space-between' },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  heroTitle: { color: colors.text, fontWeight: '900', fontSize: 21, marginVertical: 5 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  action: { width: '48%', minHeight: 116, justifyContent: 'space-between' },
  actionTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  itemTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 3 },
})
