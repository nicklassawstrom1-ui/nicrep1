// Parametric glyph construction. Each character is described as a set of
// centreline "strokes" (plus a few filled shapes for dots/serifs). The offsetter
// in geometry.ts turns those skeletons into real outlines; overlapping strokes
// union automatically and closed strokes (bowls) produce holes — all via the
// non-zero winding rule. Proportions are derived from FontParams.
import type { FontParams, GlyphShape, Contour, Pt, Terminal } from './types'
import { UPM } from './params'
import {
  arc,
  ellipse,
  polygon,
  strokeToContours,
  transformContours,
  makeSlantWidth,
  boundsOf,
  type Stroke,
} from './geometry'

const rad = (d: number) => (d * Math.PI) / 180

interface Metrics {
  sw: number
  thin: number
  xh: number
  cap: number
  asc: number
  desc: number
  sb: number
  capStyle: Terminal
}

function metrics(p: FontParams): Metrics {
  const sw = Math.max(28, p.weight * UPM)
  const thin = Math.max(sw * 0.16, sw * (1 - p.contrast * 0.85))
  return {
    sw,
    thin,
    xh: p.xHeight * UPM,
    cap: p.capHeight * UPM,
    asc: p.ascender * UPM,
    desc: p.descender * UPM,
    sb: (sw * 0.7 + UPM * 0.026) * p.spacing,
    capStyle: p.terminal === 'round' || p.round > 0.55 ? 'round' : 'flat',
  }
}

/** Characters the engine can draw. Anything else renders as a blank advance. */
export const CHARSET =
  ' !"\'(),-./0123456789:;?' +
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
  'abcdefghijklmnopqrstuvwxyz'

export function buildGlyph(ch: string, p: FontParams): GlyphShape {
  const m = metrics(p)
  const { sw, thin, xh, cap, asc, desc, sb, capStyle } = m
  const strokes: Stroke[] = []
  const extra: Contour[] = []
  const x0 = sb

  // Stroke helper closures.
  const V = (xc: number, y0: number, y1: number, w = sw, cap = capStyle): void => {
    strokes.push({ pts: [[xc, y0], [xc, y1]], w, cap })
  }
  const H = (xa: number, xb: number, yc: number, w = thin, cap: Terminal = 'flat'): void => {
    strokes.push({ pts: [[xa, yc], [xb, yc]], w, cap })
  }
  const DG = (xa: number, ya: number, xb: number, yb: number, w = sw, cap = capStyle): void => {
    strokes.push({ pts: [[xa, ya], [xb, yb]], w, cap })
  }
  const ring = (cx: number, cy: number, rx: number, ry: number, w = sw): void => {
    strokes.push({ pts: ellipse(cx, cy, rx, ry), closed: true, w })
  }
  const arcS = (
    cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, w = sw, cap = capStyle,
  ): void => {
    strokes.push({ pts: arc(cx, cy, rx, ry, a0, a1), w, cap })
  }
  const dot = (cx: number, cy: number, r: number): void => {
    extra.push(polygon(ellipse(cx, cy, r, r)))
  }
  const path = (pts: Pt[], w = sw, cap = capStyle): void => {
    strokes.push({ pts, w, cap })
  }

  // Common radii.
  const ryLc = (xh - sw) / 2
  const rxLc = ryLc * p.counter
  const cyLc = xh / 2
  const RyUc = (cap - sw) / 2
  const RxUc = RyUc * p.counter
  const cyUc = cap / 2
  const ringW = (sw + thin) / 2 // monoline-ish ring weight (soft contrast)

  const isUpper = ch >= 'A' && ch <= 'Z'
  const isDigit = ch >= '0' && ch <= '9'

  switch (ch) {
    case ' ':
      return { advance: UPM * 0.3 * p.spacing * p.width, contours: [] }

    /* ---------- lowercase ---------- */
    case 'a': {
      ring(x0 + rxLc, cyLc, rxLc, ryLc, ringW)
      V(x0 + 2 * rxLc, 0, xh)
      break
    }
    case 'b': {
      V(x0, 0, asc)
      ring(x0 + rxLc, cyLc, rxLc, ryLc, ringW)
      break
    }
    case 'd': {
      V(x0 + 2 * rxLc, 0, asc)
      ring(x0 + rxLc, cyLc, rxLc, ryLc, ringW)
      break
    }
    case 'p': {
      V(x0, desc, xh)
      ring(x0 + rxLc, cyLc, rxLc, ryLc, ringW)
      break
    }
    case 'q': {
      V(x0 + 2 * rxLc, desc, xh)
      ring(x0 + rxLc, cyLc, rxLc, ryLc, ringW)
      break
    }
    case 'c':
      arcS(x0 + rxLc, cyLc, rxLc, ryLc, rad(58), rad(302), ringW)
      break
    case 'e': {
      arcS(x0 + rxLc, cyLc, rxLc, ryLc, rad(2), rad(330), ringW)
      H(x0, x0 + 2 * rxLc, cyLc, thin)
      break
    }
    case 'o':
      ring(x0 + rxLc, cyLc, rxLc, ryLc, ringW)
      break
    case 'g': {
      ring(x0 + rxLc, cyLc, rxLc, ryLc, ringW)
      V(x0 + 2 * rxLc, 0, xh)
      // Descender hook: starts at the stem foot and curls down-left.
      arcS(x0 + rxLc, 0, rxLc, Math.abs(desc) * 0.85, rad(0), rad(-150), ringW, 'round')
      break
    }
    case 's':
      path(sSpine(x0, 0, xh, rxLc), ringW)
      break
    case 'n': {
      const ry = Math.min(rxLc, xh * 0.46)
      V(x0, 0, xh)
      V(x0 + 2 * rxLc, 0, xh - ry)
      arcS(x0 + rxLc, xh - ry, rxLc, ry, rad(180), rad(0))
      break
    }
    case 'm': {
      const ry = Math.min(rxLc * 0.8, xh * 0.46)
      V(x0, 0, xh)
      V(x0 + 2 * rxLc, 0, xh - ry)
      V(x0 + 4 * rxLc, 0, xh - ry)
      arcS(x0 + rxLc, xh - ry, rxLc, ry, rad(180), rad(0))
      arcS(x0 + 3 * rxLc, xh - ry, rxLc, ry, rad(180), rad(0))
      break
    }
    case 'h': {
      const ry = Math.min(rxLc, xh * 0.46)
      V(x0, 0, asc)
      V(x0 + 2 * rxLc, 0, xh - ry)
      arcS(x0 + rxLc, xh - ry, rxLc, ry, rad(180), rad(0))
      break
    }
    case 'u': {
      const ry = Math.min(rxLc, xh * 0.46)
      V(x0, ry, xh)
      V(x0 + 2 * rxLc, 0, xh)
      arcS(x0 + rxLc, ry, rxLc, ry, rad(180), rad(360))
      break
    }
    case 'r': {
      const ry = Math.min(rxLc, xh * 0.46)
      V(x0, 0, xh)
      arcS(x0 + rxLc, xh - ry, rxLc, ry, rad(180), rad(55))
      break
    }
    case 'i':
      V(x0, 0, xh)
      dot(x0, xh + sw * 1.15, sw * 0.62)
      break
    case 'j': {
      const tail = Math.abs(desc) * 0.7
      V(x0 + rxLc, -tail + sw / 2, xh)
      arcS(x0 + rxLc * 0.5, -tail + sw / 2, rxLc * 0.5, tail, rad(0), rad(180), sw, 'round')
      dot(x0 + rxLc, xh + sw * 1.15, sw * 0.62)
      break
    }
    case 'l':
      V(x0, 0, asc)
      break
    case 't': {
      const bw = rxLc * 1.5
      V(x0 + bw * 0.42, 0, xh * 1.42)
      H(x0, x0 + bw, xh, thin)
      break
    }
    case 'f': {
      const ry = Math.min(rxLc, xh * 0.5)
      V(x0 + rxLc, 0, asc - ry)
      arcS(x0 + rxLc * 2, asc - ry, rxLc, ry, rad(180), rad(90))
      H(x0, x0 + 2 * rxLc, xh, thin)
      break
    }
    case 'k': {
      V(x0, 0, asc)
      DG(x0 + sw * 0.4, xh * 0.42, x0 + 1.8 * rxLc, xh, sw)
      DG(x0 + sw * 0.6, xh * 0.42, x0 + 1.9 * rxLc, 0, sw)
      break
    }
    case 'v':
      DG(x0, xh, x0 + rxLc, 0)
      DG(x0 + 2 * rxLc, xh, x0 + rxLc, 0)
      break
    case 'w': {
      const q = rxLc * 0.62
      DG(x0, xh, x0 + q, 0)
      DG(x0 + 2 * q, xh, x0 + q, 0)
      DG(x0 + 2 * q, xh, x0 + 3 * q, 0)
      DG(x0 + 4 * q, xh, x0 + 3 * q, 0)
      break
    }
    case 'x':
      DG(x0, xh, x0 + 2 * rxLc, 0)
      DG(x0, 0, x0 + 2 * rxLc, xh)
      break
    case 'y':
      DG(x0, xh, x0 + rxLc, 0)
      DG(x0 + 2 * rxLc, xh, x0 + rxLc * 0.4, desc)
      break
    case 'z':
      H(x0, x0 + 2 * rxLc, xh, sw)
      DG(x0 + 2 * rxLc, xh, x0, 0, sw)
      H(x0, x0 + 2 * rxLc, 0, sw)
      break

    /* ---------- uppercase ---------- */
    case 'A': {
      const w = RxUc * 1.05
      DG(x0, 0, x0 + w, cap)
      DG(x0 + 2 * w, 0, x0 + w, cap)
      H(x0 + w * 0.42, x0 + w * 1.58, cap * 0.34, sw)
      break
    }
    case 'B': {
      const ry = (cap - sw) / 4
      V(x0, 0, cap)
      arcS(x0, cap - ry, RxUc, ry, rad(90), rad(-90), sw)
      arcS(x0, ry, RxUc, ry, rad(90), rad(-90), sw)
      break
    }
    case 'C':
      arcS(x0 + RxUc, cyUc, RxUc, RyUc, rad(55), rad(305), sw)
      break
    case 'D':
      V(x0, 0, cap)
      arcS(x0, cyUc, RxUc * 1.1, RyUc, rad(90), rad(-90), sw)
      break
    case 'E':
      V(x0, 0, cap)
      H(x0, x0 + RxUc * 1.4, cap, sw)
      H(x0, x0 + RxUc * 1.25, cyUc, thin)
      H(x0, x0 + RxUc * 1.4, 0, sw)
      break
    case 'F':
      V(x0, 0, cap)
      H(x0, x0 + RxUc * 1.4, cap, sw)
      H(x0, x0 + RxUc * 1.25, cyUc, thin)
      break
    case 'G':
      arcS(x0 + RxUc, cyUc, RxUc, RyUc, rad(40), rad(305), sw)
      H(x0 + RxUc, x0 + 2 * RxUc, cyUc, sw)
      V(x0 + 2 * RxUc, cyUc, cyUc + sw / 2, sw)
      break
    case 'H':
      V(x0, 0, cap)
      V(x0 + 2 * RxUc, 0, cap)
      H(x0, x0 + 2 * RxUc, cyUc, sw)
      break
    case 'I':
      V(x0, 0, cap)
      break
    case 'J': {
      const ry = RyUc * 0.7
      V(x0 + RxUc, ry, cap)
      arcS(x0 + RxUc * 0.4, ry, RxUc * 0.6, ry, rad(0), rad(200), sw, 'round')
      break
    }
    case 'K':
      V(x0, 0, cap)
      DG(x0 + sw * 0.4, cyUc, x0 + 2 * RxUc, cap, sw)
      DG(x0 + sw * 0.4, cyUc, x0 + 2 * RxUc, 0, sw)
      break
    case 'L':
      V(x0, 0, cap)
      H(x0, x0 + RxUc * 1.3, 0, sw)
      break
    case 'M': {
      const w = RxUc
      V(x0, 0, cap)
      V(x0 + 2.4 * w, 0, cap)
      DG(x0, cap, x0 + 1.2 * w, cap * 0.25, sw)
      DG(x0 + 2.4 * w, cap, x0 + 1.2 * w, cap * 0.25, sw)
      break
    }
    case 'N':
      V(x0, 0, cap)
      V(x0 + 2 * RxUc, 0, cap)
      DG(x0, cap, x0 + 2 * RxUc, 0, sw)
      break
    case 'O':
      ring(x0 + RxUc, cyUc, RxUc, RyUc, sw)
      break
    case 'P': {
      const ry = (cap - sw) / 4
      V(x0, 0, cap)
      arcS(x0, cap - ry, RxUc, ry, rad(90), rad(-90), sw)
      break
    }
    case 'Q':
      ring(x0 + RxUc, cyUc, RxUc, RyUc, sw)
      DG(x0 + RxUc, cyUc * 0.7, x0 + 2 * RxUc, -cap * 0.05, sw)
      break
    case 'R': {
      const ry = (cap - sw) / 4
      V(x0, 0, cap)
      arcS(x0, cap - ry, RxUc, ry, rad(90), rad(-90), sw)
      DG(x0 + RxUc * 0.5, cyUc, x0 + 2 * RxUc, 0, sw)
      break
    }
    case 'S':
      path(sSpine(x0, 0, cap, RxUc), sw)
      break
    case 'T':
      V(x0 + RxUc, 0, cap)
      H(x0, x0 + 2 * RxUc, cap, sw)
      break
    case 'U': {
      const ry = RyUc * 0.6
      V(x0, ry, cap)
      V(x0 + 2 * RxUc, ry, cap)
      arcS(x0 + RxUc, ry, RxUc, ry, rad(180), rad(360), sw)
      break
    }
    case 'V':
      DG(x0, cap, x0 + RxUc, 0)
      DG(x0 + 2 * RxUc, cap, x0 + RxUc, 0)
      break
    case 'W': {
      const q = RxUc * 0.62
      DG(x0, cap, x0 + q, 0)
      DG(x0 + 2 * q, cap, x0 + q, 0)
      DG(x0 + 2 * q, cap, x0 + 3 * q, 0)
      DG(x0 + 4 * q, cap, x0 + 3 * q, 0)
      break
    }
    case 'X':
      DG(x0, cap, x0 + 2 * RxUc, 0)
      DG(x0, 0, x0 + 2 * RxUc, cap)
      break
    case 'Y':
      DG(x0, cap, x0 + RxUc, cyUc)
      DG(x0 + 2 * RxUc, cap, x0 + RxUc, cyUc)
      V(x0 + RxUc, 0, cyUc)
      break
    case 'Z':
      H(x0, x0 + 2 * RxUc, cap, sw)
      DG(x0 + 2 * RxUc, cap, x0, 0, sw)
      H(x0, x0 + 2 * RxUc, 0, sw)
      break

    /* ---------- digits ---------- */
    case '0':
      ring(x0 + RxUc * 0.85, cyUc, RxUc * 0.85, RyUc, sw)
      break
    case '1':
      V(x0 + RxUc * 0.6, 0, cap)
      DG(x0, cap * 0.74, x0 + RxUc * 0.6, cap, sw)
      break
    case '2':
      arcS(x0 + RxUc * 0.8, cap - RyUc * 0.7, RxUc * 0.8, RyUc * 0.7, rad(150), rad(-60), sw, 'round')
      DG(x0 + RxUc * 1.4, cap * 0.55, x0, 0, sw)
      H(x0, x0 + RxUc * 1.6, 0, sw)
      break
    case '3':
      arcS(x0, cap - RyUc * 0.55, RxUc * 0.85, RyUc * 0.55, rad(160), rad(-110), sw, 'round')
      arcS(x0, RyUc * 0.55, RxUc * 0.85, RyUc * 0.55, rad(110), rad(-160), sw, 'round')
      break
    case '4':
      V(x0 + RxUc * 1.2, 0, cap)
      DG(x0 + RxUc * 1.2, cap, x0, cap * 0.32, sw)
      H(x0, x0 + RxUc * 1.7, cap * 0.32, sw)
      break
    case '5': {
      const c5x = x0 + RxUc * 0.72
      H(x0, x0 + RxUc * 1.45, cap, sw) // top bar
      V(x0, cap * 0.5, cap) // left stem (upper)
      H(x0, c5x, cap * 0.5, sw * 0.85) // connector into the bowl
      arcS(c5x, cap * 0.29, RxUc * 0.78, cap * 0.29, rad(132), rad(-150), sw, 'round') // bowl
      break
    }
    case '6':
      ring(x0 + RxUc, RyUc * 0.58, RxUc, RyUc * 0.58, sw) // bottom bowl
      V(x0, RyUc * 0.58, cap) // left stem up to cap
      break
    case '7':
      H(x0, x0 + 2 * RxUc, cap, sw)
      DG(x0 + 2 * RxUc, cap, x0 + RxUc * 0.4, 0, sw)
      break
    case '8':
      ring(x0 + RxUc, cap - RyUc * 0.56, RxUc * 0.86, RyUc * 0.56, sw)
      ring(x0 + RxUc, RyUc * 0.6, RxUc, RyUc * 0.6, sw)
      break
    case '9':
      ring(x0 + RxUc, cap - RyUc * 0.58, RxUc, RyUc * 0.58, sw) // top bowl
      V(x0 + 2 * RxUc, 0, cap - RyUc * 0.58) // right stem down to baseline
      break

    /* ---------- punctuation ---------- */
    case '.':
      dot(x0 + sw * 0.5, sw * 0.55, sw * 0.58)
      break
    case ',':
      dot(x0 + sw * 0.5, sw * 0.55, sw * 0.58)
      DG(x0 + sw * 0.5, sw * 0.4, x0 + sw * 0.1, -sw * 1.1, thin * 0.9, 'round')
      break
    case ':':
      dot(x0 + sw * 0.5, sw * 0.55, sw * 0.58)
      dot(x0 + sw * 0.5, xh - sw * 0.5, sw * 0.58)
      break
    case ';':
      dot(x0 + sw * 0.5, xh - sw * 0.5, sw * 0.58)
      dot(x0 + sw * 0.5, sw * 0.55, sw * 0.58)
      DG(x0 + sw * 0.5, sw * 0.4, x0 + sw * 0.1, -sw * 1.1, thin * 0.9, 'round')
      break
    case '!':
      V(x0 + sw * 0.4, xh * 0.34, cap, sw)
      dot(x0 + sw * 0.4, sw * 0.55, sw * 0.58)
      break
    case '?': {
      const r = RxUc * 0.7
      arcS(x0 + r, cap - r, r, r, rad(180), rad(-40), sw, 'round')
      V(x0 + r, xh * 0.5, cap - r, sw)
      dot(x0 + r, sw * 0.55, sw * 0.58)
      break
    }
    case '"':
      V(x0 + sw * 0.4, cap - sw * 1.4, cap, thin)
      V(x0 + sw * 1.5, cap - sw * 1.4, cap, thin)
      break
    case "'":
      V(x0 + sw * 0.4, cap - sw * 1.4, cap, thin)
      break
    case '-':
      H(x0, x0 + RxUc * 1.1, xh * 0.5, sw)
      break
    case '(':
      arcS(x0 + RxUc, cyUc, RxUc * 0.9, cap * 0.6, rad(110), rad(250), thin, 'round')
      break
    case ')':
      arcS(x0 - RxUc * 0.2, cyUc, RxUc * 0.9, cap * 0.6, rad(70), rad(-70), thin, 'round')
      break
    case '/':
      DG(x0, -cap * 0.05, x0 + RxUc * 1.1, cap, sw)
      break

    default:
      // Unknown character: emit a small blank advance so layout never breaks.
      return { advance: UPM * 0.4 * p.spacing * p.width, contours: [] }
  }

  // Optional slab/wedge serifs on the feet & heads of vertical/diagonal stems.
  if (p.serif !== 'none' && !isDigit) {
    addSerifs(strokes, extra, p, m, isUpper)
  }

  let contours: Contour[] = []
  for (const s of strokes) contours.push(...strokeToContours(s))
  contours.push(...extra)

  const b = boundsOf(contours)
  const advanceRaw = Math.max(UPM * 0.18, b.maxX + sb)

  const tf = makeSlantWidth(p.slant, p.width)
  contours = transformContours(contours, tf)
  return { advance: advanceRaw * p.width, contours }
}

/** A smooth S/s spine: a vertical double-bend the offsetter strokes into shape. */
function sSpine(x0: number, yb: number, yt: number, rx: number): Pt[] {
  const pts: Pt[] = []
  const n = 30
  const h = yt - yb
  const cx = x0 + rx
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const y = yb + h * t
    const x = cx + rx * 0.92 * Math.sin(Math.PI * 2 * t)
    pts.push([x, y])
  }
  return pts
}

/** Add simple slab/wedge serifs at the vertical extremes of stems. */
function addSerifs(strokes: Stroke[], extra: Contour[], p: FontParams, m: Metrics, isUpper: boolean) {
  const len = Math.max(m.thin * 1.4, p.serifSize * UPM)
  const half = len
  const t = Math.max(m.thin * 0.7, m.sw * 0.32)
  const feet: Array<[number, number]> = []
  for (const s of strokes) {
    if (s.closed) continue
    const [a, b] = [s.pts[0], s.pts[s.pts.length - 1]]
    // Only near-vertical strokes get serifs.
    if (Math.abs(a[0] - b[0]) > Math.abs(a[1] - b[1]) * 0.4) continue
    for (const pt of [a, b]) {
      // Baseline, x-height, cap, ascender feet (avoid mid-stroke joins).
      const y = pt[1]
      const atExtreme =
        Math.abs(y) < 2 ||
        Math.abs(y - m.xh) < 2 ||
        Math.abs(y - m.cap) < 2 ||
        Math.abs(y - m.asc) < 2 ||
        Math.abs(y - m.desc) < 2
      if (atExtreme) feet.push([pt[0], pt[1]])
    }
  }
  for (const [fx, fy] of feet) {
    if (p.serif === 'wedge') {
      extra.push(
        polygon([
          [fx - half, fy],
          [fx + half, fy],
          [fx, fy + (fy < UPM * 0.4 ? t * 1.6 : -t * 1.6)],
        ]),
      )
    } else {
      extra.push(
        polygon([
          [fx - half, fy - t / 2],
          [fx + half, fy - t / 2],
          [fx + half, fy + t / 2],
          [fx - half, fy + t / 2],
        ]),
      )
    }
  }
}
