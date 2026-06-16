// Client-side entry point for interpretation. Tries the server /api/interpret
// endpoint (Claude) first; if it's unavailable or errors, falls back to the
// offline keyword parser + basic image analysis. Always resolves to a result.
import type { FontParams, DisplayStyle, DisplayEffect, SerifStyle, Terminal } from '../engine/types'
import type { InterpretResult, ImageInput } from './schema'
import { interpretOffline, analyzeImage } from './offline'

const PARAM_KEYS: (keyof FontParams)[] = [
  'weight', 'contrast', 'xHeight', 'capHeight', 'ascender', 'descender',
  'width', 'slant', 'round', 'serif', 'serifSize', 'terminal', 'counter', 'spacing',
]

export interface ApiStatus {
  available: boolean
  model: string | null
}

let statusCache: Promise<ApiStatus> | null = null

export function getApiStatus(): Promise<ApiStatus> {
  if (!statusCache) {
    statusCache = fetch('/api/status')
      .then((r) => (r.ok ? r.json() : { available: false, model: null }))
      .catch(() => ({ available: false, model: null }))
  }
  return statusCache
}

export async function interpretPrompt(prompt: string, image?: ImageInput | null): Promise<InterpretResult> {
  // 1) Try the server-side Claude endpoint.
  try {
    const res = await fetch('/api/interpret', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt,
        image: image ? { media_type: image.media_type, data: image.base64 } : undefined,
      }),
    })
    if (res.ok) {
      const json = await res.json()
      if (json?.ok && json.result) {
        return normalizeApiResult(json.result)
      }
    }
  } catch {
    // network/dev-server issue — fall through to offline
  }

  // 2) Offline fallback: keyword parse + (optional) image color/density analysis.
  const keyword = interpretOffline(prompt)
  if (image) {
    try {
      const img = await analyzeImage(image)
      return {
        params: { ...img.params, ...keyword.params },
        display: { ...(img.display || {}), ...(keyword.display || {}) },
        name: keyword.name,
        notes: 'Offline: image colors + keywords.',
        source: 'offline',
      }
    } catch {
      // ignore image failure
    }
  }
  return keyword
}

function num(v: unknown): number | undefined {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number)
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

function normalizeApiResult(raw: Record<string, unknown>): InterpretResult {
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
    source: 'api',
  }
}
