import { useMemo, useState } from 'react'
import { useLibrary } from '../store/library'
import { downloadSvg } from '../engine/render'
import { downloadFont, sanitizeFileName } from '../engine/font'
import WordSvg from './WordSvg'
import type { Creation, DisplayStyle } from '../engine/types'

const NEUTRAL: DisplayStyle = {
  fill: '#15161a',
  fill2: null,
  background: '#ffffff',
  accent: '#15161a',
  effect: 'none',
}

interface Props {
  onOpen: (c: Creation) => void
}

export default function Library({ onOpen }: Props) {
  const { creations, remove } = useLibrary()
  const [compareWord, setCompareWord] = useState('Hamburger')
  const [showColors, setShowColors] = useState(false)
  const [excluded, setExcluded] = useState<Set<string>>(new Set())

  const included = useMemo(
    () => creations.filter((c) => !excluded.has(c.id)),
    [creations, excluded],
  )

  function toggle(id: string) {
    setExcluded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (creations.length === 0) {
    return (
      <div className="lib-wrap">
        <div className="empty">
          <h3>Your library is empty</h3>
          <p>
            Generate a typeface in Display or Typeface mode, then hit <b>Save to library</b>. Saved
            creations show up here to compare side by side.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="lib-wrap">
      <section style={{ marginBottom: 34 }}>
        <p className="section-title">Compare — type a word, see it in every saved type</p>
        <div className="compare-controls">
          <input
            className="text-input"
            style={{ maxWidth: 360 }}
            value={compareWord}
            onChange={(e) => setCompareWord(e.target.value)}
            placeholder="Type a word to compare…"
          />
          <button
            className={`chip-toggle ${showColors ? 'on' : ''}`}
            onClick={() => setShowColors((v) => !v)}
          >
            {showColors ? '● Colors on' : '○ Letterforms only'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {creations.map((c) => (
            <button
              key={c.id}
              className={`chip-toggle ${excluded.has(c.id) ? '' : 'on'}`}
              onClick={() => toggle(c.id)}
              title="Toggle in comparison"
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="compare-list">
          {included.length === 0 && <p className="note">Select at least one typeface above.</p>}
          {included.map((c) => (
            <div className="compare-row" key={c.id}>
              <div className="cname">{c.name}</div>
              <div className="sample" style={{ maxHeight: 80 }}>
                <WordSvg
                  text={compareWord || 'Hamburger'}
                  params={c.params}
                  display={showColors ? c.display : NEUTRAL}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="section-title">All saved ({creations.length})</p>
        <div className="lib-grid">
          {creations.map((c) => (
            <div className="lib-card" key={c.id}>
              <div
                className="preview"
                style={{ background: c.mode === 'display' ? c.display.background : '#fff' }}
              >
                <WordSvg
                  text={shorten(c.sampleText || c.name)}
                  params={c.params}
                  display={c.mode === 'display' ? c.display : NEUTRAL}
                />
              </div>
              <div className="meta">
                <span className="nm">
                  {c.name} <span className={`tag ${c.mode === 'typeface' ? 'type' : ''}`}>{c.mode}</span>
                </span>
                <span className="sub">{c.prompt ? truncate(c.prompt, 60) : '—'}</span>
              </div>
              <div className="actions">
                <button className="btn tiny" onClick={() => onOpen(c)}>
                  Open
                </button>
                {c.mode === 'typeface' ? (
                  <button className="btn tiny" onClick={() => downloadFont(c.params, c.name, 'otf')}>
                    .otf
                  </button>
                ) : (
                  <button
                    className="btn tiny"
                    onClick={() => downloadSvg(c.sampleText || c.name, c.params, c.display, sanitizeFileName(c.name))}
                  >
                    SVG
                  </button>
                )}
                <span style={{ flex: 1 }} />
                <button className="btn tiny ghost" onClick={() => remove(c.id)} title="Delete">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function shorten(s: string): string {
  return s.length > 12 ? s.slice(0, 12) : s
}
function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}
