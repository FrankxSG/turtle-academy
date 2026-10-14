import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  DATA_TRANSFORM, VIEW_SIZE, checkStroke, medianLength, medianPath, toView,
  type CharacterData, type Point,
} from './strokeMath'
import './strokeTracer.css'

/**
 * StrokeTracer (trial, later phase — not wired into the Pilot app).
 *
 * - `watch`: animates the reference stroke order.
 * - `trace`: free finger/stylus ink over a faint outline. Ungraded, no
 *   stroke-order inference, nothing stored: compatible with Pilot P0-17.
 * - `guided`: each stroke is checked geometrically against the reference
 *   stroke in order (start, end, direction, shape). This IS stroke-order
 *   checking, so it is outside the current Pilot boundary and kept for a
 *   later-phase decision.
 *
 * All ink lives in component state only and is discarded on unmount or when
 * the character/mode changes. The component never writes to storage.
 */
export type StrokeTracerMode = 'watch' | 'trace' | 'guided'

export type GuidedSummary = {
  character: string
  strokeCount: number
  mistakes: number
  hintsShown: number
}

export type StrokeTracerProps = {
  character: string
  data: CharacterData
  mode: StrokeTracerMode
  /** Rendered width/height in CSS px. */
  size?: number
  /** Guided only: >1 is kinder, <1 stricter. */
  leniency?: number
  /** Guided only: misses on one stroke before its hint animation plays. */
  hintAfterMisses?: number
  /** Guided only: called once when all strokes are matched. Not persisted here. */
  onGuidedComplete?: (summary: GuidedSummary) => void
}

const INK_WIDTH = 46
// Touch contacts wider than this (CSS px) are treated as a resting palm.
const PALM_CONTACT_PX = 44
const STROKE_MS = 650
const STROKE_GAP_MS = 250

export function StrokeTracer({
  character, data, mode, size = 320, leniency = 1, hintAfterMisses = 3, onGuidedComplete,
}: StrokeTracerProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const activePointer = useRef<number | null>(null)
  const penSeen = useRef(false)
  const [ink, setInk] = useState<Point[][]>([])
  const [current, setCurrentState] = useState<Point[] | null>(null)
  // Mirror of `current` so pointerup always sees every point, even before React re-renders.
  const currentRef = useRef<Point[] | null>(null)
  const setCurrent = (line: Point[] | null) => { currentRef.current = line; setCurrentState(line) }
  const [rejected, setRejected] = useState<Point[] | null>(null)
  const [done, setDone] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [misses, setMisses] = useState(0)
  const [hints, setHints] = useState(0)
  const [replay, setReplay] = useState(0)
  const completedRef = useRef(false)

  const medians = useMemo(() => data.medians.map((m) => m.map(toView)), [data])
  const strokeCount = data.strokes.length
  const finished = mode === 'guided' && done >= strokeCount
  const clipBase = useMemo(() => 'st-' + Math.random().toString(36).slice(2, 9), [])

  // Every change of character or mode starts fresh in the same render, so old
  // ink is never shown against a new character. Nothing carries over.
  const [shownFor, setShownFor] = useState({ character, mode, data })
  if (shownFor.character !== character || shownFor.mode !== mode || shownFor.data !== data) {
    setShownFor({ character, mode, data })
    setInk([]); setCurrentState(null); setRejected(null)
    setDone(0); setMistakes(0); setMisses(0); setHints(0)
  }
  useEffect(() => {
    currentRef.current = null
    activePointer.current = null
    completedRef.current = false
  }, [character, mode, data])

  useEffect(() => {
    if (!rejected) return
    const timer = window.setTimeout(() => setRejected(null), 450)
    return () => window.clearTimeout(timer)
  }, [rejected])

  function toPoint(event: { clientX: number; clientY: number }): Point | null {
    const ctm = svgRef.current?.getScreenCTM()
    if (!ctm) return null
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse())
    return { x: p.x, y: p.y }
  }

  const canDraw = mode !== 'watch' && !finished

  function onPointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (!canDraw || activePointer.current !== null) return
    if (event.pointerType === 'pen') penSeen.current = true
    if (event.pointerType === 'touch'
      && (penSeen.current || event.width > PALM_CONTACT_PX || event.height > PALM_CONTACT_PX)) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const point = toPoint(event)
    if (!point) return
    event.preventDefault()
    activePointer.current = event.pointerId
    // Capture keeps the stroke when a finger slides off the board; it can throw
    // if the pointer has already gone, in which case drawing still works.
    try { event.currentTarget.setPointerCapture(event.pointerId) } catch { /* ignore */ }
    setCurrent([point])
  }

  function onPointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (event.pointerId !== activePointer.current) return
    const native = event.nativeEvent
    const events = typeof native.getCoalescedEvents === 'function' ? native.getCoalescedEvents() : []
    const points = (events.length ? events : [native]).map(toPoint).filter((p): p is Point => p !== null)
    if (points.length && currentRef.current) setCurrent(currentRef.current.concat(points))
  }

  function finishStroke(event: ReactPointerEvent<SVGSVGElement>, cancelled: boolean) {
    if (event.pointerId !== activePointer.current) return
    activePointer.current = null
    const line = currentRef.current
    setCurrent(null)
    if (cancelled || !line || line.length < 2) return
    if (mode === 'trace') { setInk((all) => all.concat([line])); return }
    if (mode !== 'guided' || done >= strokeCount) return
    const result = checkStroke(line, medians[done], leniency)
    if (result.matched) {
      const next = done + 1
      setDone(next); setMisses(0)
      if (next >= strokeCount && !completedRef.current) {
        completedRef.current = true
        onGuidedComplete?.({ character, strokeCount, mistakes, hintsShown: hints })
      }
    } else {
      const nextMisses = misses + 1
      setMistakes((n) => n + 1); setMisses(nextMisses); setRejected(line)
      if (hintAfterMisses > 0 && nextMisses >= hintAfterMisses && nextMisses % hintAfterMisses === 0) {
        setHints((n) => n + 1); setReplay((n) => n + 1)
      }
    }
  }

  const status = mode === 'watch' ? 'Watch the strokes appear in order.'
    : mode === 'trace' ? 'Trace over the grey character. Nothing is saved or marked.'
      : finished ? 'All ' + strokeCount + ' strokes done. Well traced!'
        : misses === 0 ? 'Stroke ' + (done + 1) + ' of ' + strokeCount + '.'
          : misses >= hintAfterMisses ? 'Watch the glowing stroke, then try again from the dot.'
            : 'Try stroke ' + (done + 1) + ' again. Start at the dot.'

  const nextStart = mode === 'guided' && !finished && misses > 0 ? medians[done][0] : null
  const showHint = mode === 'guided' && !finished && hints > 0 && misses >= hintAfterMisses

  return (
    <div className="st" style={{ width: size }}>
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
          <rect x="8" y="8" width={VIEW_SIZE - 16} height={VIEW_SIZE - 16} />
          <line x1={VIEW_SIZE / 2} y1="8" x2={VIEW_SIZE / 2} y2={VIEW_SIZE - 8} />
          <line x1="8" y1={VIEW_SIZE / 2} x2={VIEW_SIZE - 8} y2={VIEW_SIZE / 2} />
        </g>

        <g transform={DATA_TRANSFORM}>
          {data.strokes.map((d, i) => (
            <path key={i} d={d} className={mode === 'guided' && i < done ? 'st-stroke-done' : 'st-outline'} />
          ))}
        </g>

        {mode === 'watch' && (
          <g key={'watch-' + replay}>
            {data.medians.map((median, i) => <AnimatedStroke key={i} clip={clipBase + '-' + i} median={median}
              delay={i * (STROKE_MS + STROKE_GAP_MS)} className="st-anim" />)}
          </g>
        )}

        {showHint && (
          <g key={'hint-' + replay}>
            <AnimatedStroke clip={clipBase + '-' + done} median={data.medians[done]} delay={0} className="st-anim st-hint" />
          </g>
        )}

        <g className="st-ink" aria-hidden="true">
          {ink.map((line, i) => <polyline key={i} points={pointsAttr(line)} strokeWidth={INK_WIDTH} />)}
          {current && <polyline points={pointsAttr(current)} strokeWidth={INK_WIDTH} />}
          {rejected && <polyline className="st-rejected" points={pointsAttr(rejected)} strokeWidth={INK_WIDTH} />}
        </g>

        {nextStart && <circle className="st-start" cx={nextStart.x} cy={nextStart.y} r="34" aria-hidden="true" />}
      </svg>

      <p className="st-status" role="status" aria-live="polite" data-testid="stroke-status">{status}</p>

      <div className="st-actions">
        {mode === 'watch' && <button type="button" onClick={() => setReplay((n) => n + 1)}>Replay</button>}
        {mode === 'trace' && <>
          <button type="button" disabled={!ink.length} onClick={() => setInk((all) => all.slice(0, -1))}>Undo</button>
          <button type="button" disabled={!ink.length} onClick={() => setInk([])}>Clear</button>
        </>}
        {mode === 'guided' && <>
          <button type="button" onClick={() => { setHints((n) => n + 1); setMisses((m) => Math.max(m, hintAfterMisses)); setReplay((n) => n + 1) }}
            disabled={finished}>Show me</button>
          <button type="button" onClick={() => {
            setDone(0); setMistakes(0); setMisses(0); setHints(0); setRejected(null); completedRef.current = false
          }}>Start again</button>
        </>}
      </div>
    </div>
  )
}

function AnimatedStroke({ clip, median, delay, className }: { clip: string; median: number[][]; delay: number; className: string }) {
  // Extend the line slightly past both ends so the clipped fill reaches the stroke tips.
  const length = Math.ceil(medianLength(median)) + 200
  return (
    <g clipPath={'url(#' + clip + ')'} transform={DATA_TRANSFORM}>
      <path d={medianPath(median)} className={className}
        style={{ strokeDasharray: length, strokeDashoffset: length, animationDelay: delay + 'ms', animationDuration: STROKE_MS + 'ms' }} />
    </g>
  )
}

function pointsAttr(line: Point[]): string {
  return line.map((p) => Math.round(p.x) + ',' + Math.round(p.y)).join(' ')
}
