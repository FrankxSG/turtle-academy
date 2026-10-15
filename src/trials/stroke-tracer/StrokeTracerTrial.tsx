import { useEffect, useState } from 'react'
import { Shell } from '../Shell'
import { TRIALS_COMMIT } from '../build'
import { SAMPLE_CHARACTERS } from './characters'
import { StrokeTracer, type GuidedAttempt, type InputChoice, type StrokeTracerMode } from './StrokeTracer'

const MODES: { value: StrokeTracerMode; label: string }[] = [
  { value: 'watch', label: 'Watch' },
  { value: 'trace', label: 'Free trace' },
  { value: 'guided', label: 'Guided (experimental)' },
]

const INPUTS: { value: InputChoice; label: string; note: string }[] = [
  { value: 'finger', label: 'Finger', note: 'Touch draws. Very wide contacts (a resting palm) are ignored — experimental.' },
  { value: 'stylus', label: 'Stylus', note: 'Only a stylus draws; finger and palm touches are ignored.' },
  { value: 'mouse', label: 'Mouse', note: 'Mouse (or stylus) draws. For desktop checks.' },
]

const CHECKLIST = [
  'Watch: play, pause, next stroke and speed behave as expected',
  'Free trace: ink follows finger/stylus without lag; undo, clear, outline toggle work',
  'Guided: careful correct strokes are accepted on the first try',
  'Guided: reversed, wrong-order, scribbled and shortcut strokes are rejected',
  'Stylus mode: a resting palm never draws; switching back to Finger works',
  'Rotate the device, background and return: nothing breaks, ink clears only on change',
  'Landscape phone: board and buttons fit without scrolling the board',
]

/**
 * Board size from the viewport. Landscape screens put the board beside the
 * controls; the board, its status line and its buttons must fit the height.
 */
function layout() {
  const w = window.innerWidth
  const h = window.innerHeight
  const landscape = w > h && w >= 600
  const size = landscape
    ? Math.min(h - (h < 560 ? 165 : 140), Math.floor(w * 0.5), 520)
    : Math.min(w - 32, h - 260, 460)
  return { landscape, size: Math.max(200, Math.floor(size)) }
}

export function StrokeTracerTrial() {
  const [input, setInput] = useState<InputChoice | null>(null)
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<StrokeTracerMode>('watch')
  const [speed, setSpeed] = useState(1)
  const [leniency, setLeniency] = useState(1)
  const [attempts, setAttempts] = useState<GuidedAttempt[]>([])
  const [completed, setCompleted] = useState(false)
  const [session, setSession] = useState(0)
  const [view, setView] = useState(layout)
  const sample = SAMPLE_CHARACTERS[index]

  useEffect(() => {
    const resize = () => setView(layout())
    window.addEventListener('resize', resize)
    window.addEventListener('orientationchange', resize)
    return () => { window.removeEventListener('resize', resize); window.removeEventListener('orientationchange', resize) }
  }, [])
  // Attempt details belong to one character and mode; changing either clears them.
  useEffect(() => { setAttempts([]); setCompleted(false) }, [index, mode, input, session])

  function resetTrial() {
    setInput(null); setIndex(0); setMode('watch'); setSpeed(1); setLeniency(1); setSession((n) => n + 1)
  }

  function restartGuided() {
    setAttempts([]); setCompleted(false); setSession((n) => n + 1)
  }

  if (!input) return (
    <Shell>
      <a href="#/" className="t-back">← All trials</a>
      <h1>Chinese stroke tracer</h1>
      <div className="t-notice" role="note">
        <strong>Demo only.</strong> Generic example characters, no sign-in, and nothing you draw is saved or sent anywhere.
        Ink disappears when you change character or mode, or leave the page.
      </div>
      <p>What will you draw with?</p>
      <div className="t-choices" role="group" aria-label="Input">
        {INPUTS.map((item) => (
          <button key={item.value} type="button" className="t-choice" onClick={() => setInput(item.value)}>
            <strong>{item.label}</strong><span>{item.note}</span>
          </button>
        ))}
      </div>
    </Shell>
  )

  return (
    <div className={'t-app t-trial' + (view.landscape ? ' t-landscape' : '')}>
      <header className="t-header">
        <a href="#/" className="t-brand">← Trials</a>
        <span className="t-tag">Demo · nothing saved</span>
      </header>
      <main className="t-stage" data-testid="trial-stage">
        <div className="t-board-col">
          <StrokeTracer key={`${session}:${sample.character}:${mode}:${input}`} character={sample.character} data={sample.data} mode={mode} input={input}
            size={view.size} leniency={leniency} speed={speed}
            onGuidedRestart={restartGuided}
            onGuidedAttempt={(a) => setAttempts((all) => all.concat([a]))} onGuidedComplete={() => setCompleted(true)} />
        </div>
        <div className="t-side">
          <div className="t-row" role="group" aria-label="Character" lang="zh-Hans">
            {SAMPLE_CHARACTERS.map((c, i) => (
              <button key={c.character} type="button" className="t-pill" aria-pressed={i === index}
                aria-label={c.character + ' ' + c.pinyin} onClick={() => setIndex(i)}>
                <span className="t-char">{c.character}</span><span>{c.pinyin}</span>
              </button>
            ))}
          </div>
          <div className="t-row" role="group" aria-label="Mode">
            {MODES.map((m) => (
              <button key={m.value} type="button" className="t-pill" aria-pressed={m.value === mode}
                onClick={() => setMode(m.value)}>{m.label}</button>
            ))}
          </div>
          <p className="t-hint">Changing character or mode clears your ink.</p>
          {mode === 'watch' && (
            <label className="t-field">Speed
              <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                <option value={0.5}>Slow</option><option value={1}>Normal</option><option value={1.6}>Fast</option>
              </select>
            </label>
          )}
          <p className="t-input">
            Drawing with <strong data-testid="input-choice">{INPUTS.find((i) => i.value === input)?.label}</strong>
            {input !== 'finger' && <button type="button" className="t-link" onClick={() => setInput('finger')}>Use finger</button>}
            <button type="button" className="t-link" onClick={() => setInput(null)}>Change</button>
          </p>
          {completed && <p className="t-done" data-testid="guided-complete">Reference strokes completed. Try another character or mode.</p>}

          <details className="t-panel" data-testid="tester-panel">
            <summary>Tester details</summary>
            <p className="t-meta">Build {TRIALS_COMMIT} · In memory only; cleared on any change. Record findings in Issue #8 using its result format.</p>
            <label className="t-field">Guided leniency {leniency.toFixed(1)}
              <input type="range" min="0.8" max="1.4" step="0.1" value={leniency}
                onChange={(e) => setLeniency(Number(e.target.value))} />
            </label>
            <p data-testid="attempt-summary">
              Checked strokes: {attempts.length} · not accepted: {attempts.filter((a) => !a.check.matched).length}
            </p>
            {attempts.length > 0 && (
              <ol className="t-attempts">
                {attempts.slice(-6).map((a, i) => (
                  <li key={attempts.length - 6 + i}>
                    stroke {a.strokeNumber} · {a.pointerType} · {a.check.matched ? 'accepted' : 'not accepted: ' + a.check.reason}
                    {' '}(off {a.check.maxOffPath.toFixed(0)}, missed {a.check.maxMissed.toFixed(0)}, back {a.check.maxBacktrack.toFixed(0)}, length ×{a.check.lengthRatio.toFixed(2)})
                  </li>
                ))}
              </ol>
            )}
            <button type="button" className="t-button" onClick={resetTrial}>Reset trial</button>
            <details>
              <summary>Tester checklist</summary>
              <ul>{CHECKLIST.map((item) => <li key={item}>{item}</li>)}</ul>
            </details>
          </details>
          <p className="t-meta">Stroke data: hanzi-writer-data (from Make Me a Hanzi / Arphic fonts), <a href="./licences/ARPHICPL.TXT">Arphic Public License</a>.</p>
        </div>
      </main>
    </div>
  )
}
