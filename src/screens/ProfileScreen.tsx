import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button, Card, SectionTitle, ui } from '../components/NativeUi'
import { supabaseConfigured } from '../lib/supabase'
import { useStore } from '../store'
import { colors } from '../theme'

export function ProfileScreen() {
  const { state, dispatch, notify } = useStore()
  const profile = state.session.profile
  if (!profile) return null
  const vehicles = state.vehicles.filter((vehicle) => vehicle.driverId === profile.id)
  const initials = profile.nome
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <ScrollView contentContainerStyle={ui.content}>
      <Card style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ui.title}>{profile.nome}</Text>
          <Text style={ui.muted}>
            Matrícula {profile.matricula} · {profile.role}
          </Text>
          {profile.telefone ? <Text style={ui.body}>{profile.telefone}</Text> : null}
        </View>
      </Card>

      {vehicles.length ? (
        <Card>
          <SectionTitle>Veículos associados</SectionTitle>
          {vehicles.map((vehicle) => (
            <View key={vehicle.id} style={styles.vehicle}>
              <Text style={styles.plate}>{vehicle.plate}</Text>
              <Text style={ui.muted}>
                {vehicle.model}
                {vehicle.year ? ` · ${vehicle.year}` : ''}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      <Card>
        <SectionTitle>Persistência</SectionTitle>
        <Text style={ui.muted}>
          {supabaseConfigured
            ? 'Supabase configurado. A sessão pode persistir com segurança no dispositivo.'
            : 'Os registros são armazenados localmente neste aparelho e funcionam offline.'}
        </Text>
      </Card>
      <Button
        title="Sair"
        variant="secondary"
        onPress={() => {
          dispatch({ type: 'logout' })
          notify('Sessão encerrada.')
        }}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  initials: { color: colors.text, fontSize: 20, fontWeight: '900' },
  vehicle: { paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  plate: { color: colors.text, fontWeight: '900', marginBottom: 3 },
})
