# Four layers: app → features → entities → shared

`src/` is split into `app` (router, providers, thin route modules with `lazy`/`loader`/
`ErrorBoundary`), `features` (one folder per user task), `entities/cv` (what several features
need about a CV: query options, status → label/tone/actions map, status pill, match bar,
status polling) and `shared` (API client, UI primitives, utils — no domain logic). Imports go
only downwards and a feature never imports another feature; oxlint (`no-restricted-imports`
per folder, `import/no-cycle`) enforces it.

## Considered Options

- **Bulletproof React without `entities`** — CV code used by the list, the CV screen and New CV
  would either be duplicated or leak into `shared`.
- **Feature-Sliced Design** (`pages`, `widgets`, `features`, `entities`, `shared`) — six layers
  for four screens; `pages` and `widgets` would be near-empty pass-throughs.
