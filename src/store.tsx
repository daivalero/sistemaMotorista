import { createContext, useContext, useEffect, useReducer, useState, type ReactNode } from 'react'
import { createInitialState } from './data'
import { reducer } from './logic'
import type { Action, AppState } from './types'

const STORAGE_KEY = 'sistema-motorista-state-v1'

type Store = {
  state: AppState
  dispatch: (action: Action) => void
  toast: string | null
  notify: (message: string) => void
}

const StoreContext = createContext<Store | null>(null)

function init(): AppState {
  const fresh = createInitialState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fresh
    const parsed = JSON.parse(raw) as AppState
    if (!parsed || !Array.isArray(parsed.trips) || !Array.isArray(parsed.checks)) return fresh
    return {
      loggedIn: Boolean(parsed.loggedIn),
      trips: parsed.trips,
      checks: parsed.checks,
    }
  } catch {
    return fresh
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, init)
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const notify = (message: string) => setToast({ id: Date.now(), text: message })

  return (
    <StoreContext.Provider value={{ state, dispatch, toast: toast?.text ?? null, notify }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore precisa estar dentro do StoreProvider')
  return store
}
