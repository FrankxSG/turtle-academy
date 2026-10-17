// Minimal trials registry (Issue #8). Trials are built only by
// `npm run build:trials`; the learner app never imports anything here.
export type TrialStatus = 'exploring' | 'candidate' | 'promoted' | 'retired'

export type TrialEntry = {
  id: string
  title: string
  /** The one narrow question this trial answers. */
  question: string
  /** Position against the Pilot scope; never implies approval. */
  scope: string
  status: TrialStatus
  limitations: string[]
  /** Tracking issue holding design and results. */
  issue: number
}

export const TRIALS: TrialEntry[] = [
  {
    id: 'stroke-tracer',
    title: 'Chinese stroke tracer',
    question: 'Is watching and tracing stroke order comfortable on a tablet and phone, and does a simple guided check reject wrong strokes without frustrating false rejections?',
    scope: 'Later phase — outside Pilot delivery work',
    status: 'exploring',
    limitations: [
      'Six generic sample characters only.',
      'Guided checking is geometry against reference strokes, tuned on synthetic strokes; not verified with real users or devices.',
      'Wide-contact palm filtering is an experiment, not verified palm rejection.',
      'Small hooks (under about 140 of 1024 units) are not enforced.',
    ],
    issue: 8,
  },
]
