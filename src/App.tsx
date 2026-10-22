import { useEffect, useState } from 'react'
import { OccurrenceSheet } from './components/OccurrenceSheet'
import { PwaManager } from './components/pwa/PwaManager'
import { Shell } from './components/Shell'
import { driver } from './data'
import { LoginPage } from './pages/LoginPage'
import { ChecklistPage } from './pages/ChecklistPage'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { TripPage } from './pages/TripPage'
import { TripsPage } from './pages/TripsPage'
import { useStore } from './store'
import type { Screen } from './types'

const titles: Record<Screen['name'], string> = {
  hoje: 'Hoje',
  viagens: 'Viagens',
  checklist: 'Checklist',
  perfil: 'Perfil',
  viagem: 'Viagem',
}

export function App() {
  const { state, dispatch, toast, notify } = useStore()
  const [screen, setScreen] = useState<Screen>({ name: 'hoje' })
  const [loginError, setLoginError] = useState('')
  const [sheet, setSheet] = useState<{ tripId: string; stopId: string } | null>(null)

  useEffect(() => {
    const trip = screen.name === 'viagem' ? state.trips.find((item) => item.id === screen.id) : undefined
    const title = screen.name === 'viagem' && trip ? trip.codigo : titles[screen.name]
    document.title = state.loggedIn
      ? `${title} · Transportadora Braulio`
      : 'Entrar · Transportadora Braulio'
  }, [screen, state.loggedIn, state.trips])

  const login = (matricula: string, senha: string) => {
    if (!matricula || !senha) {
      setLoginError('Informe a matrícula e a senha.')
      return
    }
    if (matricula !== driver.matricula || senha !== driver.senha) {
      setLoginError('Matrícula ou senha não conferem. Na demonstração, use 1042 e rota.')
      return
    }
    setLoginError('')
    dispatch({ type: 'login' })
    setScreen({ name: 'hoje' })
  }

  if (!state.loggedIn) {
    return (
      <>
        <PwaManager />
        <LoginPage error={loginError} onSubmit={login} />
      </>
    )
  }

  const active = screen.name === 'viagem' ? screen.from : screen.name
  const trip = screen.name === 'viagem' ? state.trips.find((item) => item.id === screen.id) : undefined
  const title = screen.name === 'viagem' && trip ? trip.codigo : titles[screen.name]
  const attention = state.checks.filter((item) => item.ok !== true).length
  const sheetStop =
    sheet &&
    state.trips.find((item) => item.id === sheet.tripId)?.paradas.find((stop) => stop.id === sheet.stopId)

  const openTrip = (id: string, from: 'hoje' | 'viagens') => setScreen({ name: 'viagem', id, from })

  return (
    <>
    <PwaManager />
    <Shell
      title={title}
      active={active}
      showBack={screen.name === 'viagem'}
      onBack={() => {
        if (screen.name !== 'viagem') return
        setScreen(screen.from === 'hoje' ? { name: 'hoje' } : { name: 'viagens' })
      }}
      onNavigate={setScreen}
      attention={attention}
      toast={toast}
    >
      {screen.name === 'hoje' && (
        <HomePage
          trips={state.trips}
          checks={state.checks}
          onOpen={(id) => openTrip(id, 'hoje')}
          onStart={(id) => {
            dispatch({ type: 'start-trip', tripId: id })
            notify('Viagem iniciada. A primeira parada está em rota.')
            openTrip(id, 'hoje')
          }}
          onChecklist={() => setScreen({ name: 'checklist' })}
          onTrips={() => setScreen({ name: 'viagens' })}
          onProfile={() => setScreen({ name: 'perfil' })}
        />
      )}

      {screen.name === 'viagens' && <TripsPage trips={state.trips} onOpen={(id) => openTrip(id, 'viagens')} />}

      {screen.name === 'viagem' && (
        <TripPage
          trip={trip}
          onStart={() => {
            if (!trip) return
            dispatch({ type: 'start-trip', tripId: trip.id })
            notify('Viagem iniciada. A primeira parada está em rota.')
          }}
          onDeliver={(stopId) => {
            if (!trip) return
            dispatch({ type: 'deliver-stop', tripId: trip.id, stopId })
            notify('Entrega registrada.')
          }}
          onReport={(stopId) => {
            if (!trip) return
            setSheet({ tripId: trip.id, stopId })
          }}
          onFinish={() => {
            if (!trip) return
            dispatch({ type: 'finish-trip', tripId: trip.id })
            notify('Viagem encerrada.')
          }}
        />
      )}

      {screen.name === 'checklist' && (
        <ChecklistPage
          checks={state.checks}
          onSet={(id, value) => dispatch({ type: 'set-check', id, value })}
        />
      )}

      {screen.name === 'perfil' && (
        <ProfilePage
          onLogout={() => {
            dispatch({ type: 'logout' })
            setScreen({ name: 'hoje' })
          }}
          onReset={() => {
            dispatch({ type: 'reset' })
            notify('Demonstração restaurada.')
            setScreen({ name: 'hoje' })
          }}
        />
      )}

      {sheet && sheetStop && (
        <OccurrenceSheet
          cliente={sheetStop.cliente}
          onClose={() => setSheet(null)}
          onSubmit={(motivo, nota) => {
            dispatch({
              type: 'report-stop',
              tripId: sheet.tripId,
              stopId: sheet.stopId,
              motivo,
              nota,
            })
            setSheet(null)
            notify('Ocorrência registrada.')
          }}
        />
      )}
    </Shell>
    </>
  )
}
