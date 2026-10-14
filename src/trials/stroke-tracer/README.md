# StrokeTracer trial (later phase, not Pilot)

A small, dependency-free Chinese stroke component for evaluating tracing ideas before any scope decision. It is **not linked from the app and not included in the production build**.

Run `npm run dev`, then open `/trial/stroke-tracer.html`.

## Modes

| Mode | What it does | Scope status |
| --- | --- | --- |
| `watch` | Animates the reference stroke order on a 田字格 grid | Display only |
| `trace` | Free finger/stylus ink over a faint outline; undo/clear | Matches Pilot P0-17: ungraded, no stroke-order inference, nothing persisted |
| `guided` | Checks each drawn stroke against the next reference stroke (start, end, direction, path), shows a start dot after a miss and a hint after repeated misses | **Stroke-order checking — outside the current Pilot boundary.** Kept for a later-phase decision |

`guided` is deterministic geometry against reference data (`strokeMath.ts`). It is not handwriting recognition, OCR, AI or a neatness score, and its readout must not be presented as a handwriting grade.

## Privacy and storage

- All ink lives in React state and is discarded on unmount or when the character or mode changes.
- The component writes nothing to IndexedDB, localStorage, sessionStorage or the network. `onGuidedComplete` hands a summary (stroke count, retries, hints) to the caller; the trial page shows it and does not store it.
- Palm handling: one active pointer at a time; touch contacts wider than 44 CSS px are ignored; once a stylus is seen, finger touches are ignored. Thresholds need real-device tuning (P0-19 devices).

## Data and licence

- `data/*.json` holds six generic sample characters (人 大 山 木 水 字) copied unmodified from [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data) (commit `68d10a4`). They are bundled so the trial works offline.
- That data comes from [Make Me a Hanzi](https://github.com/skishore/makemeahanzi), extracted from Arphic Technology fonts. It is redistributed under the **Arphic Public License**; the full text is in `data/ARPHICPL.TXT`. Keep this attribution and licence file with any copy of the data.
- No code is copied from Hanzi Writer (MIT). The rendering approach (a clipped median line animated with a stroke dash, in a y-flipped 1024 box) follows the same well-known technique.

## Before any production use

1. Owner scope decision: Pilot `trace` only, or a later phase that includes `guided`.
2. Content pipeline: decide how character data is selected and versioned for reviewed lessons (only characters actually taught), with licence notices in the shipped bundle.
3. Wire the component into the app. The JSON is imported into the JS bundle, so the existing PWA precache covers it once the app imports it; this trial page itself is never built.
4. Real-device checks on landscape tablet and phone Safari/WebKit, with stylus and palm.
5. Tune `guided` thresholds against synthetic test strokes only; never use real learner handwriting as fixtures.
