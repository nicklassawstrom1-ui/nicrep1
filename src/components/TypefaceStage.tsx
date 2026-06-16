import { useState } from 'react'
import { useStudio } from '../store/studio'
import { useLibrary } from '../store/library'
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

export default function TypefaceStage() {
  const { name, setName, displayText, setDisplayText, params, prompt, image } = useStudio()
  const add = useLibrary((s) => s.add)
  const [saved, setSaved] = useState(false)

  const sample = displayText?.trim() || 'Hamburgefonts'

  function save() {
    const creation: Creation = {
      id: crypto.randomUUID(),
      name: name || 'Untitled',
      mode: 'typeface',
      prompt,
      params,
      display: NEUTRAL,
      sampleText: sample,
      refThumb: image?.dataUrl ?? null,
      createdAt: Date.now(),
    }
    add(creation)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const file = sanitizeFileName(name)

  const lines: Array<{ label: string; text: string }> = [
    { label: 'Sample', text: sample },
    { label: 'Uppercase', text: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
    { label: 'Lowercase', text: 'abcdefghijklmnopqrstuvwxyz' },
    { label: 'Numerals & punctuation', text: '0123456789 . , : ; ! ?' },
  ]

  return (
    <div>
      <div className="stage-head">
        <input className="name-input" value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" />
        <span className="grow" />
        <button className="btn primary" onClick={save}>
          {saved ? '✓ Saved' : 'Save to library'}
        </button>
      </div>

      <input
        className="text-input"
        value={displayText}
        onChange={(e) => setDisplayText(e.target.value)}
        placeholder="Sample text…"
        style={{ marginBottom: 18 }}
      />

      <div className="card specimen">
        {lines.map((l) => (
          <div className="line" key={l.label}>
            <div className="label">{l.label}</div>
            <WordSvg text={l.text} params={params} display={NEUTRAL} />
          </div>
        ))}
      </div>

      <div className="toolbar">
        <button className="btn primary" onClick={() => downloadFont(params, name, 'otf')}>
          ↓ Download .otf
        </button>
        <button className="btn" onClick={() => downloadFont(params, name, 'ttf')}>
          ↓ Download .ttf
        </button>
      </div>
      <p className="note">
        Typeface mode builds a real, installable font covering A–Z, a–z, 0–9 and punctuation. Download
        the <b>.otf</b> / <b>.ttf</b> and use it in any app.
      </p>
    </div>
  )
}
