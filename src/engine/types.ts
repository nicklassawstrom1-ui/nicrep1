// Core type definitions for the Typeforge parametric engine.

export type SerifStyle = 'none' | 'slab' | 'wedge'
export type Terminal = 'flat' | 'round'

/**
 * FontParams is the full parametric description of a typeface. Every value is
 * resolution-independent: lengths are expressed as a fraction of the em (UPM),
 * angles in degrees, and unitless multipliers where noted. The engine turns
 * these numbers into real glyph outlines, so two FontParams that differ produce
 * genuinely different letterforms — this is where "originality" comes from.
 */
export interface FontParams {
  /** Stem thickness as a fraction of the em. Higher = bolder. */
  weight: number
  /** Thick/thin stroke modulation, 0 (monoline) .. ~0.85 (high contrast). */
  contrast: number
  /** x-height as a fraction of the em. */
  xHeight: number
  /** Cap height as a fraction of the em. */
  capHeight: number
  /** Ascender height as a fraction of the em. */
  ascender: number
  /** Descender depth as a (negative) fraction of the em. */
  descender: number
  /** Horizontal scale multiplier. <1 condensed, >1 extended. */
  width: number
  /** Italic slant in degrees (positive = leans forward). */
  slant: number
  /** Terminal/corner rounding, 0 (sharp) .. 1 (fully round). */
  round: number
  /** Serif treatment. */
  serif: SerifStyle
  /** Serif length as a fraction of the em. */
  serifSize: number
  /** Stroke terminal style. */
  terminal: Terminal
  /** Counter (inner negative space) size multiplier. */
  counter: number
  /** Letter-spacing / tracking multiplier. */
  spacing: number
}

export type DisplayEffect = 'none' | 'outline' | 'shadow' | 'stack' | 'wave'

/** Purely visual treatment used by Display mode (does not affect the outlines). */
export interface DisplayStyle {
  /** Primary fill color (CSS). */
  fill: string
  /** Optional second color — when set, the fill becomes a vertical gradient. */
  fill2: string | null
  /** Canvas background color (CSS). */
  background: string
  /** Accent color used by shadow / stack / outline effects. */
  accent: string
  /** Graphical effect applied to the word. */
  effect: DisplayEffect
}

export type CreationMode = 'display' | 'typeface'

/** A saved creation in the user's library. Fonts/SVG are regenerated from params. */
export interface Creation {
  id: string
  name: string
  mode: CreationMode
  /** The natural-language prompt that produced it (if any). */
  prompt: string
  params: FontParams
  display: DisplayStyle
  /** The word/sentence captured with a Display creation. */
  sampleText: string
  /** Small data-URL thumbnail of a reference image, if one was used. */
  refThumb: string | null
  createdAt: number
}

/** Geometry primitive: a point in font space (y-up, baseline at 0). */
export type Pt = [number, number]
/** A closed polygon. CCW winding = filled area; CW = hole (non-zero fill rule). */
export type Contour = Pt[]

/** A single rendered glyph: its outlines plus how far the pen advances after it. */
export interface GlyphShape {
  advance: number
  contours: Contour[]
}
