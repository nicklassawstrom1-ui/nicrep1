// Default parameters, UI slider metadata, and named presets.
import type { FontParams, DisplayStyle, SerifStyle, Terminal } from './types'

/** Units per em. All FontParams fractions are relative to this. */
export const UPM = 1000

export const DEFAULT_PARAMS: FontParams = {
  weight: 0.08,
  contrast: 0.08,
  xHeight: 0.52,
  capHeight: 0.7,
  ascender: 0.76,
  descender: -0.2,
  width: 1.0,
  slant: 0,
  round: 0.0,
  serif: 'none',
  serifSize: 0.04,
  terminal: 'flat',
  counter: 1.0,
  spacing: 1.0,
}

export const DEFAULT_DISPLAY: DisplayStyle = {
  fill: '#111418',
  fill2: null,
  background: '#f5f3ee',
  accent: '#e0533d',
  effect: 'none',
}

export interface SliderDef {
  key: keyof FontParams
  label: string
  min: number
  max: number
  step: number
  group: 'Shape' | 'Proportion' | 'Detail'
  /** Hint shown under the control. */
  hint?: string
}

/** Numeric sliders exposed in the parameter panel. */
export const SLIDER_DEFS: SliderDef[] = [
  { key: 'weight', label: 'Weight', min: 0.03, max: 0.18, step: 0.005, group: 'Shape', hint: 'Stroke thickness' },
  { key: 'contrast', label: 'Contrast', min: 0, max: 0.85, step: 0.01, group: 'Shape', hint: 'Thick vs thin strokes' },
  { key: 'width', label: 'Width', min: 0.6, max: 1.5, step: 0.01, group: 'Shape', hint: 'Condensed ↔ extended' },
  { key: 'slant', label: 'Slant', min: -8, max: 32, step: 1, group: 'Shape', hint: 'Italic angle (°)' },
  { key: 'round', label: 'Roundness', min: 0, max: 1, step: 0.02, group: 'Shape', hint: 'Corner softness' },
  { key: 'xHeight', label: 'x-height', min: 0.42, max: 0.6, step: 0.005, group: 'Proportion' },
  { key: 'capHeight', label: 'Cap height', min: 0.6, max: 0.78, step: 0.005, group: 'Proportion' },
  { key: 'ascender', label: 'Ascender', min: 0.66, max: 0.86, step: 0.005, group: 'Proportion' },
  { key: 'descender', label: 'Descender', min: -0.3, max: -0.08, step: 0.005, group: 'Proportion' },
  { key: 'counter', label: 'Counter', min: 0.7, max: 1.3, step: 0.01, group: 'Proportion', hint: 'Inner space' },
  { key: 'serifSize', label: 'Serif size', min: 0, max: 0.12, step: 0.005, group: 'Detail' },
  { key: 'spacing', label: 'Spacing', min: 0.7, max: 1.7, step: 0.01, group: 'Detail', hint: 'Tracking' },
]

export const SERIF_OPTIONS: SerifStyle[] = ['none', 'slab', 'wedge']
export const TERMINAL_OPTIONS: Terminal[] = ['flat', 'round']

export interface Preset {
  name: string
  params: FontParams
  display?: Partial<DisplayStyle>
}

const p = (over: Partial<FontParams>): FontParams => ({ ...DEFAULT_PARAMS, ...over })

/** Named starting points. The interpreter also blends toward these. */
export const PRESETS: Preset[] = [
  { name: 'Geometric Sans', params: p({ weight: 0.082, contrast: 0.04, round: 0.15 }) },
  { name: 'Grotesk Bold', params: p({ weight: 0.135, contrast: 0.05, xHeight: 0.54, spacing: 0.95 }) },
  { name: 'Slab', params: p({ weight: 0.12, contrast: 0.06, serif: 'slab', serifSize: 0.05, terminal: 'flat' }) },
  { name: 'Elegant Serif', params: p({ weight: 0.07, contrast: 0.62, serif: 'wedge', serifSize: 0.05, xHeight: 0.48 }) },
  { name: 'Condensed', params: p({ weight: 0.1, width: 0.72, contrast: 0.08, spacing: 0.86 }) },
  { name: 'Rounded', params: p({ weight: 0.12, round: 1, terminal: 'round', contrast: 0 }) },
  { name: 'Italic', params: p({ weight: 0.08, slant: 14, contrast: 0.2 }) },
  { name: 'Hairline', params: p({ weight: 0.032, contrast: 0.1, xHeight: 0.5 }) },
  { name: 'Fat Display', params: p({ weight: 0.175, contrast: 0.02, xHeight: 0.56, counter: 0.82, spacing: 0.92 }) },
]

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/** Clamp every parameter into its valid range (used after interpretation). */
export function sanitizeParams(input: Partial<FontParams>): FontParams {
  const merged = { ...DEFAULT_PARAMS, ...input }
  for (const def of SLIDER_DEFS) {
    const v = merged[def.key]
    if (typeof v === 'number' && Number.isFinite(v)) {
      ;(merged[def.key] as number) = clamp(v, def.min, def.max)
    } else {
      ;(merged[def.key] as number) = DEFAULT_PARAMS[def.key] as number
    }
  }
  if (!SERIF_OPTIONS.includes(merged.serif)) merged.serif = 'none'
  if (!TERMINAL_OPTIONS.includes(merged.terminal)) merged.terminal = 'flat'
  return merged
}
