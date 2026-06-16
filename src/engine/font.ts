// Compiles FontParams into a real OpenType font using opentype.js, and loads it
// as a live FontFace for in-browser rendering. The same glyph outlines feed both
// the SVG previews (render.ts) and the exported .otf/.ttf.
import opentype from 'opentype.js'
import type { FontParams } from './types'
import { UPM } from './params'
import { buildGlyph, CHARSET } from './glyphs'

function contoursToOtfPath(shape: ReturnType<typeof buildGlyph>): opentype.Path {
  const path = new opentype.Path()
  for (const contour of shape.contours) {
    if (contour.length === 0) continue
    path.moveTo(Math.round(contour[0][0]), Math.round(contour[0][1]))
    for (let i = 1; i < contour.length; i++) {
      path.lineTo(Math.round(contour[i][0]), Math.round(contour[i][1]))
    }
    path.close()
  }
  return path
}

/** Build an opentype.js Font for the given parameters over the full charset. */
export function buildFont(params: FontParams, familyName: string, styleName = 'Regular'): opentype.Font {
  const notdef = new opentype.Glyph({
    name: '.notdef',
    unicode: 0,
    advanceWidth: Math.round(UPM * 0.5),
    path: new opentype.Path(),
  })

  const glyphs: opentype.Glyph[] = [notdef]
  for (const ch of CHARSET) {
    const shape = buildGlyph(ch, params)
    glyphs.push(
      new opentype.Glyph({
        name: ch === ' ' ? 'space' : `uni${ch.charCodeAt(0).toString(16).padStart(4, '0').toUpperCase()}`,
        unicode: ch.charCodeAt(0),
        advanceWidth: Math.max(1, Math.round(shape.advance)),
        path: contoursToOtfPath(shape),
      }),
    )
  }

  return new opentype.Font({
    familyName: familyName || 'Typeforge',
    styleName,
    unitsPerEm: UPM,
    ascender: Math.round(params.ascender * UPM),
    descender: Math.round(params.descender * UPM),
    glyphs,
  })
}

/** Serialize a built font to an ArrayBuffer (OpenType / .otf). */
export function fontToArrayBuffer(font: opentype.Font): ArrayBuffer {
  return font.toArrayBuffer()
}

/** Trigger a browser download of the font as a .otf (or .ttf) file. */
export function downloadFont(params: FontParams, familyName: string, ext: 'otf' | 'ttf' = 'otf') {
  const font = buildFont(params, familyName)
  const ab = font.toArrayBuffer()
  const blob = new Blob([ab], { type: 'font/otf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sanitizeFileName(familyName)}.${ext}`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const faceCache = new Map<string, Promise<FontFace>>()

/** Build the font and register it as a live FontFace so CSS can render with it. */
export function loadFontFace(params: FontParams, family: string): Promise<FontFace> {
  const key = family
  const cached = faceCache.get(key)
  if (cached) return cached
  const promise = (async () => {
    const font = buildFont(params, family)
    const ab = font.toArrayBuffer()
    const face = new FontFace(family, ab as ArrayBuffer)
    await face.load()
    document.fonts.add(face)
    return face
  })()
  faceCache.set(key, promise)
  return promise
}

export function sanitizeFileName(name: string): string {
  return (name || 'typeface').replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '') || 'typeface'
}
