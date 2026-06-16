// Shared normalizer: turns a raw spec object (from the Claude API tool call OR
// from a pasted Claude reply in the copy-paste bridge) into an InterpretResult.
import type { FontParams, DisplayStyle, DisplayEffect, SerifStyle, Terminal } from '../engine/types'
import type { InterpretResult } from './schema'

const PARAM_KEYS: (keyof FontParams)[] = [
  'weight', 'contrast', 'xHeight', 'capHeight', 'ascender', 'descender',
  'width', 'slant', 'round', 'serif', 'serifSize', 'terminal', 'counter', 'spacing',
]

function num(v: unknown): number | undefined {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number)
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

export function normalizeSpec(raw: Record<string, unknown>, source: InterpretResult['source']): InterpretResult {
  const params: Partial<FontParams> = {}
  for (const key of PARAM_KEYS) {
    if (!(key in raw)) continue
    if (key === 'serif') {
      const v = raw[key]
      if (v === 'none' || v === 'slab' || v === 'wedge') params.serif = v as SerifStyle
    } else if (key === 'terminal') {
      const v = raw[key]
      if (v === 'flat' || v === 'round') params.terminal = v as Terminal
    } else {
      const n = num(raw[key])
      if (n !== undefined) (params[key] as number) = n
    }
  }

  const display: Partial<DisplayStyle> = {}
  const fill = str(raw.fill)
  const fill2 = str(raw.fill2)
  const background = str(raw.background)
  const accent = str(raw.accent)
  if (fill) display.fill = fill
  if (fill2) display.fill2 = fill2
  if (background) display.background = background
  if (accent) display.accent = accent
  const effect = raw.effect
  if (['none', 'outline', 'shadow', 'stack', 'wave'].includes(effect as string)) {
    display.effect = effect as DisplayEffect
  }

  return {
    params,
    display: Object.keys(display).length ? display : undefined,
    name: str(raw.name),
    notes: str(raw.notes),
    source,
  }
}
