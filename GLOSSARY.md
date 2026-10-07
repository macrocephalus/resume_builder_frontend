# Frontend

Words the SPA uses for its screens, client state and development modes. Product terms (CV, Question,
statuses…) live in [shared/GLOSSARY.md](../shared/GLOSSARY.md).

## Language

**Mock mode**:
A development run of the SPA in which every `/api` request is answered by in-browser handlers instead
of the backend; switched on explicitly, never chosen automatically when the backend is down.
_Avoid_: fallback mode, offline mode, stub server

**CV screen**:
What a user sees when they open one CV: generation progress, the failure with its actions, or the draft with its questions, match and preview — chosen by the CV's status.
_Avoid_: editor (the editor is one part of it), CV page, detail page

**Tone**:
The visual meaning a state is shown with — neutral, accent, wait, ok or bad; a status maps to a tone, never straight to a color.
_Avoid_: color, variant, severity

**Glass layer**:
The floating controls that sit above the content — top bar, tab switcher, save bar, apply bar, auth card — and the only place glass is allowed; content, inputs and the preview sheet stay solid.
_Avoid_: chrome, overlay, toolbar

**Replied card**:
A question card the user has answered or skipped but not applied yet: folded to its target, the reply in short and Change; the question is still open on the server.
_Avoid_: answered card (an answered question is a closed one on the server), pending card

**Apply bar**:
The bar at the bottom of the Questions panel that sends every replied card in one request, after saving unsaved edits; shows that the CV is being updated and why a batch was not applied.
_Avoid_: submit bar, reply footer, answer bar
