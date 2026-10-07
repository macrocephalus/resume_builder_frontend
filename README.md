# AI CV Builder — frontend

The single-page app of the AI CV Builder. A user signs up, starts a CV from a PDF or free text and
a target role, watches the generation run, answers the questions the AI could not settle from the
source, edits any field and downloads an A4 PDF. It works on a phone.

The SPA talks to the backend only over the REST API (`/api`, contract in the root `docs/api.md`)
and shares nothing with it but the `@cv/shared` package: Zod schemas, the CV status machine and
`computeMatch`. Generation is a background job: the app polls statuses, so a page reload loses
nothing.

## Run

The whole app, from the repo root, with `ANTHROPIC_API_KEY` in the root `.env` (copied from
`.env.example`):

```sh
docker compose up --build    # or: pnpm stack → http://localhost:8080
```

Other ways, all from the repo root:

| Command | What runs | Open |
|---|---|---|
| `pnpm dev` | Postgres and Redis in Docker; api, worker and Vite on the host in watch mode | `http://localhost:5173` |
| `pnpm stack:frontend` | this SPA in nginx; `/api` goes to a backend on the host port 3000 | `http://localhost:8080` |
| `pnpm --filter frontend dev:mock` | the SPA alone: the API is played in the browser, no backend, no key | `http://localhost:5173` |

Needs Node 24 and pnpm (via corepack). Install once from the repo root: `pnpm install`, then
`pnpm --filter @cv/shared build`.

### Mock mode

`pnpm dev:mock` (here) runs the app against [MSW](https://mswjs.io) handlers that act like the API
and keep their data in browser storage. Sign up with any email. A word in the input picks what
happens:

| Where | Word | Result |
|---|---|---|
| Target role | `ready` | the CV is ready at once, no questions |
| Target role | `retry` | the first attempt fails, the retry succeeds |
| Target role | `fail` | every attempt fails; Retry then succeeds |
| Target role | anything else | a revision, then a draft with four questions |
| PDF file name | `scan` | no text in the PDF (`422`) |
| PDF file name | `long` / `short` | more / less text than a CV can start from |

## Stack

- **Vite 8**, **React 19** with the **React Compiler**, **TypeScript**
- **React Router 8** in data mode: route loaders, every route lazy
- **TanStack Query 5** for all server state; no global store
- **React Hook Form** + **Zod** (schemas from `@cv/shared`)
- **Tailwind CSS v4** with own design tokens; own UI primitives, no UI kit; `lucide-react` icons;
  self-hosted fonts via `@fontsource`
- **Vitest** + **Testing Library** in jsdom, **MSW** for the API in tests and mock mode,
  **Playwright** for screenshots
- **oxlint** (layer boundaries, import cycles, a11y) and **Prettier**
- **nginx** serves the build in Docker and proxies `/api`

## Structure

```
src/
  app/        router, providers, layout, thin route modules
  features/   one folder per user task: auth, cv-list, cv-create, cv-editor
  entities/   what several features need about a CV: queries, statuses, polling
  shared/     API client, UI primitives, utils, paths (no domain logic)
  mocks/      mock mode (MSW), outside the layers
  tests/      flow tests that render the whole app
```

Imports go only downwards: `app → features → entities → shared`, enforced by the linter.

## Scripts

| Command | Does |
|---|---|
| `pnpm dev` | dev server; `/api` proxied to `localhost:3000` |
| `pnpm dev:mock` | dev server in mock mode, no backend |
| `pnpm test` / `pnpm test:watch` | Vitest, once / watch |
| `pnpm typecheck` | `tsc -b` |
| `pnpm lint` | oxlint |
| `pnpm format` / `pnpm format:check` | Prettier, write / check |
| `pnpm build` | typecheck + production build into `dist/` |
| `pnpm screenshots` | every screen at 390 and 1280 px into `.scratch/screens/` (once before: `pnpm exec playwright install chromium`) |

Before a commit: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`.

## Tests

Most tests render the whole app with `renderApp()` and drive it as a user would, through the DOM,
against the same MSW handlers mock mode uses. Pure functions have unit tests next to their files.
On a busy machine, `pnpm test --maxWorkers=4` avoids timeouts.

## Docs

- `docs/architecture.md` — the inside: tree, routes, server state, forms, where state lives,
  mock mode, tests
- `docs/design.md` — look, tokens, primitives, layouts, states
- `docs/adr/` — decisions: own CSS with glass on one layer, the four layers, mock mode outside them
- `GLOSSARY.md` — frontend terms
- `CLAUDE.md` — the rules for working in this package
- The root `docs/api.md` and `docs/cv-statuses.md` — the API contract and the CV statuses
