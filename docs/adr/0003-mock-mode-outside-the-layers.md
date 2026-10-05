# Mock mode: a tree outside the layers, switched by the Vite mode

Mock mode (MSW handlers, a browser-storage store, a fake worker, fixtures) lives in `src/mocks`,
next to the four layers and not inside any of them. It imports only the contract package, and no
layer imports it. It is switched on by the Vite mode alone: `vite --mode mock` makes `main.tsx`
load `@/mocks/browser` through a dynamic import behind `import.meta.env.MODE === 'mock'`. The
tests that drive the whole app live in `src/tests`, also outside the layers, and use the same
handlers.

## Considered Options

- **Mocks inside the `src/shared` layer** — the mock knows the whole contract and acts like the
  backend (ownership, statuses, limits), which is domain logic the lowest layer must not hold; and
  every layer could then import it.
- **Mocks inside `app`** — `app` is wiring; a fake backend there would blur what the app is and
  what replaces the server.
- **An environment variable (`VITE_MOCK=1`)** — it can be left in a `.env` file and reach a build
  by accident. The Vite mode is set only by the command that starts the server.
- **A separate mock server process** — a second thing to start and keep in sync; MSW in the
  browser runs the real client, parsing and polling unchanged, and the same handlers back the
  tests.

## Consequences

- The app code is identical in mock mode and against the real API; only `main.tsx` knows mock
  mode exists.
- The mode check is a build-time constant, so the production bundle contains no mock code.
- oxlint needs rules for two more folders: `src/mocks` imports nothing from the layers, and the
  layers import nothing from `src/mocks` or `src/tests`.
- ADR 0002's four layers describe the application; `src/mocks` and `src/tests` are tooling around
  it.
