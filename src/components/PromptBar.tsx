import { useRef, type ChangeEvent } from 'react'
import { useStudio } from '../store/studio'
import { interpretPrompt } from '../interpret/client'
import type { ImageInput } from '../interpret/schema'

interface Props {
  apiAvailable: boolean | null
}

export default function PromptBar({ apiAvailable }: Props) {
  const { prompt, setPrompt, image, setImage, busy, setBusy, applyInterpretation, lastSource, lastNotes } =
    useStudio()
  const fileRef = useRef<HTMLInputElement>(null)

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
      <p className="note">
        {apiAvailable === false && (
          <>
            <b>Offline mode.</b> Using built-in keyword interpretation. Add an{' '}
            <code>ANTHROPIC_API_KEY</code> to <code>.env</code> for richer prompts &amp; image analysis.
          </>
        )}
        {apiAvailable === true && lastSource == null && (
          <>
            <b>Claude connected.</b> Describe a vibe, or upload an image and say “similar to this”.
          </>
        )}
        {lastSource && (
          <>
            <b>{lastSource === 'api' ? 'Interpreted by Claude.' : 'Interpreted offline.'}</b>{' '}
            {lastNotes}
          </>
        )}
      </p>
    </div>
  )
}
