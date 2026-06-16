import { useMemo } from 'react'
import { renderWordSvg } from '../engine/render'
import type { FontParams, DisplayStyle } from '../engine/types'

interface Props {
  text: string
  params: FontParams
  display: DisplayStyle
  background?: boolean
  pad?: number
  className?: string
}

/** Renders a word to SVG using the engine and injects the markup. */
export default function WordSvg({ text, params, display, background = false, pad, className }: Props) {
  const markup = useMemo(
    () => renderWordSvg(text, params, display, { background, pad }).markup,
    [text, params, display, background, pad],
  )
  return <div className={className ?? 'svg-host'} dangerouslySetInnerHTML={{ __html: markup }} />
}
