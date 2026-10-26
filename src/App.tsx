import { useEffect, useState } from 'react'
import { PwaManager } from './components/pwa/PwaManager'
import { Shell } from './components/Shell'
import { demoCredentials } from './data'
import { supabaseConfigured } from './lib/supabase'
import { AdminPage } from './pages/AdminPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterTripPage } from './pages/RegisterTripPage'
import { TripPage } from './pages/TripPage'
import { TripsPage } from './pages/TripsPage'
import { ensureDriverSeed } from './services/trips'
import { useStore } from './store'
import type { Screen } from './types'

const titles: Record<Screen['name'], string> = {
  hoje: 'Hoje',
  viagens: 'Meus registros',
  registrar: 'Registrar viagem',
  viagem: 'Viagem',
  perfil: 'Perfil',
  admin: 'Conferência',
}

export function App() {
  const { state, dispatch, toast, notify } = useStore()
  const [screen, setScreen] = useState<Screen>({ name: 'hoje' })
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    document.title = state.session.loggedIn
      ? `${titles[screen.name]} · Transportadora Braulio`
      : 'Entrar · Transportadora Braulio'
  }, [screen, state.session.loggedIn])

  const login = (matricula: string, senha: string) => {
    if (!matricula || !senha) {
      setLoginError('Informe a matrícula e a senha.')
      return
    }

    const motoristaOk =
      matricula === demoCredentials.motorista.matricula && senha === demoCredentials.motorista.senha
    const adminOk =
      matricula === demoCredentials.admin.matricula && senha === demoCredentials.admin.senha

    if (!motoristaOk && !adminOk) {
      setLoginError(
        supabaseConfigured
          ? 'Credenciais inválidas.'
          : 'Na demo local use 1042/rota (motorista) ou 9001/admin.',
      )
      return
    }

    const profile = adminOk ? demoCredentials.admin.profile : demoCredentials.motorista.profile
    if (profile.role === 'motorista') {
      const hasVehicles = state.vehicles.some((v) => v.driverId === profile.id)
      if (!hasVehicles) {
        ensureDriverSeed(profile).vehicles.forEach((vehicle) =>
          dispatch({ type: 'upsert-vehicle', vehicle }),
        )
      }
    }
    setLoginError('')
    dispatch({ type: 'login', profile })
    setScreen({ name: 'hoje' })
    notify(
      supabaseConfigured
        ? 'Sessão iniciada.'
        : 'Modo local: os registros ficam neste aparelho até configurar o Supabase.',
    )
  }

  if (!state.session.loggedIn) {
    return (
      <>
        <PwaManager />
        <LoginPage error={loginError} onSubmit={login} />
      </>
    )
  }

  const profile = state.session.profile!
  const shellActive =
    screen.name === 'viagem'
      ? screen.from === 'admin'
        ? 'admin'
        : screen.from === 'viagens'
          ? 'viagens'
          : 'hoje'
      : screen.name === 'registrar'
        ? 'hoje'
        : screen.name

  const openTrip = (id: string, from: 'hoje' | 'viagens' | 'admin') =>
    setScreen({ name: 'viagem', id, from })

  return (
    <>
      <PwaManager />
      <Shell
        title={screen.name === 'viagem' ? 'Viagem' : titles[screen.name]}
        active={shellActive}
        showBack={screen.name === 'viagem' || screen.name === 'registrar'}
        onBack={() => {
          if (screen.name === 'registrar') {
            setScreen({ name: 'hoje' })
            return
          }
          if (screen.name !== 'viagem') return
          if (screen.from === 'admin') setScreen({ name: 'admin' })
          else if (screen.from === 'viagens') setScreen({ name: 'viagens' })
          else setScreen({ name: 'hoje' })
        }}
        onNavigate={(next) => setScreen(next)}
        role={profile.role}
        toast={toast}
      >
        {screen.name === 'hoje' && (
          <HomePage
            onRegister={(id) => setScreen({ name: 'registrar', id })}
            onOpenTrip={(id) => openTrip(id, 'hoje')}
            onTrips={() => setScreen({ name: 'viagens' })}
            onAdmin={profile.role === 'admin' ? () => setScreen({ name: 'admin' }) : undefined}
          />
        )}

        {screen.name === 'registrar' && (
          <RegisterTripPage
            tripId={screen.id}
            onCancel={() => setScreen({ name: 'hoje' })}
            onSaved={(id) => openTrip(id, 'hoje')}
          />
        )}

        {screen.name === 'viagens' && (
          <TripsPage onOpen={(id) => openTrip(id, 'viagens')} />
        )}

        {screen.name === 'viagem' && (
          <TripPage
            tripId={screen.id}
            onEdit={() => setScreen({ name: 'registrar', id: screen.id })}
          />
        )}

        {screen.name === 'admin' && (
          <AdminPage onOpen={(id) => openTrip(id, 'admin')} />
        )}

        {screen.name === 'perfil' && (
          <ProfilePage
            onLogout={() => {
              dispatch({ type: 'logout' })
              setScreen({ name: 'hoje' })
            }}
          />
        )}
      </Shell>
    </>
  )
}
