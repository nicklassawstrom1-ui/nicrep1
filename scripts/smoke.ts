// Engine smoke test (DOM-free): bundled with esbuild and run in Node.
import { buildGlyph, CHARSET } from '../src/engine/glyphs'
import { renderWordSvg } from '../src/engine/render'
import { buildFont, fontToArrayBuffer } from '../src/engine/font'
import { DEFAULT_PARAMS, PRESETS } from '../src/engine/params'
import type { DisplayStyle } from '../src/engine/types'

let issues = 0
const fail = (msg: string) => {
  console.log('  ✗', msg)
  issues++
}

// 1) Every glyph builds with finite geometry and a positive advance.
for (const ch of CHARSET) {
  const g = buildGlyph(ch, DEFAULT_PARAMS)
  if (!(g.advance > 0)) fail(`advance<=0 for ${JSON.stringify(ch)} (${g.advance})`)
  for (const c of g.contours)
    for (const [x, y] of c)
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        fail(`NaN point in ${JSON.stringify(ch)}`)
        break
      }
}
console.log(`glyphs: built ${CHARSET.length} chars`)

// 2) Words render to SVG with each effect.
const disp = (effect: DisplayStyle['effect']): DisplayStyle => ({
  fill: '#111418', fill2: null, background: '#f5f3ee', accent: '#e0533d', effect,
})
for (const ef of ['none', 'outline', 'shadow', 'stack', 'wave'] as const) {
  const r = renderWordSvg('Typeforge 0123', DEFAULT_PARAMS, disp(ef))
  if (!r.markup.includes('<path')) fail(`no <path> for effect ${ef}`)
  if (!(r.width > 0 && r.height > 0)) fail(`bad size for effect ${ef}`)
}
console.log('render: all effects produced SVG')

// 3) Every preset compiles to a real font of reasonable size.
for (const p of PRESETS) {
  const ab = fontToArrayBuffer(buildFont(p.params, p.name))
  if (!(ab.byteLength > 3000)) fail(`tiny font for ${p.name} (${ab.byteLength} bytes)`)
}
console.log(`fonts: compiled ${PRESETS.length} presets`)

// 4) Bridge: prompt builds, and replies parse tolerantly (fenced / prose / bare).
import { buildClaudePrompt, parseClaudeReply } from '../src/interpret/bridge'
if (!buildClaudePrompt('bold rounded retro', true).includes('JSON')) fail('bridge prompt missing JSON instruction')
const replies = [
  '```json\n{"name":"Juno","weight":0.14,"serif":"slab","fill":"#112233"}\n```',
  'Here you go!\n\n{"name":"Vela","weight":0.06,"contrast":0.7,"terminal":"round"}\n\nHope that helps.',
  '{"weight":0.1,"width":0.8,"effect":"stack"}',
]
for (const r of replies) {
  const res = parseClaudeReply(r)
  if (!res.params || res.params.weight === undefined) fail(`bridge parse missed weight in: ${r.slice(0, 30)}…`)
  if (res.source !== 'bridge') fail('bridge parse wrong source')
}
try {
  parseClaudeReply('sorry, no json here')
  fail('bridge parse should have thrown on junk')
} catch {
  /* expected */
}
console.log('bridge: prompt builds, replies parse, junk rejected')

console.log(issues === 0 ? '\nALL CHECKS PASSED ✓' : `\n${issues} ISSUE(S) ✗`)
process.exit(issues === 0 ? 0 : 1)
