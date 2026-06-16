// Vite dev-server middleware exposing /api/interpret and /api/status.
// The Anthropic API key is read server-side only and never reaches the browser.
// When no key is configured the endpoint reports unavailable and the client
// falls back to offline keyword parsing.
import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

const DEFAULT_MODEL = 'claude-opus-4-8'

/** JSON-schema for the forced tool: every field optional, clamped client-side. */
const TOOL = {
  name: 'set_typeface',
  description:
    'Define an original typeface from the user description and/or reference image. ' +
    'Return parameters that capture the requested STYLE. Be decisive and pick concrete values.',
  input_schema: {
    type: 'object' as const,
    additionalProperties: false,
    properties: {
      name: { type: 'string', description: 'A short, evocative name for this typeface (1-3 words).' },
      weight: { type: 'number', description: 'Stroke thickness, fraction of em. 0.03 hairline … 0.08 regular … 0.14 bold … 0.18 black.' },
      contrast: { type: 'number', description: 'Thick/thin modulation. 0 monoline, 0.3 some, 0.7 high-contrast (Didone-like).' },
      xHeight: { type: 'number', description: 'x-height fraction of em, 0.42 small … 0.56 large.' },
      capHeight: { type: 'number', description: 'Cap height fraction of em, ~0.62–0.78.' },
      ascender: { type: 'number', description: 'Ascender fraction, ~0.66–0.86.' },
      descender: { type: 'number', description: 'Descender fraction (negative), ~ -0.3 … -0.08.' },
      width: { type: 'number', description: 'Horizontal scale. 0.7 condensed, 1.0 normal, 1.4 extended.' },
      slant: { type: 'number', description: 'Italic angle in degrees. 0 upright, 12–18 italic.' },
      round: { type: 'number', description: 'Corner/terminal roundness, 0 sharp … 1 fully round.' },
      serif: { type: 'string', enum: ['none', 'slab', 'wedge'], description: 'Serif treatment.' },
      serifSize: { type: 'number', description: 'Serif length fraction of em, ~0–0.1.' },
      terminal: { type: 'string', enum: ['flat', 'round'], description: 'Stroke terminal style.' },
      counter: { type: 'number', description: 'Inner counter size multiplier, 0.8 tight … 1.2 open.' },
      spacing: { type: 'number', description: 'Tracking multiplier, 0.8 tight … 1.4 airy.' },
      fill: { type: 'string', description: 'Primary letter color as a CSS hex, e.g. #111418.' },
      fill2: { type: 'string', description: 'Optional second hex for a vertical gradient, or omit.' },
      background: { type: 'string', description: 'Canvas background color hex.' },
      accent: { type: 'string', description: 'Accent hex used by shadow/stack/outline effects.' },
      effect: { type: 'string', enum: ['none', 'outline', 'shadow', 'stack', 'wave'], description: 'Graphical effect for display use.' },
      notes: { type: 'string', description: 'One short sentence describing the look (optional).' },
    },
  },
}

const SYSTEM =
  'You are the type-design brain for Typeforge, a tool that generates ORIGINAL typefaces. ' +
  'Translate the user\'s description (and reference image, if provided) into typeface parameters via the set_typeface tool. ' +
  'If an image is attached, infer its typographic character — weight, stroke contrast, serif vs sans, width, terminals, mood — and design a NEW typeface INSPIRED BY it, never a copy. ' +
  'Choose tasteful colors only when the request implies a vibe (e.g. neon, vintage, corporate); otherwise leave colors out. Always call the tool exactly once.'

interface InterpretBody {
  prompt?: string
  image?: { media_type?: string; data?: string }
}

export function typeforgeApi(env: Record<string, string>): Plugin {
  const apiKey = env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || ''
  const model = env.TYPEFORGE_MODEL || process.env.TYPEFORGE_MODEL || DEFAULT_MODEL

  return {
    name: 'typeforge-api',
    configureServer(server) {
      server.middlewares.use('/api/status', (_req, res) => {
        sendJson(res, 200, { available: !!apiKey, model: apiKey ? model : null })
      })

      server.middlewares.use('/api/interpret', async (req, res) => {
        if (req.method !== 'POST') return sendJson(res, 405, { ok: false, reason: 'method' })
        if (!apiKey) return sendJson(res, 200, { ok: false, reason: 'no-key' })
        try {
          const body = (await readJson(req)) as InterpretBody
          const result = await interpret(apiKey, model, body)
          sendJson(res, 200, { ok: true, source: 'api', result })
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e)
          server.config.logger.warn(`[typeforge] interpret failed: ${message}`)
          sendJson(res, 200, { ok: false, reason: 'error', message })
        }
      })
    },
  }
}

async function interpret(apiKey: string, model: string, body: InterpretBody) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey })

  const content: unknown[] = []
  if (body.image?.data) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: body.image.media_type || 'image/png', data: body.image.data },
    })
  }
  const hasImage = !!body.image?.data
  content.push({
    type: 'text',
    text:
      (hasImage
        ? 'Reference image attached. Design an original typeface inspired by its style (do not copy it). '
        : '') + `Request: ${body.prompt || 'a clean, original display typeface'}`,
  })

  const resp = await client.messages.create({
    model,
    max_tokens: 1024,
    system: SYSTEM,
    tools: [TOOL],
    tool_choice: { type: 'tool', name: 'set_typeface' },
    messages: [{ role: 'user', content }],
  } as never)

  const blocks = (resp as { content: Array<{ type: string; input?: Record<string, unknown> }> }).content
  const toolUse = blocks.find((b) => b.type === 'tool_use')
  return toolUse?.input ?? {}
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  const data = JSON.stringify(payload)
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.end(data)
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    const MAX = 12 * 1024 * 1024 // 12 MB (room for a base64 image)
    req.on('data', (c: Buffer) => {
      size += c.length
      if (size > MAX) {
        reject(new Error('payload too large'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'))
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}
