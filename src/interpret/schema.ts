import type { FontParams, DisplayStyle } from '../engine/types'

/** An uploaded reference image in the forms each consumer needs. */
export interface ImageInput {
  /** Raw base64 (no data: prefix) — sent to the API. */
  base64: string
  /** MIME type, e.g. image/png. */
  media_type: string
  /** Full data URL — used for offline canvas analysis and thumbnails. */
  dataUrl: string
}

/** Result of turning a prompt/image into typeface settings. */
export interface InterpretResult {
  params: Partial<FontParams>
  display?: Partial<DisplayStyle>
  name?: string
  notes?: string
  source: 'api' | 'offline'
}
