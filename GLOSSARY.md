# Frontend

Words the SPA uses for its screens, client state and development modes. Product terms (CV, Question,
statuses…) live in [shared/GLOSSARY.md](../shared/GLOSSARY.md).

## Language

**Mock mode**:
A development run of the SPA in which every `/api` request is answered by in-browser handlers instead
of the backend; switched on explicitly, never chosen automatically when the backend is down.
_Avoid_: fallback mode, offline mode, stub server

**Tone**:
The visual meaning a state is shown with — neutral, accent, wait, ok or bad; a status maps to a tone, never straight to a color.
_Avoid_: color, variant, severity

**Glass layer**:
The floating controls that sit above the content — top bar, tab switcher, save bar, auth card — and the only place glass is allowed; content, inputs and the preview sheet stay solid.
_Avoid_: chrome, overlay, toolbar
