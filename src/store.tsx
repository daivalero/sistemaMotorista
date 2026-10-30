import { createContext, useContext, useEffect, useReducer, useState, type ReactNode } from 'react'
import { emptyState, loadState, saveState } from './lib/storage'
import { reducer } from './logic'
import type { Action, AppState } from './types'

type Store = {
  state: AppState
  dispatch: (action: Action) => void
  toast: string | null
  notify: (message: string) => void
  hydrated: boolean
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, emptyState)
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let active = true
    void loadState().then((saved) => {
      if (!active) return
      dispatch({ type: 'hydrate', state: saved })
      setHydrated(true)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (hydrated) void saveState(state)
  }, [hydrated, state])

  const notify = (message: string) => {
    setToast({ id: Date.now(), text: message })
  }

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <StoreContext.Provider
      value={{ state, dispatch, toast: toast?.text ?? null, notify, hydrated }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore fora do StoreProvider')
  return ctx
}
