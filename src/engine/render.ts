// Lays out a string into positioned glyph outlines and renders it to SVG markup.
// Used for the live previews, library thumbnails, and SVG export. Display-mode
// effects (outline / shadow / stack / wave / gradient) are applied here so the
// on-screen preview is byte-for-byte what gets exported.
import type { FontParams, DisplayStyle, Contour } from './types'
import { UPM } from './params'
import { buildGlyph } from './glyphs'
import { boundsOf, contoursToSvgPath, type Bounds } from './geometry'

export interface LaidGlyph {
  ch: string
  x: number
  contours: Contour[]
}

export interface Layout {
  glyphs: LaidGlyph[]
  advance: number
}

/** Position each glyph along the baseline; contours are translated into place. */
export function layoutWord(text: string, params: FontParams): Layout {
  const glyphs: LaidGlyph[] = []
  let cursor = 0
  for (const ch of text) {
    const shape = buildGlyph(ch, params)
    const placed = shape.contours.map((c) => c.map(([x, y]) => [x + cursor, y] as [number, number]))
    glyphs.push({ ch, x: cursor, contours: placed })
    cursor += shape.advance
  }
  return { glyphs, advance: cursor }
}

function allContours(layout: Layout): Contour[] {
  const out: Contour[] = []
  for (const g of layout.glyphs) out.push(...g.contours)
  return out
}

export interface RenderOptions {
  /** Padding around the ink, in font units. */
  pad?: number
  /** Include a background rectangle (for export / thumbnails). */
  background?: boolean
}

export interface RenderResult {
  markup: string
  viewBox: string
  width: number
  height: number
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Build standalone SVG markup for a word with the given params + display style. */
export function renderWordSvg(
  text: string,
  params: FontParams,
  display: DisplayStyle,
  opts: RenderOptions = {},
): RenderResult {
  const pad = opts.pad ?? UPM * 0.16
  const layout = layoutWord(text || ' ', params)
  const sw = Math.max(28, params.weight * UPM)

  const waveAmp = display.effect === 'wave' ? UPM * 0.12 : 0
  // Apply a baseline wave per glyph (offsets the whole glyph vertically).
  const glyphContours: Contour[][] = layout.glyphs.map((g) => {
    if (!waveAmp) return g.contours
    const phase = (g.x / Math.max(1, layout.advance)) * Math.PI * 2.2
    const dy = Math.sin(phase) * waveAmp
    return g.contours.map((c) => c.map(([x, y]) => [x, y + dy] as [number, number]))
  })

  const flat: Contour[] = glyphContours.flat()
  let b: Bounds = boundsOf(flat)
  // Guarantee a sane box even for whitespace-only / empty input.
  if (flat.length === 0 || !Number.isFinite(b.maxX - b.minX) || b.maxX - b.minX < 1) {
    b = {
      minX: 0,
      minY: Math.min(0, params.descender * UPM),
      maxX: layout.advance || UPM * 0.5,
      maxY: params.capHeight * UPM,
    }
  }

  const W = b.maxX - b.minX + pad * 2
  const H = b.maxY - b.minY + pad * 2
  // Map font space (y-up) into SVG space (y-down).
  const groupTf = `translate(${(pad - b.minX).toFixed(1)} ${(pad + b.maxY).toFixed(1)}) scale(1 -1)`

  const dWord = contoursToSvgPath(flat)

  const defs: string[] = []
  let fillAttr = display.fill
  if (display.fill2) {
    defs.push(
      `<linearGradient id="tf-grad" gradientUnits="userSpaceOnUse" x1="0" y1="${b.maxY.toFixed(1)}" x2="0" y2="${b.minY.toFixed(1)}">` +
        `<stop offset="0" stop-color="${esc(display.fill)}"/>` +
        `<stop offset="1" stop-color="${esc(display.fill2)}"/>` +
        `</linearGradient>`,
    )
    fillAttr = 'url(#tf-grad)'
  }

  const layers: string[] = []

  if (display.effect === 'stack') {
    const steps = 7
    const dx = sw * 0.42
    const dy = sw * 0.42
    for (let i = steps; i >= 1; i--) {
      layers.push(`<path d="${dWord}" fill="${esc(display.accent)}" transform="translate(${(dx * i).toFixed(1)} ${(-dy * i).toFixed(1)})"/>`)
    }
    layers.push(`<path d="${dWord}" fill="${fillAttr}"/>`)
  } else if (display.effect === 'shadow') {
    const dx = sw * 0.5
    const dy = sw * 0.5
    layers.push(`<path d="${dWord}" fill="${esc(display.accent)}" opacity="0.85" transform="translate(${dx.toFixed(1)} ${(-dy).toFixed(1)})"/>`)
    layers.push(`<path d="${dWord}" fill="${fillAttr}"/>`)
  } else if (display.effect === 'outline') {
    layers.push(`<path d="${dWord}" fill="none" stroke="${fillAttr}" stroke-width="${(sw * 0.16).toFixed(1)}" stroke-linejoin="round"/>`)
  } else {
    layers.push(`<path d="${dWord}" fill="${fillAttr}"/>`)
  }

  const bg = opts.background
    ? `<rect x="0" y="0" width="${W.toFixed(1)}" height="${H.toFixed(1)}" fill="${esc(display.background)}"/>`
    : ''
  const defsMarkup = defs.length ? `<defs>${defs.join('')}</defs>` : ''

  const markup =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}" width="${W.toFixed(0)}" height="${H.toFixed(0)}">` +
    defsMarkup +
    bg +
    `<g transform="${groupTf}">${layers.join('')}</g>` +
    `</svg>`

  return { markup, viewBox: `0 0 ${W.toFixed(1)} ${H.toFixed(1)}`, width: W, height: H }
}

/** Trigger a browser download of the rendered word as an .svg file. */
export function downloadSvg(text: string, params: FontParams, display: DisplayStyle, fileName: string) {
  const { markup } = renderWordSvg(text, params, display, { background: false })
  const blob = new Blob([markup], { type: 'image/svg+xml' })
  triggerDownload(blob, `${fileName}.svg`)
}

/** Rasterize the rendered word to PNG (transparent bg) and download it. */
export async function downloadPng(text: string, params: FontParams, display: DisplayStyle, fileName: string, scale = 3) {
  const { markup, width, height } = renderWordSvg(text, params, display, { background: false })
  const svgBlob = new Blob([markup], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(svgBlob)
  try {
    const img = new Image()
    img.decoding = 'async'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('SVG load failed'))
      img.src = url
    })
    const canvas = document.createElement('canvas')
    // Scale up for crisp output, but cap the longest edge at 4096px.
    const base = Math.max(width, height)
    const eff = Math.min(scale, 4096 / base)
    canvas.width = Math.round(width * eff)
    canvas.height = Math.round(height * eff)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no 2d context')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    await new Promise<void>((resolve) =>
      canvas.toBlob((blob) => {
        if (blob) triggerDownload(blob, `${fileName}.png`)
        resolve()
      }, 'image/png'),
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
