import { useMemo, useState } from 'react'
import { useStudio } from '../store/studio'
import { buildClaudePrompt, parseClaudeReply } from '../interpret/bridge'

interface Props {
  onClose: () => void
}

/** Free "use your own Claude" flow: copy a prompt out, paste the JSON reply back. */
export default function BridgeModal({ onClose }: Props) {
  const { prompt, image, applyInterpretation } = useStudio()
  const claudePrompt = useMemo(() => buildClaudePrompt(prompt, !!image), [prompt, image])
  const [reply, setReply] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(claudePrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('Copy failed — select the text and copy manually.')
    }
  }

  function apply() {
    try {
      const result = parseClaudeReply(reply)
      applyInterpretation(result)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that reply.')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Use your own Claude — free</h2>
          <button className="btn ghost tiny" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="note" style={{ marginTop: 0 }}>
          No API key or cost — this uses the Claude you already have. Copy the prompt, paste it into
          Claude, then paste its reply back here.
        </p>

        <div className="step">
          <div className="step-label">
            <span className="num">1</span> Copy this prompt
          </div>
          <textarea className="mono" readOnly value={claudePrompt} rows={7} />
          <div className="row">
            <button className="btn primary tiny" onClick={copyPrompt}>
              {copied ? '✓ Copied' : 'Copy prompt'}
            </button>
            <a className="btn tiny" href="https://claude.ai/new" target="_blank" rel="noreferrer">
              Open claude.ai ↗
            </a>
            {image && <span className="thumb-chip"><img src={image.dataUrl} alt="ref" /> attach this in Claude</span>}
          </div>
        </div>

        <div className="step">
          <div className="step-label">
            <span className="num">2</span> Paste Claude's reply
          </div>
          <textarea
            className="mono"
            value={reply}
            onChange={(e) => {
              setReply(e.target.value)
              setError(null)
            }}
            rows={6}
            placeholder='Paste the JSON Claude returns, e.g. { "name": "Juniper", "weight": 0.13, ... }'
          />
          {error && <p className="err">{error}</p>}
          <div className="row">
            <button className="btn primary" onClick={apply} disabled={!reply.trim()}>
              Apply to design
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
