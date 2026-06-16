import { useState } from 'react'
import { useStudio } from '../store/studio'
import { useLibrary } from '../store/library'
import { downloadSvg, downloadPng } from '../engine/render'
import { sanitizeFileName } from '../engine/font'
import WordSvg from './WordSvg'
import type { Creation } from '../engine/types'

export default function DisplayStage() {
  const { name, setName, displayText, setDisplayText, params, display, prompt, image } = useStudio()
  const add = useLibrary((s) => s.add)
  const [saved, setSaved] = useState(false)

  function save() {
    const creation: Creation = {
      id: crypto.randomUUID(),
      name: name || 'Untitled',
      mode: 'display',
      prompt,
      params,
      display,
      sampleText: displayText,
      refThumb: image?.dataUrl ?? null,
      createdAt: Date.now(),
    }
    add(creation)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const file = sanitizeFileName(name || displayText)

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
        placeholder="Type a word or headline…"
        style={{ marginBottom: 16 }}
      />

      <div className="canvas" style={{ background: display.background }}>
        <WordSvg text={displayText || 'Type something'} params={params} display={display} />
      </div>

      <div className="toolbar">
        <button className="btn" onClick={() => downloadSvg(displayText || 'Typeforge', params, display, file)}>
          ↓ SVG (vector)
        </button>
        <button className="btn" onClick={() => downloadPng(displayText || 'Typeforge', params, display, file)}>
          ↓ PNG
        </button>
      </div>
      <p className="note">
        Display mode renders just the letters you type — perfect for logos &amp; headlines. Export the
        vector <b>SVG</b> for crisp use anywhere, or a transparent <b>PNG</b>.
      </p>
    </div>
  )
}
