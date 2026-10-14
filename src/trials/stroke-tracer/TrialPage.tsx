import { useEffect, useState } from 'react'
import { SAMPLE_CHARACTERS } from './characters'
import { StrokeTracer, type GuidedSummary, type StrokeTracerMode } from './StrokeTracer'

// Development-only trial page (served by `npm run dev` at /trial/stroke-tracer.html).
// It is not linked from the app and not part of the production build.
const MODES: { value: StrokeTracerMode; label: string; note: string }[] = [
  { value: 'watch', label: 'Watch', note: 'Stroke-order animation.' },
  { value: 'trace', label: 'Free trace', note: 'Ungraded ink, discarded on exit — Pilot P0-17 compatible.' },
  { value: 'guided', label: 'Guided (later phase)', note: 'Checks each stroke in order — outside the current Pilot boundary.' },
]

function boardSize() {
  return Math.max(220, Math.min(380, window.innerWidth - 48))
}

export function TrialPage() {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<StrokeTracerMode>('watch')
  const [leniency, setLeniency] = useState(1)
  const [summary, setSummary] = useState<GuidedSummary | null>(null)
  const [size, setSize] = useState(boardSize)
  const sample = SAMPLE_CHARACTERS[index]

  useEffect(() => {
    const resize = () => setSize(boardSize())
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  useEffect(() => setSummary(null), [index, mode])

  return (
    <div className="app">
      <header className="header">
        <span className="brand">StrokeTracer trial</span>
        <span className="guest">Not part of Pilot v0.1</span>
      </header>
      <main style={{ padding: '20px 0' }}>
        <p className="eyebrow">CHARACTER</p>
        <div className="answers" role="group" aria-label="Character">
          {SAMPLE_CHARACTERS.map((c, i) => (
            <button key={c.character} aria-pressed={i === index} onClick={() => setIndex(i)}
              style={{ minWidth: 64, flex: '0 0 auto', fontWeight: i === index ? 800 : 400 }}>
              <span lang="zh-Hans">{c.character}</span> {c.pinyin}
            </button>
          ))}
        </div>
        <p className="eyebrow" style={{ marginTop: 20 }}>MODE</p>
        <div className="answers" role="group" aria-label="Mode">
          {MODES.map((m) => (
            <button key={m.value} aria-pressed={m.value === mode} onClick={() => setMode(m.value)}
              style={{ minWidth: 110, fontWeight: m.value === mode ? 800 : 400 }}>{m.label}</button>
          ))}
        </div>
        <p className="intro" style={{ marginTop: 10 }}>{MODES.find((m) => m.value === mode)?.note}</p>
        {mode === 'guided' && (
          <label style={{ display: 'block', margin: '12px 0', fontSize: 14 }}>
            Leniency {leniency.toFixed(1)}{' '}
            <input type="range" min="0.6" max="1.6" step="0.1" value={leniency}
              onChange={(e) => setLeniency(Number(e.target.value))} />
          </label>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }} lang="zh-Hans">
          <StrokeTracer character={sample.character} data={sample.data} mode={mode} size={size}
            leniency={leniency} onGuidedComplete={setSummary} />
        </div>
        {summary && (
          <p className="intro" data-testid="guided-summary" style={{ textAlign: 'center', margin: '12px auto' }}>
            Trial readout (not saved): {summary.strokeCount} strokes, {summary.mistakes} retries, {summary.hintsShown} hints.
          </p>
        )}
        <footer className="footer">
          <p>Stroke data: hanzi-writer-data, derived from Make Me a Hanzi and Arphic fonts, under the Arphic Public License.</p>
          <p>Nothing on this page is stored. Ink disappears when you change character or mode, or leave the page.</p>
        </footer>
      </main>
    </div>
  )
}
