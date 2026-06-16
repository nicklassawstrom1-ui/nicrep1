// The saved-creations library, persisted to IndexedDB via idb-keyval.
import { create } from 'zustand'
import { get as idbGet, set as idbSet } from 'idb-keyval'
import type { Creation } from '../engine/types'

const KEY = 'typeforge.library.v1'

interface LibraryState {
  creations: Creation[]
  loaded: boolean
  load: () => Promise<void>
  add: (c: Creation) => void
  update: (id: string, patch: Partial<Creation>) => void
  remove: (id: string) => void
  clear: () => void
}

function persist(creations: Creation[]) {
  idbSet(KEY, creations).catch(() => {
    /* best-effort */
  })
}

export const useLibrary = create<LibraryState>((set) => ({
  creations: [],
  loaded: false,
  load: async () => {
    let stored: unknown = null
    try {
      stored = await idbGet(KEY)
    } catch {
      stored = null
    }
    set({ creations: Array.isArray(stored) ? (stored as Creation[]) : [], loaded: true })
  },
  add: (c) =>
    set((s) => {
      const creations = [c, ...s.creations]
      persist(creations)
      return { creations }
    }),
  update: (id, patch) =>
    set((s) => {
      const creations = s.creations.map((x) => (x.id === id ? { ...x, ...patch } : x))
      persist(creations)
      return { creations }
    }),
  remove: (id) =>
    set((s) => {
      const creations = s.creations.filter((x) => x.id !== id)
      persist(creations)
      return { creations }
    }),
  clear: () =>
    set(() => {
      persist([])
      return { creations: [] }
    }),
}))
