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

## Data and licence

- `data/*.json`: six generic characters (人 大 山 木 水 字) copied unmodified from [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data) at commit `68d10a4`, bundled so the trial works without a network.
- Data origin: [Make Me a Hanzi](https://github.com/skishore/makemeahanzi), extracted from Arphic Technology fonts. Redistributed under the **Arphic Public License**; full text in `data/ARPHICPL.TXT`. Keep the licence file and attribution with any copy.
- The data licence is separate from Hanzi Writer's MIT code licence. No Hanzi Writer code is copied.
- The trials build emits the unchanged full licence at `licences/ARPHICPL.TXT`, linked from the demo; the local development server serves the same file. Output checks compare the shipped bytes against the source licence.
