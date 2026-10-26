import { createId } from './lib/id'
import type { Profile } from './types'

/** Credenciais de demonstração local (sem inventar viagens). */
export const demoCredentials = {
  motorista: {
    matricula: '1042',
    senha: 'rota',
    profile: {
      id: 'driver_demo_1042',
      nome: 'Carlos Mendes',
      matricula: '1042',
      role: 'motorista' as const,
      telefone: '(11) 98821-4407',
    } satisfies Profile,
  },
  admin: {
    matricula: '9001',
    senha: 'admin',
    profile: {
      id: 'admin_demo_9001',
      nome: 'Ana Conferência',
      matricula: '9001',
      role: 'admin' as const,
      telefone: '(11) 90000-0000',
    } satisfies Profile,
  },
}

export function formatDateTime(iso?: string) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatLongDate(iso: string) {
  const date = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`)
  const text = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function newLocalId(prefix: string) {
  return createId(prefix)
}
