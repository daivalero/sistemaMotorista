import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { ArrowLeft, ClipboardCheck, Home, Route, UserRound } from 'lucide-react-native'
import { AdminScreen } from './src/screens/AdminScreen'
import { HomeScreen } from './src/screens/HomeScreen'
import { LoginScreen } from './src/screens/LoginScreen'
import { ProfileScreen } from './src/screens/ProfileScreen'
import { RegisterTripScreen } from './src/screens/RegisterTripScreen'
import { TripScreen } from './src/screens/TripScreen'
import { TripsScreen } from './src/screens/TripsScreen'
import { StoreProvider, useStore } from './src/store'
import { colors } from './src/theme'
import type { Screen } from './src/types'

function NativeApp() {
  const { state, toast, hydrated } = useStore()
  const [screen, setScreen] = useState<Screen>({ name: 'hoje' })
  const profile = state.session.profile

  useEffect(() => {
    if (!state.session.loggedIn) setScreen({ name: 'hoje' })
  }, [state.session.loggedIn])

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Carregando dados do aparelho…</Text>
      </View>
    )
  }
  if (!state.session.loggedIn || !profile) return <LoginScreen />

  const showBack = screen.name === 'registrar' || screen.name === 'viagem'
  const goBack = () => {
    if (screen.name === 'registrar') return setScreen({ name: 'hoje' })
    if (screen.name !== 'viagem') return
    if (screen.from === 'admin') setScreen({ name: 'admin' })
    else if (screen.from === 'viagens') setScreen({ name: 'viagens' })
    else setScreen({ name: 'hoje' })
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.app}>
        <View style={styles.header}>
          {showBack ? (
            <Pressable accessibilityLabel="Voltar" onPress={goBack} style={styles.headerButton}>
              <ArrowLeft size={23} color={colors.text} />
            </Pressable>
          ) : screen.name === 'hoje' ? (
            <Image
              source={require('./assets/brand/braulio-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.headerTitle}>{titleOf(screen.name)}</Text>
          )}
          {!showBack && screen.name === 'hoje' ? (
            <Pressable onPress={() => setScreen({ name: 'perfil' })} style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(profile.nome)}</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.body}>
          {toast ? (
            <View style={styles.toast}>
              <Text style={styles.toastText}>{toast}</Text>
            </View>
          ) : null}
          {screen.name === 'hoje' ? <HomeScreen navigate={setScreen} /> : null}
          {screen.name === 'viagens' ? <TripsScreen navigate={setScreen} /> : null}
          {screen.name === 'perfil' ? <ProfileScreen /> : null}
          {screen.name === 'admin' ? <AdminScreen navigate={setScreen} /> : null}
          {screen.name === 'registrar' ? (
            <RegisterTripScreen
              tripId={screen.id}
              onCancel={() => setScreen({ name: 'hoje' })}
              onSaved={(id) => setScreen({ name: 'viagem', id, from: 'hoje' })}
            />
          ) : null}
          {screen.name === 'viagem' ? (
            <TripScreen
              tripId={screen.id}
              onEdit={() => setScreen({ name: 'registrar', id: screen.id })}
            />
          ) : null}
        </View>

        {!showBack ? (
          <View style={styles.tabs}>
            <Tab
              label="Hoje"
              active={screen.name === 'hoje'}
              icon={Home}
              onPress={() => setScreen({ name: 'hoje' })}
            />
            <Tab
              label="Viagens"
              active={screen.name === 'viagens'}
              icon={Route}
              onPress={() => setScreen({ name: 'viagens' })}
            />
            {profile.role === 'admin' ? (
              <Tab
                label="Conferir"
                active={screen.name === 'admin'}
                icon={ClipboardCheck}
                onPress={() => setScreen({ name: 'admin' })}
              />
            ) : null}
            <Tab
              label="Perfil"
              active={screen.name === 'perfil'}
              icon={UserRound}
              onPress={() => setScreen({ name: 'perfil' })}
            />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  )
}

type IconComponent = typeof Home

function Tab({
  label,
  active,
  icon: Icon,
  onPress,
}: {
  label: string
  active: boolean
  icon: IconComponent
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={styles.tab}
    >
      <Icon size={21} color={active ? colors.accent : colors.subtle} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  )
}

function titleOf(name: Screen['name']) {
  const labels: Record<Screen['name'], string> = {
    hoje: 'Hoje',
    viagens: 'Meus registros',
    registrar: 'Registrar viagem',
    viagem: 'Viagem',
    perfil: 'Perfil',
    admin: 'Conferência',
  }
  return labels[name]
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export default function App() {
  return (
    <StoreProvider>
      <StatusBar style="light" />
      <NativeApp />
    </StoreProvider>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight : 0,
    backgroundColor: colors.background,
  },
  app: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: colors.background,
  },
  loadingText: { color: colors.muted, fontWeight: '700' },
  header: {
    minHeight: 58,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  logo: { width: 170, height: 42 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarText: { color: colors.text, fontWeight: '900' },
  toast: {
    position: 'absolute',
    top: 8,
    left: 16,
    right: 16,
    zIndex: 20,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceHover,
  },
  toastText: { color: colors.text, fontWeight: '700' },
  tabs: {
    minHeight: 70,
    paddingBottom: Platform.OS === 'android' ? 8 : 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  tab: { flex: 1, minHeight: 60, alignItems: 'center', justifyContent: 'center', gap: 5 },
  tabLabel: { color: colors.subtle, fontSize: 11, fontWeight: '800' },
  tabLabelActive: { color: colors.text },
})
