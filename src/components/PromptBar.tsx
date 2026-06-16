import { useRef, useState, type ChangeEvent } from 'react'
import { useStudio } from '../store/studio'
import { interpretPrompt } from '../interpret/client'
import type { ImageInput } from '../interpret/schema'
import BridgeModal from './BridgeModal'

interface Props {
  apiAvailable: boolean | null
}

export default function PromptBar({ apiAvailable }: Props) {
  const { prompt, setPrompt, image, setImage, busy, setBusy, applyInterpretation, lastSource, lastNotes } =
    useStudio()
  const fileRef = useRef<HTMLInputElement>(null)
  const [showBridge, setShowBridge] = useState(false)

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    const img: ImageInput = {
      dataUrl,
      base64: dataUrl.split(',')[1] ?? '',
      media_type: file.type || 'image/png',
    }
    setImage(img)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function generate() {
    if (busy) return
    if (!prompt.trim() && !image) return
    setBusy(true)
    try {
      const result = await interpretPrompt(prompt, image)
      applyInterpretation(result)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card prompt-box">
      <p className="section-title">Describe your type</p>
      <textarea
        placeholder={'e.g. "a bold, friendly rounded sans for a juice brand" — or upload a reference image and say "similar to this"'}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate()
        }}
      />
      <div className="prompt-row">
        <button className="btn primary" onClick={generate} disabled={busy}>
          {busy ? 'Designing…' : '✦ Generate'}
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()} disabled={busy}>
          Image
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
        {image && (
          <span className="thumb-chip">
            <img src={image.dataUrl} alt="reference" />
            reference
            <button className="inline-link" onClick={() => setImage(null)} title="Remove">
              ✕
            </button>
          </span>
        )}
      </div>
      <div className="prompt-row">
        <button className="btn" onClick={() => setShowBridge(true)} title="Use the Claude you already have — free">
          ✦ Use my Claude <span className="free-pill">free</span>
        </button>
      </div>
      <p className="note">
        {!lastSource && apiAvailable === false && (
          <>
            <b>Generate</b> uses built-in keyword interpretation (free, offline). For real Claude
            understanding at no cost, tap <b>Use my Claude</b>.
          </>
        )}
        {!lastSource && apiAvailable === true && (
          <>
            <b>Claude connected.</b> Describe a vibe, or upload an image and say “similar to this”.
          </>
        )}
        {!lastSource && apiAvailable == null && <>Describe the type you want, then Generate.</>}
        {lastSource && (
          <>
            <b>{lastSource === 'offline' ? 'Interpreted offline.' : 'Designed with Claude.'}</b>{' '}
            {lastNotes}
          </>
        )}
      </p>
      {showBridge && <BridgeModal onClose={() => setShowBridge(false)} />}
    </div>
  )
}
