// Client-side entry point for interpretation. Tries the server /api/interpret
// endpoint (Claude) first; if it's unavailable or errors, falls back to the
// offline keyword parser + basic image analysis. Always resolves to a result.
import type { InterpretResult, ImageInput } from './schema'
import { interpretOffline, analyzeImage } from './offline'
import { normalizeSpec } from './normalize'

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
        return normalizeSpec(json.result, 'api')
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
