# StrokeTracer trial

Demo of watching and tracing Chinese stroke order on tablet and phone. Not part of the learner app or the Pilot.

## Run it

```sh
npm run dev:trials          # local, then open the printed URL
npm run build:trials        # separate output in trials/dist/
npm run preview:trials
```

The learner app (`npm run build`) never includes this code. The trials build has no service worker, manifest, storage, auth or product imports. `tests/trials/isolation.spec.ts` checks both outputs.

## Hosting

The owner chose a private Vercel project, separate from the learner app. Both projects use the repository root and the root `vercel.json`, whose build command is `npm run build:hosted`:

- By default, `build:hosted` runs the normal learner-app build (`npm run build`).
- Only when the hosting project sets the environment variable `TURTLE_SITE=trials` does it run `npm run build:trials` and serve that output instead. The learner app is not built at all in that case.

(A project rooted at `trials/` is not possible: Vercel builds cannot read files outside the Root Directory.)

Trials project settings: Root Directory left at the repository root; environment variable `TURTLE_SITE` = `trials`; Deployment Protection with Vercel Authentication on All Deployments. Links are then viewable only by signed-in Vercel users with access to the project.

## Behaviour

| Mode | Behaviour |
| --- | --- |
| Watch (default) | Reference stroke order; play/pause, next stroke, restart, speed. Reduced-motion users step manually |
| Free trace | Ink over a faint outline; undo, clear, outline toggle. Nothing is checked |
| Guided (experimental) | Each stroke is checked against the next reference stroke. A start dot shows where to begin; after three misses the stroke replays in orange. "Show me" and "Start again" are always available |

- **Input** is chosen explicitly: Finger, Stylus or Mouse. In Stylus mode, touch never draws. In Finger mode, very wide touch contacts are ignored (an experimental palm heuristic, not verified palm rejection). A stylus may take over from a touch already in progress. "Use finger" returns to touch at any time.
- **No accidental zoom, scrolling or back-swipe while drawing**. Any touch that starts on the board is cancelled for browser gestures (one-finger double-tap-drag zoom, scrolling, magnifier) by non-passive touch listeners on an HTML wrapper, because iPad Safari may ignore `touch-action` on SVG; pointer events still draw. While the tracer is open, multi-finger pinch and Safari gesture events are blocked page-wide and double-tap zoom is disabled. In landscape the board keeps at least 40px from the left edge, clear of Safari's swipe-back gesture. Pull-to-refresh and the overscroll bounce are also off on this page: a one-finger drag downwards at the top of the page is cancelled, while normal scrolling still works. The trials hub keeps normal zoom and refresh. Trade-off: no zooming or pull-to-refresh on this page (use the reload button), and dragging on the board never scrolls.
- **Accepted strokes** show the clean reference shape. That is reference progress, not a corrected sample of the user's writing. The completion message is "Reference strokes completed." Retries and reasons appear only in the collapsed tester panel, never as a grade, knowledge-error record or mastery signal.
- **Nothing is stored or sent.** Ink and attempt details live in memory, clear on any character, mode or input change, and disappear on leaving the page. "Reset trial" clears everything.
- Watch timers and animation state reset with each character/mode/input session. Pause cancels the pending inter-stroke advance; Play replays the current stroke. Guided "Start again" also clears completion and tester attempt details.

## Guided checker

`strokeMath.ts` compares the drawn stroke with the reference median (1024-unit box). It rejects a stroke that:

- starts or ends too far from the reference start or end (catches reversed strokes);
- is much shorter or longer than the reference;
- moves backwards along the reference path beyond a length-scaled tolerance (backtracking, retracing, scribbling);
- strays far from the path or averages too far from it (detours, overshoot);
- misses part of the reference path (shortcuts, partial strokes).

`tests/trials/stroke-math.spec.ts` runs synthetic valid and invalid strokes (`tests/support/syntheticStrokes.ts`) over all 22 strokes of the six characters, plus wrong-order checks. With leniency between 0.9 and 1.3 every case gives the expected result; the tester slider is limited to 0.8–1.4.

**Limitations:**
- Tolerances were tuned on the same synthetic strokes the tests use. They are not validated against real learners or devices and make no accuracy claim.
- Straight shortcuts are rejected across clear bends (150+ units). Small hooks and gentle curves (under about 140 units) are not enforced.

## Data and licence

- `data/*.json`: six generic characters (人 大 山 木 水 字) copied unmodified from [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data) at commit `68d10a4`, bundled so the trial works without a network.
- Data origin: [Make Me a Hanzi](https://github.com/skishore/makemeahanzi), extracted from Arphic Technology fonts. Redistributed under the **Arphic Public License**; full text in `data/ARPHICPL.TXT`. Keep the licence file and attribution with any copy.
- The data licence is separate from Hanzi Writer's MIT code licence. No Hanzi Writer code is copied.
- The trials build emits the unchanged full licence at `licences/ARPHICPL.TXT`, linked from the demo; the local development server serves the same file. Output checks compare the shipped bytes against the source licence.

## Before any product use

1. Owner decides to bring tracing into the product.
2. Real-device results on landscape iPad Safari and iPhone Safari, stylus on compatible hardware only.
3. Content pipeline: which characters ship, versioning, and shipped licence notices.
4. Product-specific integration review; move the code into the product area with tests, then remove or mark this trial `promoted`.
