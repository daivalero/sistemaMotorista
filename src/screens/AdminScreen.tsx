import { useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button, Card, EmptyState, Field, SectionTitle, StatusBadge, ui } from '../components/NativeUi'
import { formatDateTime, formatMoney } from '../data'
import { attachmentsOf, expenseTotal, expensesOf } from '../logic'
import { approveTrip, requestTripCorrection } from '../services/trips'
import { useStore } from '../store'
import { colors } from '../theme'
import type { Expense, Screen } from '../types'

type ReasonTarget = { type: 'trip'; id: string } | { type: 'expense'; id: string }

export function AdminScreen({ navigate }: { navigate: (screen: Screen) => void }) {
  const { state, dispatch, notify } = useStore()
  const profile = state.session.profile
  const queue = useMemo(
    () =>
      state.trips
        .filter((trip) => ['aguardando_conferencia', 'precisa_correcao'].includes(trip.status))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [state.trips],
  )
  const [selectedId, setSelectedId] = useState<string>()
  const [reasonTarget, setReasonTarget] = useState<ReasonTarget | null>(null)
  const [reason, setReason] = useState('')
  const selected = state.trips.find((trip) => trip.id === (selectedId ?? queue[0]?.id))

  if (!profile || profile.role !== 'admin') {
    return (
      <ScrollView contentContainerStyle={ui.content}>
        <EmptyState title="Acesso restrito" message="Apenas administradores conferem registros." />
      </ScrollView>
    )
  }

  const expenses = selected ? expensesOf(state, selected.id) : []
  const attachments = selected ? attachmentsOf(state, selected.id) : []
  const events = selected
    ? state.events
        .filter((event) => event.tripId === selected.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : []

  const reviewExpense = (expense: Expense, reviewStatus: Expense['reviewStatus'], notes?: string) => {
    dispatch({
      type: 'upsert-expense',
      expense: {
        ...expense,
        reviewStatus,
        reviewNotes: notes?.trim() || undefined,
        updatedAt: new Date().toISOString(),
      },
    })
    notify(reviewStatus === 'aprovada' ? 'Despesa aprovada.' : 'Despesa rejeitada.')
  }

  const submitReason = () => {
    if (!reasonTarget || !reason.trim()) return
    if (reasonTarget.type === 'trip') {
      const trip = state.trips.find((item) => item.id === reasonTarget.id)
      if (trip) {
        const result = requestTripCorrection(trip, profile.id, reason)
        dispatch({ type: 'upsert-trip', trip: result.trip })
        dispatch({ type: 'add-event', event: result.event })
        notify('Registro devolvido para correção.')
      }
    } else {
      const expense = state.expenses.find((item) => item.id === reasonTarget.id)
      if (expense) reviewExpense(expense, 'rejeitada', reason)
    }
    setReason('')
    setReasonTarget(null)
  }

  return (
    <>
      <ScrollView contentContainerStyle={ui.content}>
        <View>
          <Text style={ui.eyebrow}>Administração</Text>
          <Text style={ui.pageTitle}>Conferência</Text>
          <Text style={ui.muted}>Aprovação da viagem e das despesas são independentes.</Text>
        </View>

        <Card>
          <SectionTitle>Fila</SectionTitle>
          {queue.length === 0 ? <Text style={ui.muted}>Nenhum registro aguardando.</Text> : null}
          {queue.map((trip) => (
            <Pressable
              key={trip.id}
              onPress={() => setSelectedId(trip.id)}
              style={[styles.queue, selected?.id === trip.id && styles.queueActive]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{trip.tripDate}</Text>
                <Text style={ui.subtle}>{formatMoney(expenseTotal(expensesOf(state, trip.id)))}</Text>
              </View>
              <StatusBadge status={trip.status} />
            </Pressable>
          ))}
        </Card>

        {selected ? (
          <Card>
            <View style={ui.between}>
              <SectionTitle>Detalhe</SectionTitle>
              <Pressable
                onPress={() =>
                  navigate({ name: 'viagem', id: selected.id, from: 'admin' })
                }
              >
                <Text style={styles.link}>Abrir registro</Text>
              </Pressable>
            </View>
            <Text style={ui.body}>
              {selected.tripDate} · KM {selected.kmStart ?? '—'} → {selected.kmEnd ?? '—'}
            </Text>
            {selected.relato ? <Text style={ui.muted}>{selected.relato}</Text> : null}
            <Text style={ui.muted}>
              Despesas: {formatMoney(expenseTotal(expenses))} · Anexos: {attachments.length}
            </Text>

            <SectionTitle>Despesas</SectionTitle>
            {expenses.length === 0 ? <Text style={ui.muted}>Nenhuma despesa.</Text> : null}
            {expenses.map((expense) => (
              <View key={expense.id} style={styles.expense}>
                <View>
                  <Text style={styles.itemTitle}>
                    {expense.category} · {formatMoney(expense.amount)}
                  </Text>
                  <Text style={ui.subtle}>
                    {expense.reviewStatus}
                    {expense.proofPending || !expense.proofDataUrl ? ' · comprovante pendente' : ''}
                  </Text>
                </View>
                <View style={styles.actions}>
                  <Button
                    title="Aprovar"
                    variant="secondary"
                    onPress={() => reviewExpense(expense, 'aprovada')}
                  />
                  <Button
                    title="Rejeitar"
                    variant="danger"
                    onPress={() => setReasonTarget({ type: 'expense', id: expense.id })}
                  />
                </View>
              </View>
            ))}

            <SectionTitle>Histórico</SectionTitle>
            {events.map((event) => (
              <Text key={event.id} style={ui.subtle}>
                {formatDateTime(event.createdAt)} · {event.action}
                {event.detail ? ` — ${event.detail}` : ''}
              </Text>
            ))}
            <Button
              title="Aprovar viagem"
              onPress={() => {
                const result = approveTrip(selected, profile.id)
                dispatch({ type: 'upsert-trip', trip: result.trip })
                dispatch({ type: 'add-event', event: result.event })
                notify('Viagem aprovada.')
              }}
            />
            <Button
              title="Solicitar correção"
              variant="secondary"
              onPress={() => setReasonTarget({ type: 'trip', id: selected.id })}
            />
          </Card>
        ) : null}
      </ScrollView>

      <Modal visible={Boolean(reasonTarget)} transparent animationType="fade" onRequestClose={() => setReasonTarget(null)}>
        <View style={styles.backdrop}>
          <Card style={styles.modal}>
            <SectionTitle>
              {reasonTarget?.type === 'trip' ? 'Solicitar correção' : 'Rejeitar despesa'}
            </SectionTitle>
            <Field
              label="Motivo"
              value={reason}
              onChangeText={setReason}
              multiline
              autoFocus
            />
            <Button title="Confirmar" disabled={!reason.trim()} onPress={submitReason} />
            <Button title="Cancelar" variant="text" onPress={() => setReasonTarget(null)} />
          </Card>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  queue: {
    minHeight: 58,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  queueActive: { backgroundColor: colors.elevated },
  itemTitle: { color: colors.text, fontWeight: '800' },
  link: { color: colors.accent, fontWeight: '800' },
  expense: { gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  actions: { flexDirection: 'row', gap: 8 },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  modal: { width: '100%' },
})
