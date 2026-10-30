import { useMemo, useState } from 'react'
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Camera, Plus, Trash2 } from 'lucide-react-native'
import { Button, Card, Field, SectionTitle, SummaryRow, ui } from '../components/NativeUi'
import { formatMoney } from '../data'
import { attachmentsOf, canEditTrip, expensesOf } from '../logic'
import { createId } from '../lib/id'
import {
  attachmentFromForm,
  buildTripFromForm,
  expenseFromForm,
  imageToDataUrl,
  newFormKey,
  type TripFormAttachment,
  type TripFormExpense,
} from '../services/trips'
import { useStore } from '../store'
import { colors } from '../theme'
import type { ExpenseCategory } from '../types'

const categories: { id: ExpenseCategory; label: string }[] = [
  { id: 'combustivel', label: 'Combustível' },
  { id: 'pedagio', label: 'Pedágio' },
  { id: 'estacionamento', label: 'Estacionamento' },
  { id: 'manutencao', label: 'Manutenção' },
  { id: 'outros', label: 'Outros' },
]

function emptyExpense(): TripFormExpense {
  return {
    localKey: newFormKey('exprow'),
    clientRequestId: createId('req'),
    category: 'combustivel',
    amount: '',
    expenseDate: new Date().toISOString().slice(0, 10),
    notes: '',
    proofPending: false,
  }
}

function emptyAttachment(): TripFormAttachment {
  return {
    localKey: newFormKey('attrow'),
    clientRequestId: createId('req'),
    description: '',
    proofPending: false,
  }
}

async function takePhoto() {
  const permission = await ImagePicker.requestCameraPermissionsAsync()
  if (!permission.granted) throw new Error('Permita o acesso à câmera para anexar a foto.')
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.65,
    base64: true,
  })
  return result.canceled ? null : imageToDataUrl(result.assets[0])
}

export function RegisterTripScreen({
  tripId,
  onCancel,
  onSaved,
}: {
  tripId?: string
  onCancel: () => void
  onSaved: (id: string) => void
}) {
  const { state, dispatch, notify } = useStore()
  const profile = state.session.profile
  const existing = tripId ? state.trips.find((trip) => trip.id === tripId) : undefined
  const vehicles = useMemo(
    () => state.vehicles.filter((vehicle) => vehicle.driverId === profile?.id && vehicle.active),
    [profile?.id, state.vehicles],
  )
  const [requestId] = useState(existing?.clientRequestId ?? createId('req'))
  const [tripDate, setTripDate] = useState(
    existing?.tripDate ?? new Date().toISOString().slice(0, 10),
  )
  const [vehicleId, setVehicleId] = useState(existing?.vehicleId ?? vehicles[0]?.id ?? '')
  const [kmStart, setKmStart] = useState(existing?.kmStart == null ? '' : String(existing.kmStart))
  const [kmEnd, setKmEnd] = useState(existing?.kmEnd == null ? '' : String(existing.kmEnd))
  const [relato, setRelato] = useState(existing?.relato ?? '')
  const [expenses, setExpenses] = useState<TripFormExpense[]>(() =>
    existing
      ? expensesOf(state, existing.id).map((item) => ({
          localKey: item.id,
          id: item.id,
          clientRequestId: item.clientRequestId,
          category: item.category,
          amount: String(item.amount),
          expenseDate: item.expenseDate,
          notes: item.notes ?? '',
          proofDataUrl: item.proofDataUrl,
          proofPending: item.proofPending,
        }))
      : [],
  )
  const [attachments, setAttachments] = useState<TripFormAttachment[]>(() =>
    existing
      ? attachmentsOf(state, existing.id).map((item) => ({
          localKey: item.id,
          id: item.id,
          clientRequestId: item.clientRequestId,
          description: item.description ?? '',
          proofDataUrl: item.proofDataUrl,
          proofPending: item.proofPending,
        }))
      : [],
  )
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (!profile) return null
  const locked = existing ? !canEditTrip(existing) : false
  const total = expenses.reduce((sum, row) => {
    const value = Number(row.amount.replace(',', '.'))
    return sum + (Number.isFinite(value) ? value : 0)
  }, 0)
  const startValue = Number(kmStart.replace(',', '.'))
  const endValue = Number(kmEnd.replace(',', '.'))
  const distance =
    kmStart && kmEnd && Number.isFinite(startValue) && Number.isFinite(endValue)
      ? Math.max(0, Number((endValue - startValue).toFixed(1)))
      : null

  const save = (draft: boolean) => {
    if (locked || busy) return
    setError('')
    if (!vehicleId) return setError('Selecione o veículo.')
    if (!tripDate) return setError('Informe a data da viagem.')
    const start = kmStart === '' ? undefined : startValue
    const end = kmEnd === '' ? undefined : endValue
    if (!draft && (start == null || !Number.isFinite(start) || start < 0))
      return setError('Informe uma quilometragem inicial válida.')
    if (!draft && (end == null || !Number.isFinite(end) || end < 0))
      return setError('Informe uma quilometragem final válida.')
    if (start != null && end != null && end < start)
      return setError('A quilometragem final não pode ser menor que a inicial.')
    if (
      !draft &&
      expenses.some((row) => !Number.isFinite(Number(row.amount.replace(',', '.'))))
    )
      return setError('Há gasto com valor inválido.')

    setBusy(true)
    try {
      const { trip, event } = buildTripFromForm({
        existing,
        driverId: profile.id,
        vehicleId,
        tripDate,
        kmStart: start,
        kmEnd: end,
        relato,
        status: draft ? 'rascunho' : 'aguardando_conferencia',
        clientRequestId: requestId,
      })
      dispatch({ type: 'upsert-trip', trip })
      dispatch({ type: 'add-event', event })

      const expenseRequests = new Set(expenses.map((item) => item.clientRequestId))
      state.expenses
        .filter((item) => item.tripId === trip.id && !expenseRequests.has(item.clientRequestId))
        .forEach((item) => dispatch({ type: 'remove-expense', id: item.id }))
      const attachmentRequests = new Set(attachments.map((item) => item.clientRequestId))
      state.attachments
        .filter((item) => item.tripId === trip.id && !attachmentRequests.has(item.clientRequestId))
        .forEach((item) => dispatch({ type: 'remove-attachment', id: item.id }))

      expenses.forEach((row) => {
        if (!row.amount && !row.notes && !row.proofDataUrl) return
        dispatch({ type: 'upsert-expense', expense: expenseFromForm(trip.id, row) })
      })
      attachments.forEach((row) => {
        if (!row.description && !row.proofDataUrl && !row.proofPending) return
        dispatch({ type: 'upsert-attachment', attachment: attachmentFromForm(trip.id, row) })
      })
      notify(draft ? 'Rascunho salvo neste aparelho.' : 'Registro salvo neste aparelho.')
      onSaved(trip.id)
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={ui.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={ui.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View>
          <Text style={ui.eyebrow}>Registro</Text>
          <Text style={ui.pageTitle}>Registrar viagem</Text>
          <Text style={ui.muted}>Preencha o que tiver. Você pode salvar como rascunho.</Text>
        </View>

        <Card>
          <SectionTitle>Informações da viagem</SectionTitle>
          <Field
            label="Data (AAAA-MM-DD)"
            value={tripDate}
            onChangeText={setTripDate}
            editable={!locked}
            keyboardType="numbers-and-punctuation"
          />
          <Field label="Motorista" value={profile.nome} editable={false} />
          <Text style={styles.label}>Veículo</Text>
          <View style={styles.options}>
            {vehicles.map((vehicle) => (
              <Pressable
                key={vehicle.id}
                disabled={locked}
                onPress={() => setVehicleId(vehicle.id)}
                style={[styles.option, vehicleId === vehicle.id && styles.optionActive]}
              >
                <Text style={styles.optionTitle}>{vehicle.plate}</Text>
                <Text style={ui.subtle}>{vehicle.model}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.two}>
            <View style={{ flex: 1 }}>
              <Field
                label="KM inicial"
                value={kmStart}
                onChangeText={setKmStart}
                editable={!locked}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="KM final"
                value={kmEnd}
                onChangeText={setKmEnd}
                editable={!locked}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          {distance != null ? <Text style={ui.subtle}>Distância: {distance} km</Text> : null}
          <Field
            label="Relato da viagem"
            value={relato}
            onChangeText={setRelato}
            editable={!locked}
            multiline
            placeholder="Entregas, ocorrências e informações relevantes"
          />
        </Card>

        <Card>
          <View style={ui.between}>
            <SectionTitle>Gastos</SectionTitle>
            {!locked ? (
              <Pressable style={ui.row} onPress={() => setExpenses((rows) => [...rows, emptyExpense()])}>
                <Plus size={18} color={colors.accent} />
                <Text style={styles.link}>Adicionar</Text>
              </Pressable>
            ) : null}
          </View>
          {expenses.length === 0 ? <Text style={ui.muted}>Nenhum gasto informado.</Text> : null}
          {expenses.map((row, index) => (
            <View key={row.localKey} style={styles.nested}>
              <View style={ui.between}>
                <Text style={styles.nestedTitle}>Gasto {index + 1}</Text>
                {!locked ? (
                  <Pressable
                    onPress={() =>
                      setExpenses((rows) => rows.filter((item) => item.localKey !== row.localKey))
                    }
                  >
                    <Trash2 size={18} color={colors.red} />
                  </Pressable>
                ) : null}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryRow}>
                  {categories.map((category) => (
                    <Pressable
                      key={category.id}
                      disabled={locked}
                      onPress={() =>
                        setExpenses((rows) =>
                          rows.map((item) =>
                            item.localKey === row.localKey
                              ? { ...item, category: category.id }
                              : item,
                          ),
                        )
                      }
                      style={[
                        styles.category,
                        row.category === category.id && styles.categoryActive,
                      ]}
                    >
                      <Text style={styles.categoryText}>{category.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              <Field
                label="Valor (R$)"
                value={row.amount}
                editable={!locked}
                keyboardType="decimal-pad"
                onChangeText={(amount) =>
                  setExpenses((rows) =>
                    rows.map((item) => (item.localKey === row.localKey ? { ...item, amount } : item)),
                  )
                }
              />
              <Field
                label="Data (AAAA-MM-DD)"
                value={row.expenseDate}
                editable={!locked}
                onChangeText={(expenseDate) =>
                  setExpenses((rows) =>
                    rows.map((item) =>
                      item.localKey === row.localKey ? { ...item, expenseDate } : item,
                    ),
                  )
                }
              />
              <Field
                label="Descrição"
                value={row.notes}
                editable={!locked}
                onChangeText={(notes) =>
                  setExpenses((rows) =>
                    rows.map((item) => (item.localKey === row.localKey ? { ...item, notes } : item)),
                  )
                }
              />
              {!locked ? (
                <Button
                  title="Fotografar comprovante"
                  icon={Camera}
                  variant="secondary"
                  onPress={() =>
                    void takePhoto()
                      .then((proofDataUrl) => {
                        if (!proofDataUrl) return
                        setExpenses((rows) =>
                          rows.map((item) =>
                            item.localKey === row.localKey
                              ? { ...item, proofDataUrl, proofPending: false }
                              : item,
                          ),
                        )
                      })
                      .catch((reason: unknown) =>
                        setError(reason instanceof Error ? reason.message : 'Falha ao abrir câmera.'),
                      )
                  }
                />
              ) : null}
              {row.proofDataUrl ? <Image source={{ uri: row.proofDataUrl }} style={ui.image} /> : null}
              <View style={ui.between}>
                <Text style={ui.muted}>Comprovante pendente</Text>
                <Switch
                  disabled={locked}
                  value={row.proofPending}
                  onValueChange={(proofPending) =>
                    setExpenses((rows) =>
                      rows.map((item) =>
                        item.localKey === row.localKey ? { ...item, proofPending } : item,
                      ),
                    )
                  }
                  trackColor={{ true: colors.accent }}
                />
              </View>
            </View>
          ))}
        </Card>

        <Card>
          <View style={ui.between}>
            <SectionTitle>Comprovantes e entregas</SectionTitle>
            {!locked ? (
              <Pressable
                style={ui.row}
                onPress={() => setAttachments((rows) => [...rows, emptyAttachment()])}
              >
                <Plus size={18} color={colors.accent} />
                <Text style={styles.link}>Adicionar</Text>
              </Pressable>
            ) : null}
          </View>
          {attachments.length === 0 ? <Text style={ui.muted}>Nenhum anexo.</Text> : null}
          {attachments.map((row, index) => (
            <View key={row.localKey} style={styles.nested}>
              <View style={ui.between}>
                <Text style={styles.nestedTitle}>Arquivo {index + 1}</Text>
                {!locked ? (
                  <Pressable
                    onPress={() =>
                      setAttachments((rows) =>
                        rows.filter((item) => item.localKey !== row.localKey),
                      )
                    }
                  >
                    <Trash2 size={18} color={colors.red} />
                  </Pressable>
                ) : null}
              </View>
              <Field
                label="Descrição"
                value={row.description}
                editable={!locked}
                onChangeText={(description) =>
                  setAttachments((rows) =>
                    rows.map((item) =>
                      item.localKey === row.localKey ? { ...item, description } : item,
                    ),
                  )
                }
              />
              {!locked ? (
                <Button
                  title="Tirar foto"
                  icon={Camera}
                  variant="secondary"
                  onPress={() =>
                    void takePhoto()
                      .then((proofDataUrl) => {
                        if (!proofDataUrl) return
                        setAttachments((rows) =>
                          rows.map((item) =>
                            item.localKey === row.localKey
                              ? { ...item, proofDataUrl, proofPending: false }
                              : item,
                          ),
                        )
                      })
                      .catch((reason: unknown) =>
                        setError(reason instanceof Error ? reason.message : 'Falha ao abrir câmera.'),
                      )
                  }
                />
              ) : null}
              {row.proofDataUrl ? <Image source={{ uri: row.proofDataUrl }} style={ui.image} /> : null}
            </View>
          ))}
        </Card>

        <Card>
          <SectionTitle>Resumo</SectionTitle>
          <SummaryRow label="Data" value={tripDate || '—'} />
          <SummaryRow label="Gastos" value={`${expenses.length} · ${formatMoney(total)}`} />
          <SummaryRow label="Anexos" value={attachments.length} />
          <SummaryRow label="Distância" value={distance == null ? '—' : `${distance} km`} />
          {error ? <Text style={ui.errorBox}>{error}</Text> : null}
          {!locked ? (
            <>
              <Button title="Salvar registro" loading={busy} onPress={() => save(false)} />
              <Button
                title="Salvar rascunho"
                variant="secondary"
                disabled={busy}
                onPress={() => save(true)}
              />
            </>
          ) : null}
          <Button title={locked ? 'Voltar' : 'Cancelar'} variant="text" onPress={onCancel} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  label: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  options: { gap: 8 },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.elevated,
    padding: 12,
  },
  optionActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  optionTitle: { color: colors.text, fontWeight: '900' },
  two: { flexDirection: 'row', gap: 10 },
  link: { color: colors.accent, fontWeight: '800' },
  nested: {
    gap: 11,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.elevated,
  },
  nestedTitle: { color: colors.text, fontWeight: '900' },
  categoryRow: { flexDirection: 'row', gap: 7, paddingRight: 12 },
  category: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  categoryActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  categoryText: { color: colors.text, fontSize: 12, fontWeight: '700' },
})
