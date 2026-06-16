# Typeforge — original type studio

Generate **unique, original typography** from a text description and/or a reference
image, then save everything to one library and compare typefaces side by side.

Typeforge has two modes in a single app:

- **🎨 Display mode** — type a word or headline and get an expressive, graphical
  treatment of *just those letters*. Export a crisp **vector SVG** or a transparent
  **PNG**. Perfect for logos and bold headlines.
- **🔤 Typeface mode** — build a full, consistent typeface (A–Z, a–z, 0–9 and
  punctuation) and download a real, installable **`.otf` / `.ttf`** font you can use
  anywhere.

Both modes feed one **library** with a **compare view**: type any word and flip
between every saved typeface to see them next to each other.

## How it works

Originality comes from *constructing* letterforms, not copying existing fonts. A
parametric engine builds each glyph from a skeleton of strokes and arcs; a rich set
of parameters (weight, contrast, width, slant, roundness, serifs, x-height,
counters, spacing…) reshapes the whole alphabet consistently.

The **AI "brain"** turns your words/images into those parameters:

- **With a Claude API key** — the app interprets free-form prompts *and analyzes
  uploaded reference images* (weight, contrast, serif vs sans, mood) into settings.
- **Offline (no key)** — a built-in keyword parser understands common terms (bold,
  serif, condensed, rounded, neon, vintage…) and does basic image analysis
  (dominant colors + ink density). The app is fully usable with zero setup.

## Quick start

```bash
npm install
npm run dev          # open the printed http://localhost:5173
```

That's it — Typeforge runs offline out of the box.

### Optional: enable the Claude brain

```bash
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY=sk-ant-...
npm run dev
```

The key is read **server-side only** (by a small Vite middleware) and never reaches
the browser. The status badge in the top bar shows **Claude connected** vs
**Offline mode**. You can override the model with `TYPEFORGE_MODEL` (defaults to
`claude-opus-4-8`; `claude-haiku-4-5` is a faster/cheaper alternative).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app (with the interpretation API middleware). |
| `npm run build` | Type-check and build for production. |
| `npm run preview` | Preview the production build. |
| `npm run typecheck` | Type-check only. |

## Project layout

```
src/
  engine/        Parametric type engine (framework-agnostic, no DOM)
    types.ts       Shared types (FontParams, DisplayStyle, Creation…)
    params.ts      Defaults, slider metadata, presets, clamping
    geometry.ts    Arc sampling + centreline→outline offsetter
    glyphs.ts      Per-character skeletons → outlines
    font.ts        Outlines → OpenType (.otf/.ttf) via opentype.js
    render.ts      Word layout → SVG markup + SVG/PNG export
  interpret/     Prompt/image → parameters
    client.ts      Tries the API, falls back to offline
    offline.ts     Keyword parser + basic image analysis
  server/
    apiPlugin.ts   Vite middleware: /api/interpret (Claude) + /api/status
  store/         Zustand stores (studio editor + persisted library)
  components/    React UI (prompt bar, controls, stages, library/compare)
scripts/
  smoke.ts       Engine smoke test (run via esbuild + node)
```

## Notes & limitations

- The engine is first-generation and geometric by nature: it produces clean,
  consistent, genuinely usable letterforms, but it is not a substitute for a
  hand-crafted professional typeface. High stroke contrast is approximated on
  straight strokes; round letters stay near-monoline.
- Saved creations store **parameters**, not font binaries — fonts and SVGs are
  regenerated deterministically on demand, so the library stays tiny and exports
  are always up to date. The library persists locally in your browser (IndexedDB).
- Character set: Basic Latin (A–Z, a–z, 0–9, common punctuation).

## Tech

Vite · React · TypeScript · `opentype.js` (font export) · `zustand` (state) ·
`idb-keyval` (persistence) · Anthropic SDK (server-side interpretation).
