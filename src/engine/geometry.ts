// Low-level geometry: sampling arcs and converting centreline "strokes" into
// filled outline contours by offsetting. Glyphs are authored as skeletons
// (centrelines); this module turns them into real outlines that both render to
// SVG and export to OpenType, with holes handled by the non-zero fill rule.
import type { Pt, Contour } from './types'

const TAU = Math.PI * 2

/** A glyph skeleton element: a centreline polyline, stroked with thickness `w`. */
export interface Stroke {
  /** Centreline points (already flattened — arcs sampled into segments). */
  pts: Pt[]
  /** Stroke thickness in font units. */
  w: number
  /** Closed loop (e.g. the bowl of an 'o') vs open stroke (a stem). */
  closed?: boolean
  /** End-cap style for open strokes. */
  cap?: 'round' | 'flat'
}

/** Sample an elliptical arc. Angles in radians; sweeps a0→a1 (sign = direction). */
export function arc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  a0: number,
  a1: number,
  seg = 24,
): Pt[] {
  const pts: Pt[] = []
  const n = Math.max(2, Math.round((seg * Math.abs(a1 - a0)) / TAU) + 2)
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry])
  }
  return pts
}

/** Full ellipse as a closed centreline (CCW). */
export function ellipse(cx: number, cy: number, rx: number, ry: number, seg = 48): Pt[] {
  const pts = arc(cx, cy, rx, ry, 0, TAU, seg)
  pts.pop() // arc repeats the start point for a full turn; drop the duplicate
  return pts
}

function len(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(bx - ax, by - ay)
}

/** Signed area (>0 means counter-clockwise). */
export function signedArea(c: Contour): number {
  let a = 0
  for (let i = 0, n = c.length; i < n; i++) {
    const [x1, y1] = c[i]
    const [x2, y2] = c[(i + 1) % n]
    a += x1 * y2 - x2 * y1
  }
  return a / 2
}

/** Force a contour to a winding direction: ccw=true → filled, false → hole. */
export function ensureWinding(c: Contour, ccw: boolean): Contour {
  const area = signedArea(c)
  const isCcw = area > 0
  return isCcw === ccw ? c : c.slice().reverse()
}

/** Per-vertex unit "left" normals (rotate the averaged tangent +90°). */
function vertexNormals(pts: Pt[], closed: boolean): Pt[] {
  const n = pts.length
  const seg: Pt[] = []
  for (let i = 0; i < n - (closed ? 0 : 1); i++) {
    const a = pts[i]
    const b = pts[(i + 1) % n]
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const l = Math.hypot(dx, dy) || 1
    seg.push([-dy / l, dx / l]) // left normal
  }
  const out: Pt[] = []
  for (let i = 0; i < n; i++) {
    let nx: number
    let ny: number
    if (!closed && i === 0) {
      ;[nx, ny] = seg[0]
    } else if (!closed && i === n - 1) {
      ;[nx, ny] = seg[seg.length - 1]
    } else {
      const prev = seg[(i - 1 + seg.length) % seg.length]
      const cur = seg[i % seg.length]
      nx = prev[0] + cur[0]
      ny = prev[1] + cur[1]
      const l = Math.hypot(nx, ny) || 1
      nx /= l
      ny /= l
    }
    out.push([nx, ny])
  }
  return out
}

function capPoints(center: Pt, tangentAngle: number, r: number, atEnd: boolean): Pt[] {
  // End cap sweeps aT+90° → aT-90° (through the forward tangent);
  // start cap sweeps aT-90° → aT+90° the long way (through the backward tangent).
  const pts: Pt[] = []
  const steps = 10
  for (let i = 1; i < steps; i++) {
    const t = i / steps
    const a = atEnd
      ? tangentAngle + Math.PI / 2 - Math.PI * t
      : tangentAngle - Math.PI / 2 - Math.PI * t
    pts.push([center[0] + Math.cos(a) * r, center[1] + Math.sin(a) * r])
  }
  return pts
}

/** Offset an open centreline into one filled (CCW) outline contour. */
function offsetOpen(pts: Pt[], w: number, cap: 'round' | 'flat'): Contour {
  const r = w / 2
  const norm = vertexNormals(pts, false)
  const left: Pt[] = pts.map((pp, i) => [pp[0] + norm[i][0] * r, pp[1] + norm[i][1] * r])
  const right: Pt[] = pts.map((pp, i) => [pp[0] - norm[i][0] * r, pp[1] - norm[i][1] * r])
  const n = pts.length
  const out: Pt[] = [...left]
  // end cap (around last point)
  const endTan = Math.atan2(pts[n - 1][1] - pts[n - 2][1], pts[n - 1][0] - pts[n - 2][0])
  if (cap === 'round') out.push(...capPoints(pts[n - 1], endTan, r, true))
  for (let i = n - 1; i >= 0; i--) out.push(right[i])
  // start cap (around first point)
  const startTan = Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0])
  if (cap === 'round') out.push(...capPoints(pts[0], startTan, r, false))
  return ensureWinding(out, true)
}

/** Offset a closed centreline loop into [outer (CCW, fill), inner (CW, hole)]. */
function offsetClosed(pts: Pt[], w: number): Contour[] {
  const r = w / 2
  const loop = ensureWinding(pts, true) // CCW so the left normal points outward
  const norm = vertexNormals(loop, true)
  const outer: Pt[] = loop.map((pp, i) => [pp[0] + norm[i][0] * r, pp[1] + norm[i][1] * r])
  const inner: Pt[] = loop.map((pp, i) => [pp[0] - norm[i][0] * r, pp[1] - norm[i][1] * r])
  return [ensureWinding(outer, true), ensureWinding(inner, false)]
}

/** Convert a stroke skeleton into one or more outline contours. */
export function strokeToContours(s: Stroke): Contour[] {
  if (s.pts.length < 2) return []
  if (s.closed) return offsetClosed(s.pts, s.w)
  return [offsetOpen(s.pts, s.w, s.cap ?? 'flat')]
}

/** A filled convex/closed polygon used directly as a contour (e.g. serifs, dots). */
export function polygon(pts: Pt[]): Contour {
  return ensureWinding(pts, true)
}

/** Apply an affine point transform to every contour. */
export function transformContours(contours: Contour[], fn: (p: Pt) => Pt): Contour[] {
  return contours.map((c) => c.map(fn))
}

/** Italic shear + horizontal width scale about the baseline. */
export function makeSlantWidth(slantDeg: number, width: number): (p: Pt) => Pt {
  const t = Math.tan((slantDeg * Math.PI) / 180)
  return ([x, y]) => [x * width + y * t, y]
}

export interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export function boundsOf(contours: Contour[]): Bounds {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const c of contours)
    for (const [x, y] of c) {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  return { minX, minY, maxX, maxY }
}

/** Serialize contours to an SVG path `d` string (raw font coords, y-up). */
export function contoursToSvgPath(contours: Contour[]): string {
  let d = ''
  for (const c of contours) {
    if (c.length === 0) continue
    d += `M${c[0][0].toFixed(1)} ${c[0][1].toFixed(1)}`
    for (let i = 1; i < c.length; i++) d += `L${c[i][0].toFixed(1)} ${c[i][1].toFixed(1)}`
    d += 'Z'
  }
  return d
}

export { TAU, len }
