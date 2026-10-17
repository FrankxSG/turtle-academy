import { useState } from 'react'
import type { Response } from '../engine/types.ts'
import type { Exercise, Language } from './development.ts'

/** Tap/click controls work with touch, mouse and keyboard. Drag is never required. */
export function Answer({
  exercise: e,
  language,
  disabled,
  submit,
}: {
  exercise: Exercise
  language: Language
  disabled: boolean
  submit: (r: Response) => void
}) {
  const [selected, setSelected] = useState<string[]>([])
  const [pairs, setPairs] = useState<Record<string, string>>({})
  const kind = e.key.kind
  const zh = language === 'zh'
  const complete =
    kind === 'matching'
      ? e.left!.every((l) => pairs[l.id])
      : kind === 'ordered'
        ? selected.length === e.options.length
        : selected.length === 1
  return (
    <fieldset disabled={disabled} className="answer-input">
      <legend>{zh ? '选择你的答案' : 'Choose your answer'}</legend>
      {kind === 'matching' ? (
        <div className="match-grid">
          {e.left!.map((l) => (
            <label key={l.id}>
              {l.text}
              <select
                aria-label={`${zh ? '配对' : 'Match'} ${l.text}`}
                value={pairs[l.id] ?? ''}
                onChange={(ev) =>
                  setPairs({ ...pairs, [l.id]: ev.target.value })
                }
              >
                <option value="">{zh ? '请选择' : 'Choose…'}</option>
                {e.options.map((o) => (
                  <option
                    key={o.id}
                    value={o.id}
                    disabled={Object.entries(pairs).some(
                      ([key, val]) => key !== l.id && val === o.id,
                    )}
                  >
                    {o.text}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      ) : (
        <div className="options">
          {e.options.map((o) => (
            <button
              type="button"
              key={o.id}
              aria-pressed={selected.includes(o.id)}
              onClick={() =>
                setSelected(
                  kind === 'ordered'
                    ? selected.includes(o.id)
                      ? selected.filter((s) => s !== o.id)
                      : [...selected, o.id]
                    : [o.id],
                )
              }
            >
              {kind === 'ordered' && selected.includes(o.id) && (
                <span className="order-number">
                  {selected.indexOf(o.id) + 1}
                </span>
              )}
              {o.text}
            </button>
          ))}
        </div>
      )}
      {kind === 'ordered' && (
        <p aria-live="polite">
          {zh ? '当前顺序：' : 'Your order: '}
          {selected
            .map((id) => e.options.find((o) => o.id === id)!.text)
            .join(' → ') || '…'}{' '}
          <button type="button" onClick={() => setSelected([])}>
            {zh ? '重新排列' : 'Clear order'}
          </button>
        </p>
      )}
      <button
        className="primary"
        disabled={!complete}
        onClick={() =>
          submit({
            kind,
            option_ids: selected,
            pairs: Object.entries(pairs).map(([left, right]) => ({
              left,
              right,
            })),
          })
        }
      >
        {zh ? '提交答案' : 'Submit answer'}
      </button>
    </fieldset>
  )
}
