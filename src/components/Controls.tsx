import { useStudio } from '../store/studio'
import {
  SLIDER_DEFS,
  SERIF_OPTIONS,
  TERMINAL_OPTIONS,
  PRESETS,
  DEFAULT_DISPLAY,
  type SliderDef,
} from '../engine/params'
import type { DisplayEffect, FontParams } from '../engine/types'

const EFFECTS: DisplayEffect[] = ['none', 'outline', 'shadow', 'stack', 'wave']

function fmt(def: SliderDef, v: number): string {
  if (def.key === 'slant') return `${Math.round(v)}°`
  if (def.key === 'width' || def.key === 'counter' || def.key === 'spacing') return `${v.toFixed(2)}×`
  return v.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
}

export default function Controls() {
  const { mode, params, display, setParam, setParams, setDisplay } = useStudio()

  const groups: SliderDef['group'][] = ['Shape', 'Proportion', 'Detail']

  return (
    <div className="card control-group">
      <div>
        <p className="section-title">Presets</p>
        <div className="preset-grid">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => {
                setParams(p.params)
                if (p.display) setDisplay(p.display)
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="section-title">Letterform</p>
        <div className="control-group">
          {/* Serif + terminal segmented controls */}
          <div>
            <div className="group-label">Serif</div>
            <div className="seg">
              {SERIF_OPTIONS.map((s) => (
                <button
                  key={s}
                  className={params.serif === s ? 'active' : ''}
                  onClick={() => setParam('serif', s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="group-label">Terminal</div>
            <div className="seg">
              {TERMINAL_OPTIONS.map((s) => (
                <button
                  key={s}
                  className={params.terminal === s ? 'active' : ''}
                  onClick={() => setParam('terminal', s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {groups.map((g) => (
            <div key={g} className="control-group">
              <div className="group-label">{g}</div>
              {SLIDER_DEFS.filter((d) => d.group === g).map((def) => (
                <div className="slider" key={def.key}>
                  <label>
                    <span>{def.label}</span>
                    <span className="val">{fmt(def, params[def.key] as number)}</span>
                  </label>
                  <input
                    type="range"
                    min={def.min}
                    max={def.max}
                    step={def.step}
                    value={params[def.key] as number}
                    onChange={(e) => setParam(def.key as keyof FontParams, Number(e.target.value) as never)}
                  />
                  {def.hint && <div className="hint">{def.hint}</div>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {mode === 'display' && (
        <div>
          <p className="section-title">Color &amp; effect</p>
          <div className="control-group">
            <ColorRow label="Letters" value={display.fill} onChange={(v) => setDisplay({ fill: v })} />
            <div className="field-row">
              <span>Gradient</span>
              <input
                type="checkbox"
                checked={display.fill2 != null}
                onChange={(e) => setDisplay({ fill2: e.target.checked ? display.fill2 || '#e0533d' : null })}
              />
            </div>
            {display.fill2 != null && (
              <ColorRow label="Gradient end" value={display.fill2} onChange={(v) => setDisplay({ fill2: v })} />
            )}
            <ColorRow label="Background" value={display.background} onChange={(v) => setDisplay({ background: v })} />
            <ColorRow label="Accent" value={display.accent} onChange={(v) => setDisplay({ accent: v })} />
            <div>
              <div className="group-label">Effect</div>
              <div className="seg" style={{ flexWrap: 'wrap' }}>
                {EFFECTS.map((ef) => (
                  <button
                    key={ef}
                    className={display.effect === ef ? 'active' : ''}
                    onClick={() => setDisplay({ effect: ef })}
                  >
                    {ef}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="btn ghost tiny"
              onClick={() => setDisplay({ ...DEFAULT_DISPLAY })}
              style={{ alignSelf: 'flex-start' }}
            >
              Reset colors
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="field-row">
      <span>{label}</span>
      <input
        className="swatch"
        type="color"
        value={toHex(value)}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

/** <input type=color> requires #rrggbb; coerce anything else to a safe default. */
function toHex(v: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : '#000000'
}
