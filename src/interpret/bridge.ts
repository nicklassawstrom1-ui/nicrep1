// Free "bring your own Claude" bridge: build a prompt the user pastes into
// claude.ai / Claude Code (covered by their subscription), then parse the JSON
// reply they paste back. No API key, no cost, works fully client-side.
import type { InterpretResult } from './schema'
import { normalizeSpec } from './normalize'

/** The spec we ask Claude to fill in — kept in sync with the engine parameters. */
const FIELD_GUIDE = `{
  "name": string — short evocative name (1-3 words),
  "weight": number — stroke thickness, fraction of em (0.03 hairline, 0.08 regular, 0.14 bold, 0.18 black),
  "contrast": number — thick/thin modulation (0 monoline, 0.3 some, 0.7 high-contrast),
  "xHeight": number — x-height fraction (0.42–0.58),
  "capHeight": number — cap height fraction (0.62–0.78),
  "ascender": number — ascender fraction (0.66–0.86),
  "descender": number — descender fraction, negative (-0.30 to -0.08),
  "width": number — horizontal scale (0.7 condensed, 1.0 normal, 1.4 extended),
  "slant": number — italic angle in degrees (0 upright, 12–18 italic),
  "round": number — corner/terminal roundness (0 sharp, 1 round),
  "serif": "none" | "slab" | "wedge",
  "serifSize": number — serif length fraction (0–0.10),
  "terminal": "flat" | "round",
  "counter": number — inner counter size multiplier (0.8 tight, 1.2 open),
  "spacing": number — tracking multiplier (0.8 tight, 1.4 airy),
  "fill": string — primary letter color hex (optional),
  "fill2": string — second hex for a vertical gradient (optional),
  "background": string — canvas background hex (optional),
  "accent": string — accent hex for effects (optional),
  "effect": "none" | "outline" | "shadow" | "stack" | "wave" (optional),
  "notes": string — one short sentence describing the look (optional)
}`

/** Build the prompt the user copies into their own Claude. */
export function buildClaudePrompt(description: string, hasImage: boolean): string {
  const desc = description.trim() || 'a clean, original display typeface'
  return `You are the type-design brain for "Typeforge", a tool that generates ORIGINAL typefaces.
Design a NEW, original typeface for this request${hasImage ? ' and the attached reference image' : ''}:

"${desc}"
${hasImage ? '\n(If I attached an image, infer its typographic character — weight, contrast, serif vs sans, width, terminals, mood — and design something INSPIRED BY it, never a copy.)\n' : ''}
Reply with ONLY a single JSON object (no markdown code fences, no commentary before or after) using any of these keys. Pick concrete values that capture the style; omit colors unless the request implies a vibe:

${FIELD_GUIDE}`
}

/**
 * Parse Claude's pasted reply into an InterpretResult. Tolerant of code fences
 * and surrounding prose — extracts the first JSON object it can parse.
 */
export function parseClaudeReply(text: string): InterpretResult {
  const cleaned = text.trim()
  if (!cleaned) throw new Error('Nothing pasted yet.')

  const candidates: string[] = []
  // Prefer a fenced ```json ... ``` block if present.
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) candidates.push(fence[1])
  // Otherwise the first {...} span (greedy to capture nested braces).
  const brace = cleaned.match(/\{[\s\S]*\}/)
  if (brace) candidates.push(brace[0])
  candidates.push(cleaned)

  for (const c of candidates) {
    try {
      const obj = JSON.parse(c)
      if (obj && typeof obj === 'object') {
        return normalizeSpec(obj as Record<string, unknown>, 'bridge')
      }
    } catch {
      // try next candidate
    }
  }
  throw new Error("Couldn't find valid JSON in that reply. Paste the whole JSON object Claude returned.")
}
