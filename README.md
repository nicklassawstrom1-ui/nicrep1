# Century Arts

Eyecatching one-pager för **Century Arts** — en digital reklambyrå som ger
lokala företag *stor look* till *lågt pris*.

Tjänster: filmproduktion, hemsidor, logotyper, posters och musikproduktion.

## Stack

- React 19 + TypeScript
- Vite
- Ren CSS (neo-brutalistisk stil — Archivo Black + Space Grotesk + Space Mono)
- All grafik (postrar, ikoner, vågor) byggs i CSS/SVG — inga externa bildberoenden

## Kör lokalt

```bash
npm install
npm run dev
```

## Bygg för produktion

```bash
npm run build
npm run preview
```

## Deploy

Pushar du till `claude/dazzling-davinci-p8isxg` eller `claude/bold-johnson-8yu55t`
publiceras sajten automatiskt till GitHub Pages via `.github/workflows/deploy.yml`.
Sajten serveras under `/nicrep1/` (project site).
