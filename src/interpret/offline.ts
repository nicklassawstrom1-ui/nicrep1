// Offline interpretation: turn a text prompt into typeface settings using a
// keyword/heuristic parser, plus a lightweight canvas-based analysis of a
// reference image (dominant colors + ink density → palette and weight). No
// network or API key required.
import type { FontParams, DisplayStyle } from '../engine/types'
import type { InterpretResult, ImageInput } from './schema'

const lc = (s: string) => s.toLowerCase()

function any(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w))
}

/** Map a natural-language prompt to partial parameters via keyword matching. */
export function interpretOffline(prompt: string): InterpretResult {
  const t = lc(prompt || '')
  const params: Partial<FontParams> = {}
  const display: Partial<DisplayStyle> = {}

  // Weight
  if (any(t, ['hairline', 'ultralight', 'ultra light', 'extra light'])) params.weight = 0.035
  else if (any(t, ['thin', 'light', 'fine', 'delicate'])) params.weight = 0.05
  else if (any(t, ['black', 'heavy', 'fat', 'chunky', 'ultra bold', 'extra bold'])) params.weight = 0.17
  else if (any(t, ['bold', 'strong', 'thick', 'punchy'])) params.weight = 0.135
  else if (any(t, ['medium', 'semibold', 'semi bold'])) params.weight = 0.105

  // Serif / contrast family
  if (any(t, ['slab', 'egyptian'])) {
    params.serif = 'slab'
    params.serifSize = 0.05
  } else if (any(t, ['didone', 'high contrast', 'high-contrast', 'fashion', 'vogue', 'modern serif'])) {
    params.serif = 'wedge'
    params.contrast = 0.7
    params.serifSize = 0.04
  } else if (any(t, ['elegant', 'luxury', 'classy', 'sophisticated', 'editorial', 'serif'])) {
    params.serif = 'wedge'
    params.contrast = 0.5
    params.serifSize = 0.045
  } else if (any(t, ['sans', 'sans-serif', 'sans serif', 'clean', 'minimal', 'simple'])) {
    params.serif = 'none'
    params.contrast = 0.05
  }

  // Shape vibes
  if (any(t, ['round', 'rounded', 'soft', 'bubbly', 'friendly', 'cute', 'playful'])) {
    params.round = 1
    params.terminal = 'round'
    params.contrast = 0
  }
  if (any(t, ['geometric', 'bauhaus', 'futura'])) {
    params.contrast = 0.03
    params.round = Math.max(params.round ?? 0, 0.1)
  }
  if (any(t, ['techno', 'futuristic', 'sci-fi', 'sci fi', 'digital', 'cyber', 'space'])) {
    params.contrast = 0.04
    params.width = 1.05
    params.spacing = 1.2
  }
  if (any(t, ['retro', 'vintage', '70s', 'seventies', 'groovy'])) {
    params.round = Math.max(params.round ?? 0, 0.6)
    params.xHeight = 0.56
    params.counter = 0.86
    display.fill = '#f3a712'
    display.background = '#3a2618'
    display.accent = '#d1495b'
  }

  // Width
  if (any(t, ['condensed', 'narrow', 'compressed', 'tall', 'skinny'])) params.width = 0.72
  else if (any(t, ['extended', 'expanded', 'wide', 'broad'])) params.width = 1.35

  // Slant
  if (any(t, ['italic', 'slanted', 'oblique', 'leaning', 'cursive'])) params.slant = 14

  // Display weight bumps
  if (any(t, ['display', 'headline', 'poster', 'logo', 'title', 'banner'])) {
    params.weight = Math.max(params.weight ?? 0.08, 0.12)
  }
  if (any(t, ['mono', 'monospace', 'code', 'typewriter'])) {
    params.spacing = 1.3
    params.contrast = 0.03
  }

  // Effects
  if (any(t, ['outline', 'hollow', 'stroke only'])) display.effect = 'outline'
  else if (any(t, ['3d', 'stacked', 'extruded', 'block', 'isometric'])) display.effect = 'stack'
  else if (any(t, ['shadow', 'drop shadow'])) display.effect = 'shadow'
  else if (any(t, ['wave', 'wavy', 'bouncy', 'curvy baseline'])) display.effect = 'wave'

  // Palette moods
  if (any(t, ['neon'])) {
    display.fill = '#39ff14'
    display.background = '#0a0a0f'
    display.accent = '#ff2bd6'
  } else if (any(t, ['corporate', 'professional', 'business', 'tech'])) {
    display.fill = '#1b3a5b'
    display.background = '#f5f7fa'
    display.accent = '#3d7dca'
  } else if (any(t, ['pastel', 'soft colors'])) {
    display.fill = '#6b5b95'
    display.background = '#fef6e4'
    display.accent = '#f582ae'
  } else if (any(t, ['dark', 'noir', 'midnight'])) {
    display.fill = '#f5f3ee'
    display.background = '#14151a'
    display.accent = '#e0533d'
  } else if (any(t, ['warm', 'earthy', 'terracotta'])) {
    display.fill = '#3a2a20'
    display.background = '#f0e2d0'
    display.accent = '#c8553d'
  }

  return {
    params,
    display: Object.keys(display).length ? display : undefined,
    name: deriveName(prompt),
    source: 'offline',
    notes: 'Interpreted offline from keywords.',
  }
}

const STOP = new Set(['a', 'an', 'the', 'with', 'and', 'or', 'of', 'for', 'to', 'in', 'like', 'that', 'this', 'make', 'create', 'want', 'something', 'font', 'typeface', 'type', 'style'])

function deriveName(prompt: string): string | undefined {
  const words = lc(prompt)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
  if (words.length === 0) return undefined
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

/** Basic offline reference-image analysis: palette + ink density → weight. */
export async function analyzeImage(image: ImageInput): Promise<InterpretResult> {
  const stats = await sampleImage(image.dataUrl)
  const params: Partial<FontParams> = {}
  const display: Partial<DisplayStyle> = {}

  // More ink (dark coverage) → bolder weight.
  params.weight = clamp(0.05 + stats.darkRatio * 0.28, 0.045, 0.17)

  const paperDark = stats.paperLum < 0.5
  if (stats.colorful) {
    display.fill = stats.inkColor
    display.background = stats.paperColor
    display.accent = stats.inkColor
  } else if (paperDark) {
    display.fill = '#f3f1ea'
    display.background = stats.paperColor
  } else {
    display.fill = stats.inkColor
    display.background = stats.paperColor
  }

  return {
    params,
    display,
    source: 'offline',
    notes: 'Estimated offline from image colors and ink density.',
  }
}

interface ImageStats {
  darkRatio: number
  paperLum: number
  inkColor: string
  paperColor: string
  colorful: boolean
}

function sampleImage(dataUrl: string): Promise<ImageStats> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const N = 56
      const canvas = document.createElement('canvas')
      canvas.width = N
      canvas.height = N
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(fallbackStats())
      ctx.drawImage(img, 0, 0, N, N)
      let data: Uint8ClampedArray
      try {
        data = ctx.getImageData(0, 0, N, N).data
      } catch {
        return resolve(fallbackStats())
      }
      let dark = 0
      let count = 0
      let inkR = 0, inkG = 0, inkB = 0, inkN = 0
      let papR = 0, papG = 0, papB = 0, papN = 0
      let satSum = 0
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2]
        const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
        satSum += mx === 0 ? 0 : (mx - mn) / mx
        count++
        if (lum < 0.45) {
          dark++
          inkR += r; inkG += g; inkB += b; inkN++
        } else {
          papR += r; papG += g; papB += b; papN++
        }
      }
      const inkColor = inkN ? rgbHex(inkR / inkN, inkG / inkN, inkB / inkN) : '#1a1a1a'
      const paperColor = papN ? rgbHex(papR / papN, papG / papN, papB / papN) : '#f4f1ea'
      const paperLum = papN
        ? (0.2126 * (papR / papN) + 0.7152 * (papG / papN) + 0.0722 * (papB / papN)) / 255
        : 0.95
      resolve({
        darkRatio: dark / count,
        paperLum,
        inkColor,
        paperColor,
        colorful: satSum / count > 0.22,
      })
    }
    img.onerror = () => resolve(fallbackStats())
    img.src = dataUrl
  })
}

function fallbackStats(): ImageStats {
  return { darkRatio: 0.2, paperLum: 0.95, inkColor: '#1a1a1a', paperColor: '#f4f1ea', colorful: false }
}

function rgbHex(r: number, g: number, b: number): string {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}
