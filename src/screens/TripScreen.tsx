import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button, Card, EmptyState, SectionTitle, StatusBadge, SummaryRow, ui } from '../components/NativeUi'
import { formatDateTime, formatMoney } from '../data'
import {
  attachmentsOf,
  canEditTrip,
  expenseTotal,
  expenseTotalsByCategory,
  expensesOf,
  pendingProofs,
  tripDistance,
} from '../logic'
import { useStore } from '../store'
import { colors } from '../theme'

const category: Record<string, string> = {
  combustivel: 'Combustível',
  pedagio: 'Pedágio',
  estacionamento: 'Estacionamento',
  manutencao: 'Manutenção',
  outros: 'Outros',
}

export function TripScreen({ tripId, onEdit }: { tripId: string; onEdit: () => void }) {
  const { state } = useStore()
  const trip = state.trips.find((item) => item.id === tripId)
  if (!trip) {
    return (
      <ScrollView contentContainerStyle={ui.content}>
        <EmptyState
          title="Registro não encontrado"
          message="Ele pode ter sido removido ou ainda não estar neste aparelho."
        />
      </ScrollView>
    )
  }
  const vehicle = state.vehicles.find((item) => item.id === trip.vehicleId)
  const expenses = expensesOf(state, tripId)
  const attachments = attachmentsOf(state, tripId)
  const totals = expenseTotalsByCategory(expenses)

  return (
    <ScrollView contentContainerStyle={ui.content}>
      <View style={ui.stack}>
        <Text style={ui.eyebrow}>Consulta</Text>
        <View style={ui.between}>
          <Text style={ui.pageTitle}>{trip.tripDate}</Text>
          <StatusBadge status={trip.status} />
        </View>
        <Text style={ui.muted}>
          {vehicle ? `${vehicle.plate} · ${vehicle.model}` : 'Veículo não encontrado'}
        </Text>
        <Text style={styles.sync}>
          {trip.syncState === 'sincronizado' ? 'Sincronizado com o servidor' : 'Salvo neste aparelho'}
        </Text>
        {trip.correctionNotes ? (
          <Text style={ui.errorBox}>Correção solicitada: {trip.correctionNotes}</Text>
        ) : null}
      </View>

      <Card>
        <SummaryRow label="KM inicial" value={trip.kmStart ?? '—'} />
        <SummaryRow label="KM final" value={trip.kmEnd ?? '—'} />
        <SummaryRow
          label="Distância"
          value={tripDistance(trip) == null ? '—' : `${tripDistance(trip)} km`}
        />
        <SummaryRow label="Total de gastos" value={formatMoney(expenseTotal(expenses))} />
        <SummaryRow label="Comprovantes pendentes" value={pendingProofs(expenses, attachments)} />
      </Card>

      {trip.relato ? (
        <Card>
          <SectionTitle>Relato</SectionTitle>
          <Text style={ui.body}>{trip.relato}</Text>
        </Card>
      ) : null}

      <Card>
        <SectionTitle>Gastos</SectionTitle>
        {expenses.length === 0 ? <Text style={ui.muted}>Nenhum gasto neste registro.</Text> : null}
        {Object.entries(totals).map(([name, value]) => (
          <SummaryRow key={name} label={category[name] ?? name} value={formatMoney(value)} />
        ))}
        {expenses.map((expense) => (
          <View key={expense.id} style={styles.item}>
            <Text style={styles.itemTitle}>
              {category[expense.category]} · {formatMoney(expense.amount)}
            </Text>
            <Text style={ui.subtle}>
              {expense.expenseDate} ·{' '}
              {expense.proofPending || !expense.proofDataUrl ? 'comprovante pendente' : 'comprovante ok'}
            </Text>
            {expense.proofDataUrl ? (
              <Image source={{ uri: expense.proofDataUrl }} style={ui.image} />
            ) : null}
          </View>
        ))}
      </Card>

      <Card>
        <SectionTitle>Anexos</SectionTitle>
        {attachments.length === 0 ? <Text style={ui.muted}>Nenhum arquivo anexado.</Text> : null}
        {attachments.map((attachment) => (
          <View key={attachment.id} style={styles.item}>
            <Text style={styles.itemTitle}>{attachment.description || 'Arquivo'}</Text>
            <Text style={ui.subtle}>
              {attachment.proofPending || !attachment.proofDataUrl ? 'Pendente' : 'Anexado'} ·{' '}
              {formatDateTime(attachment.createdAt)}
            </Text>
            {attachment.proofDataUrl ? (
              <Image source={{ uri: attachment.proofDataUrl }} style={ui.image} />
            ) : null}
          </View>
        ))}
      </Card>

      {canEditTrip(trip) ? <Button title="Continuar preenchendo" onPress={onEdit} /> : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  sync: {
    alignSelf: 'flex-start',
    color: colors.subtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: '700',
  },
  item: {
    gap: 5,
    paddingTop: 11,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  itemTitle: { color: colors.text, fontWeight: '800' },
})
