import { useEffect, useState, type JSX } from 'react'
import { Shell } from './Shell'
import { TRIALS_COMMIT } from './build'
import { TRIALS } from './registry'
import { StrokeTracerTrial } from './stroke-tracer/StrokeTracerTrial'

// Hash routes (#/stroke-tracer) so reloads and direct links never depend on
// host rewrites, and an unknown trial never falls through to the learner app.
const PAGES: Record<string, () => JSX.Element> = { 'stroke-tracer': StrokeTracerTrial }

function currentRoute() {
  return window.location.hash.replace(/^#\/?/, '').split('?')[0]
}

export function TrialsApp() {
  const [route, setRoute] = useState(currentRoute)
  useEffect(() => {
    const changed = () => { setRoute(currentRoute()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', changed)
    return () => window.removeEventListener('hashchange', changed)
  }, [])

  if (route) {
    const Page = PAGES[route]
    if (!Page) return (
      <Shell>
        <h1>Trial not found</h1>
        <p>There is no trial called “{route}”.</p>
        <a className="t-button" href="#/">Back to trials</a>
      </Shell>
    )
    return <Page key={route} />
  }

  return (
    <Shell>
      <h1>Turtle Academy trials</h1>
      <p className="t-lede">Small experiments for later-phase ideas. They are not part of the learner app, use generic examples only, and save nothing.</p>
      <ul className="t-list">
        {TRIALS.map((trial) => (
          <li key={trial.id} className="t-card">
            <div className="t-card-head">
              <h2>{trial.title}</h2>
              <span className={'t-status t-status-' + trial.status}>{trial.status}</span>
            </div>
            <p><strong>Question:</strong> {trial.question}</p>
            <p className="t-meta">{trial.scope} · build {TRIALS_COMMIT} · design and results in Issue #{trial.issue}</p>
            <details>
              <summary>Known limitations</summary>
              <ul>{trial.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
            </details>
            <a className="t-button t-primary" href={'#/' + trial.id}>Open trial</a>
          </li>
        ))}
      </ul>
    </Shell>
  )
}
