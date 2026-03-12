# Contrast Checker

WCAG color contrast checker at accessibilitycolor.com.

## Build Commands

- `npm run dev` — Start dev server (port 5173)
- `npm run build` — Production build (Vite + Terser)
- `npm run test` — Unit tests (Vitest)
- `npm run test:e2e` — E2E tests (Playwright, 5 browsers)
- `npm run test:all` — Unit + E2E
- `npm run lint` — TypeScript type-check
- `npm run check` — lint + test + build (CI pipeline)

## Architecture

- **Vanilla TypeScript + CSS** — zero runtime dependencies
- `src/utils/` — Pure business logic (contrast math, color conversion, validation)
- `src/dom/` — DOM manipulation modules (inputs, preview, badges, simulations, suggestions)
- `src/main.ts` — Orchestrator: wires modules together, owns `updateAll()` refresh loop
- `index.html` — Semantic HTML entry point
- `src/styles/main.css` — All styles (self-hosted fonts, responsive)

## Conventions

- All user color input goes through `validateHex()` from `colorValidation.ts`
- Never use `innerHTML` with user data — use DOM APIs only
- WCAG ratios use exact (unrounded) values for pass/fail; format only for display
- `updateAll()` is the single entry point for refreshing all UI state
- Progressive enhancement for browser APIs (EyeDropper)
- 90% coverage thresholds on `src/utils/`

## Deployment

- Vercel (auto-deploy from GitHub)
- Config: `vercel.json` + `.vercel/project.json`
