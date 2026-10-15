import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  DATA_TRANSFORM, VIEW_SIZE, checkStroke, medianLength, medianPath, toView,
  type CharacterData, type Point, type StrokeCheck,
} from './strokeMath'
import './strokeTracer.css'

/**
 * StrokeTracer — trial only (see Issue #8). Not imported by the learner app.
 *
 * - `watch`: reference stroke order with play / pause / step and speed.
 * - `trace`: free ink over a faint outline. Ungraded; nothing is checked.
 * - `guided` (experimental): each stroke is checked geometrically against the
 *   next reference stroke. Accepted strokes show the clean reference shape —
 *   reference progress, not a corrected sample of the user's writing.
 *
 * Ink and attempt details live in component state only, are cleared on any
 * character/mode change and on unmount, and are never written to storage.
 */
export type StrokeTracerMode = 'watch' | 'trace' | 'guided'
/** Which pointer types may draw. Chosen explicitly by the tester. */
export type InputChoice = 'finger' | 'stylus' | 'mouse'

export type GuidedAttempt = {
  strokeNumber: number
  pointerType: string
  check: StrokeCheck
}

export type StrokeTracerProps = {
  character: string
  data: CharacterData
  mode: StrokeTracerMode
  input: InputChoice
  /** Board width/height in CSS px. */
  size: number
  /** Guided only: >1 kinder, <1 stricter. */
  leniency?: number
  /** Guided only: misses on one stroke before the hint replays it. 0 disables. */
  hintAfterMisses?: number
  /** Watch only: playback speed multiplier. */
  speed?: number
  /** Guided only: every checked stroke, for an in-memory tester panel. */
  onGuidedAttempt?: (attempt: GuidedAttempt) => void
  onGuidedComplete?: () => void
}

const INK_WIDTH = 46
/** Experimental: in Finger mode, touch contacts wider than this (CSS px) are ignored as a possible palm. */
export const WIDE_CONTACT_PX = 44
const STROKE_MS = 700
const STROKE_GAP_MS = 250

function prefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

/** Whether a pointer may start a stroke under the tester's input choice. */
export function acceptsPointer(input: InputChoice, pointerType: string, width: number, height: number): boolean {
  if (input === 'stylus') return pointerType === 'pen'
  if (input === 'mouse') return pointerType === 'mouse' || pointerType === 'pen'
  if (pointerType === 'touch') return width <= WIDE_CONTACT_PX && height <= WIDE_CONTACT_PX
  return true
}

export function StrokeTracer({
  character, data, mode, input, size, leniency = 1, hintAfterMisses = 3, speed = 1,
  onGuidedAttempt, onGuidedComplete,
}: StrokeTracerProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const active = useRef<{ id: number; type: string } | null>(null)
  const currentRef = useRef<Point[] | null>(null)
  const [current, setCurrentState] = useState<Point[] | null>(null)
  const setCurrent = (line: Point[] | null) => { currentRef.current = line; setCurrentState(line) }
  const [ink, setInk] = useState<Point[][]>([])
  const [rejected, setRejected] = useState<Point[] | null>(null)
  const [done, setDone] = useState(0)
  const [misses, setMisses] = useState(0)
  const [hintKey, setHintKey] = useState(0)
  const [showOutline, setShowOutline] = useState(true)
  const reducedMotion = useMemo(prefersReducedMotion, [])
  const [watchShown, setWatchShown] = useState(0)
  const [playing, setPlaying] = useState(!reducedMotion)
  const [playKey, setPlayKey] = useState(0)

  const medians = useMemo(() => data.medians.map((m) => m.map(toView)), [data])
  const strokeCount = data.strokes.length
  const finished = mode === 'guided' && done >= strokeCount
  const clipBase = useMemo(() => 'st-' + Math.random().toString(36).slice(2, 9), [])

  // Any character, mode or input change starts fresh in the same render.
  const [shownFor, setShownFor] = useState({ character, mode, data, input })
  if (shownFor.character !== character || shownFor.mode !== mode || shownFor.data !== data || shownFor.input !== input) {
    setShownFor({ character, mode, data, input })
    setInk([]); setCurrentState(null); setRejected(null)
    setDone(0); setMisses(0); setWatchShown(0); setPlaying(!reducedMotion)
  }
  useEffect(() => { currentRef.current = null; active.current = null }, [character, mode, data, input])

  useEffect(() => {
    if (!rejected) return
    const timer = window.setTimeout(() => setRejected(null), 450)
    return () => window.clearTimeout(timer)
  }, [rejected])

  // Watch playback: advance to the next stroke after a short gap.
  const [gapPending, setGapPending] = useState(false)
  useEffect(() => {
    if (!gapPending) return
    const timer = window.setTimeout(() => { setGapPending(false); setWatchShown((n) => n + 1) }, STROKE_GAP_MS / speed)
    return () => window.clearTimeout(timer)
  }, [gapPending, speed])

  function toPoint(event: { clientX: number; clientY: number }): Point | null {
    const ctm = svgRef.current?.getScreenCTM()
    if (!ctm) return null
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse())
    return { x: p.x, y: p.y }
  }

  const canDraw = mode !== 'watch' && !finished

  function onPointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (!canDraw) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (!acceptsPointer(input, event.pointerType, event.width, event.height)) return
    if (active.current) {
      // A pen may take over from a touch already in progress (e.g. a resting palm); nothing else interrupts.
      if (!(event.pointerType === 'pen' && active.current.type === 'touch')) return
      setCurrent(null)
    }
    const point = toPoint(event)
    if (!point) return
    event.preventDefault()
    active.current = { id: event.pointerId, type: event.pointerType }
    try { event.currentTarget.setPointerCapture(event.pointerId) } catch { /* drawing still works without capture */ }
    setCurrent([point])
  }

  function onPointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (event.pointerId !== active.current?.id) return
    const native = event.nativeEvent
    const events = typeof native.getCoalescedEvents === 'function' ? native.getCoalescedEvents() : []
    const points = (events.length ? events : [native]).map(toPoint).filter((p): p is Point => p !== null)
    if (points.length && currentRef.current) setCurrent(currentRef.current.concat(points))
  }

  function finishStroke(event: ReactPointerEvent<SVGSVGElement>, cancelled: boolean) {
    if (event.pointerId !== active.current?.id) return
    const pointerType = active.current.type
    active.current = null
    const line = currentRef.current
    setCurrent(null)
    if (cancelled || !line || line.length < 2) return
    if (mode === 'trace') { setInk((all) => all.concat([line])); return }
    if (mode !== 'guided' || done >= strokeCount) return
    const check = checkStroke(line, medians[done], leniency)
    onGuidedAttempt?.({ strokeNumber: done + 1, pointerType, check })
    if (check.matched) {
      setDone(done + 1); setMisses(0)
      if (done + 1 >= strokeCount) onGuidedComplete?.()
    } else {
      const next = misses + 1
      setMisses(next); setRejected(line)
      if (hintAfterMisses > 0 && next % hintAfterMisses === 0) setHintKey((k) => k + 1)
    }
  }

  const status = mode === 'watch'
    ? (watchShown >= strokeCount ? 'All ' + strokeCount + ' strokes shown.' : 'Stroke ' + Math.min(watchShown + 1, strokeCount) + ' of ' + strokeCount + (playing ? '' : ' · paused'))
    : mode === 'trace' ? 'Trace over the grey character. Nothing is checked or saved.'
      : finished ? 'Reference strokes completed.'
        : misses === 0 ? 'Stroke ' + (done + 1) + ' of ' + strokeCount + '. Start at the dot.'
          : hintAfterMisses > 0 && misses >= hintAfterMisses ? 'Watch the orange stroke, then try again from the dot.'
            : 'Not quite. Try stroke ' + (done + 1) + ' again from the dot.'

  const nextStart = mode === 'guided' && !finished ? medians[done][0] : null
  const showHint = mode === 'guided' && !finished && hintKey > 0 && hintAfterMisses > 0 && misses >= hintAfterMisses

  return (
    <div className="st" style={{ width: Math.max(size, 300) }}>
      {mode === 'guided' && <p className="st-badge">Experimental check</p>}
      <svg
        ref={svgRef}
        className={'st-board' + (canDraw ? ' st-drawable' : '')}
        viewBox={'0 0 ' + VIEW_SIZE + ' ' + VIEW_SIZE}
        width={size}
        height={size}
        role="img"
        aria-label={'Character ' + character + ', ' + mode + ' mode'}
        data-testid="stroke-board"
        data-done={done}
        data-shown={watchShown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => finishStroke(e, false)}
        onPointerCancel={(e) => finishStroke(e, true)}
        onLostPointerCapture={(e) => finishStroke(e, false)}
      >
        <defs>
          {data.strokes.map((d, i) => (
            // Clip coordinates are in the referencing <g>'s space, which already applies DATA_TRANSFORM.
            <clipPath key={i} id={clipBase + '-' + i}><path d={d} /></clipPath>
          ))}
        </defs>

        <g className="st-grid" aria-hidden="true">
          <line x1={VIEW_SIZE / 2} y1="8" x2={VIEW_SIZE / 2} y2={VIEW_SIZE - 8} />
          <line x1="8" y1={VIEW_SIZE / 2} x2={VIEW_SIZE - 8} y2={VIEW_SIZE / 2} />
        </g>

        <g transform={DATA_TRANSFORM}>
          {data.strokes.map((d, i) => {
            const filled = (mode === 'guided' && i < done) || (mode === 'watch' && i < watchShown)
            if (!filled && mode === 'trace' && !showOutline) return null
            return <path key={i} d={d} className={filled ? 'st-stroke-done' : 'st-outline'} />
          })}
        </g>

        {mode === 'watch' && playing && watchShown < strokeCount && !gapPending && (
          <AnimatedStroke key={'w-' + playKey + '-' + watchShown} clip={clipBase + '-' + watchShown}
            median={data.medians[watchShown]} durationMs={STROKE_MS / speed} className="st-anim"
            onEnd={() => setGapPending(true)} />
        )}

        {showHint && (
          <AnimatedStroke key={'h-' + hintKey} clip={clipBase + '-' + done} median={data.medians[done]}
            durationMs={STROKE_MS * 1.3} className="st-anim st-hint" />
        )}

        <g className="st-ink" aria-hidden="true">
          {ink.map((line, i) => <polyline key={i} points={pointsAttr(line)} strokeWidth={INK_WIDTH} />)}
          {current && <polyline points={pointsAttr(current)} strokeWidth={INK_WIDTH} />}
          {rejected && <polyline className="st-rejected" points={pointsAttr(rejected)} strokeWidth={INK_WIDTH} />}
        </g>

        {nextStart && <circle className={'st-start' + (misses > 0 ? ' st-start-strong' : '')}
          cx={nextStart.x} cy={nextStart.y} r="30" aria-hidden="true" />}
      </svg>

      <p className="st-status" role="status" aria-live="polite" data-testid="stroke-status">{status}</p>

      <div className="st-actions">
        {mode === 'watch' && <>
          {!reducedMotion && (playing && watchShown < strokeCount
            ? <button type="button" onClick={() => setPlaying(false)}>Pause</button>
            : <button type="button" onClick={() => {
              if (watchShown >= strokeCount) setWatchShown(0)
              setPlaying(true); setPlayKey((k) => k + 1)
            }}>{watchShown >= strokeCount ? 'Replay' : 'Play'}</button>)}
          <button type="button" disabled={watchShown >= strokeCount}
            onClick={() => { setPlaying(false); setGapPending(false); setWatchShown((n) => Math.min(strokeCount, n + 1)) }}>Next stroke</button>
          <button type="button" disabled={watchShown === 0}
            onClick={() => { setPlaying(false); setGapPending(false); setWatchShown(0) }}>Restart</button>
        </>}
        {mode === 'trace' && <>
          <button type="button" disabled={!ink.length} onClick={() => setInk((all) => all.slice(0, -1))}>Undo</button>
          <button type="button" disabled={!ink.length} onClick={() => setInk([])}>Clear</button>
          <button type="button" aria-pressed={showOutline} onClick={() => setShowOutline((v) => !v)}>
            {showOutline ? 'Hide outline' : 'Show outline'}</button>
        </>}
        {mode === 'guided' && <>
          <button type="button" disabled={finished}
            onClick={() => { setMisses((m) => Math.max(m, hintAfterMisses || 1)); setHintKey((k) => k + 1) }}>Show me</button>
          <button type="button" onClick={() => { setDone(0); setMisses(0); setRejected(null) }}>Start again</button>
        </>}
      </div>
    </div>
  )
}

function AnimatedStroke({ clip, median, durationMs, className, onEnd }: {
  clip: string; median: number[][]; durationMs: number; className: string; onEnd?: () => void
}) {
  // Extend past both ends so the clipped fill reaches the stroke tips.
  const length = Math.ceil(medianLength(median)) + 200
  return (
    <g clipPath={'url(#' + clip + ')'} transform={DATA_TRANSFORM}>
      <path d={medianPath(median)} className={className} onAnimationEnd={onEnd}
        style={{ strokeDasharray: length, strokeDashoffset: length, animationDuration: durationMs + 'ms' }} />
    </g>
  )
}

function pointsAttr(line: Point[]): string {
  return line.map((p) => Math.round(p.x) + ',' + Math.round(p.y)).join(' ')
}
