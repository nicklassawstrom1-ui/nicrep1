// The live editor state shared across the prompt bar, controls, and preview.
import { create } from 'zustand'
import type { FontParams, DisplayStyle, CreationMode, Creation } from '../engine/types'
import { DEFAULT_PARAMS, DEFAULT_DISPLAY, sanitizeParams } from '../engine/params'
import type { InterpretResult, ImageInput } from '../interpret/schema'

interface StudioState {
  mode: CreationMode
  params: FontParams
  display: DisplayStyle
  name: string
  prompt: string
  /** The word/sentence shown in Display mode and used for previews. */
  displayText: string
  image: ImageInput | null
  busy: boolean
  lastSource: 'api' | 'offline' | 'bridge' | null
  lastNotes: string | null

  setMode: (m: CreationMode) => void
  setParam: <K extends keyof FontParams>(key: K, value: FontParams[K]) => void
  setParams: (p: Partial<FontParams>) => void
  setDisplay: (d: Partial<DisplayStyle>) => void
  setName: (n: string) => void
  setPrompt: (p: string) => void
  setDisplayText: (t: string) => void
  setImage: (img: ImageInput | null) => void
  setBusy: (b: boolean) => void
  applyInterpretation: (r: InterpretResult) => void
  loadCreation: (c: Creation) => void
  reset: () => void
}

export const useStudio = create<StudioState>((set) => ({
  mode: 'display',
  params: { ...DEFAULT_PARAMS },
  display: { ...DEFAULT_DISPLAY },
  name: 'Untitled',
  prompt: '',
  displayText: 'Typeforge',
  image: null,
  busy: false,
  lastSource: null,
  lastNotes: null,

  setMode: (mode) => set({ mode }),
  setParam: (key, value) => set((s) => ({ params: sanitizeParams({ ...s.params, [key]: value }) })),
  setParams: (p) => set((s) => ({ params: sanitizeParams({ ...s.params, ...p }) })),
  setDisplay: (d) => set((s) => ({ display: { ...s.display, ...d } })),
  setName: (name) => set({ name }),
  setPrompt: (prompt) => set({ prompt }),
  setDisplayText: (displayText) => set({ displayText }),
  setImage: (image) => set({ image }),
  setBusy: (busy) => set({ busy }),

  applyInterpretation: (r) =>
    set((s) => ({
      params: sanitizeParams({ ...s.params, ...r.params }),
      display: { ...s.display, ...(r.display || {}) },
      name: r.name || s.name,
      lastSource: r.source,
      lastNotes: r.notes || null,
    })),

  loadCreation: (c) =>
    set({
      mode: c.mode,
      params: sanitizeParams(c.params),
      display: { ...DEFAULT_DISPLAY, ...c.display },
      name: c.name,
      prompt: c.prompt,
      displayText: c.sampleText || 'Typeforge',
      image: null,
      lastSource: null,
      lastNotes: null,
    }),

  reset: () =>
    set({
      params: { ...DEFAULT_PARAMS },
      display: { ...DEFAULT_DISPLAY },
      name: 'Untitled',
      prompt: '',
      image: null,
      lastSource: null,
      lastNotes: null,
    }),
}))
