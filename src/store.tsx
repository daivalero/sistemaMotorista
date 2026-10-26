import { createContext, useContext, useEffect, useReducer, useState, type ReactNode } from 'react'
import { loadState, saveState } from './lib/storage'
import { reducer } from './logic'
import type { Action, AppState } from './types'

type Store = {
  state: AppState
  dispatch: (action: Action) => void
  toast: string | null
  notify: (message: string) => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null)

  useEffect(() => {
    saveState(state)
  }, [state])

  const notify = (message: string) => {
    setToast({ id: Date.now(), text: message })
  }

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  return (
    <StoreContext.Provider
      value={{ state, dispatch, toast: toast?.text ?? null, notify }}
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
