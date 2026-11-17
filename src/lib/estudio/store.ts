'use client'

import { create } from 'zustand'
import { toast } from 'sonner'
import type { ProgressMap } from './types'

type State = {
  rows: ProgressMap
  loaded: boolean
  load: () => Promise<void>
  set: (key: string, status: string, data?: Record<string, unknown>) => void
  remove: (key: string) => void
}

const failed = () => toast.error('No se pudo guardar el progreso')

// El progreso se pinta al instante y se guarda en segundo plano.
export const useStudy = create<State>((set, get) => ({
  rows: {},
  loaded: false,
  load: async () => {
    if (get().loaded) return
    try {
      const res = await fetch('/api/estudio/progress')
      if (res.ok) set({ rows: await res.json(), loaded: true })
    } catch {}
  },
  set: (key, status, data) => {
    set((s) => ({ rows: { ...s.rows, [key]: { status, data: data ?? null, updatedAt: new Date().toISOString() } } }))
    fetch('/api/estudio/progress', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, status, data }) })
      .then((r) => { if (!r.ok) failed() })
      .catch(failed)
  },
  remove: (key) => {
    set((s) => { const rows = { ...s.rows }; delete rows[key]; return { rows } })
    fetch(`/api/estudio/progress?key=${encodeURIComponent(key)}`, { method: 'DELETE' }).then((r) => { if (!r.ok) failed() }).catch(failed)
  },
}))
