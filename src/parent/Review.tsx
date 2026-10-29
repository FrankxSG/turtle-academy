// Parent review of flagged questions and of mistake progress, with the corrections the parent can make
// (Functional Design §8). Shown only inside the unlocked parent area; every change goes through the engine's
// local, queued saving and syncs as add-only amendments.
import { useState } from 'react'
import type { LearningEngine } from '../engine/engine.ts'
import { ERROR_TYPES } from '../engine/policy.ts'
import type { Subject } from '../engine/types.ts'
import type { ProductionProgress } from '../mistakes/production.ts'
import { exercise, material, targetLabel } from '../ui/content.ts'
import { names, type Language } from '../ui/development.ts'
import { responseText } from '../ui/Practice.tsx'
import { flagGroups, progressRows, type ProgressRow } from './progress.ts'

/** Validation refusals the parent can act on; anything else is a save problem and goes to the app's error. */
const REFUSALS = new Set([
  'no_change', 'unknown_knowledge_point', 'unknown_error_type', 'assessed_skill_required', 'unknown_assessed_skill',
  'target_not_active', 'amend_requires_import', 'unknown_observation', 'task_not_finished', 'not_an_answer', 'no_content',
])

type Work = (fn: () => Promise<unknown>) => Promise<void>

function useRefusal(work: Work, zh: boolean) {
  const [message, setMessage] = useState('')
  const run = (fn: () => Promise<unknown>) => work(async () => {
    setMessage('')
    try {
      await fn()
    } catch (e) {
      const code = e instanceof Error ? e.message : ''
      if (!REFUSALS.has(code)) throw e
      setMessage(code === 'no_change'
        ? (zh ? '没有更改。' : 'Nothing was changed.')
        : (zh ? `无法保存这项更正（${code}）。记录没有改变。` : `This correction cannot be made (${code}). Nothing was changed.`))
    }
  })
  return { message, run }
}

function safeText(fn: () => string): string {
  try {
    return fn()
  } catch {
    return '—'
  }
}

export function FlagReview({ engine, language, work, busy }: { engine: LearningEngine; language: Language; work: Work; busy: boolean }) {
  const zh = language === 'zh'
  const tr = (en: string, cn: string) => (zh ? cn : en)
  const groups = flagGroups(engine.state)
  const open = groups.filter((g) => g.status === 'open')
  const decided = groups.filter((g) => g.status !== 'open')
  const reason: Record<string, string> = {
    answer_looks_wrong: tr('The answer looks wrong', '答案好像不对'),
    question_unclear: tr('The question is unclear', '题目不清楚'),
    too_hard: tr('Too hard', '太难'),
    other: tr('Other', '其他'),
  }
  return (
    <section className="summary" aria-labelledby="flags-title">
      <h2 id="flags-title">{tr('Flagged questions', '孩子标记的题目')}</h2>
      <p className="small">
        {tr(
          'A flagged question is skipped, replaced and kept out of practice for this child until you decide. Restore puts the version back into practice; keep disabled leaves it out for this child only. The shared question bank and other families are not changed.',
          '被标记的题目已跳过并替换，在您决定前不再给这个孩子练习。“恢复”让这一版本重新参与练习；“继续停用”只对这个孩子停用。共享题库和其他家庭不受影响。',
        )}
      </p>
      {groups.length === 0 && <p>{tr('No questions have been flagged.', '还没有被标记的题目。')}</p>}
      {open.length === 0 && decided.length > 0 && <p>{tr('No flags are waiting for a decision.', '没有等待决定的标记。')}</p>}
      {open.map(card)}
      {decided.length > 0 && (
        <details>
          <summary>{tr(`Decided earlier (${decided.length})`, `已决定（${decided.length}）`)}</summary>
          {decided.map(card)}
        </details>
      )}
    </section>
  )

  function card(g: (typeof groups)[number]) {
        const shown = g.flags.find((f) => f.contentVersion) ?? g.flags[0]
        const version = shown.contentVersion ?? undefined
        const ex = safeText(() => exercise(g.item_id, version).stem)
        const options = safeText(() => exercise(g.item_id, version).options.map((o) => o.text).join(' / '))
        const key = safeText(() => responseText(g.item_id, exercise(g.item_id, version).key, version))
        return (
          <article className="review-card" key={`${g.item_id}@${g.item_version}`} data-testid={`flag-${g.item_id}`}>
            <p className="small">
              {g.status === 'open'
                ? tr('Waiting for your decision', '等待您决定')
                : g.status === 'restored'
                  ? tr('Restored', '已恢复')
                  : tr('Disabled for this child', '已对这个孩子停用')}
              {' · '}{tr('version', '版本')} {g.item_version}
            </p>
            {shown.presentation?.material_ref && (
              <details>
                <summary>{tr('Passage this question belongs to', '这道题所属的阅读材料')}</summary>
                <p lang="zh" className="review-passage">
                  {safeText(() => { const m = material(shown.presentation!.material_ref!, version); return `${m.title}\n${m.text}` })}
                </p>
              </details>
            )}
            <p className="review-stem" lang="zh">{ex}</p>
            <p className="small">{tr('Options: ', '选项：')}<span lang="zh">{options}</span></p>
            <p className="small">{tr('Answer key: ', '参考答案：')}<span lang="zh">{key}</span></p>
            <ul>
              {g.flags.map((f) => (
                <li key={`${f.flagged_at}:${f.presentation_id ?? ''}`}>
                  {f.flagged_at.slice(0, 10)} · {reason[f.reason]} ·{' '}
                  {f.firstAnswer
                    ? <>{tr('child answered ', '孩子作答：')}<span lang="zh">{safeText(() => responseText(g.item_id, f.firstAnswer!.response, version))}</span> ({f.firstAnswer.correct ? tr('matches the key', '与答案一致') : tr('differs from the key', '与答案不同')})</>
                    : tr('flagged before answering', '作答前标记')}
                </li>
              ))}
            </ul>
            {g.status === 'open' && (
              <div className="actions">
                <button disabled={busy} onClick={() => void work(() => engine.decideFlag(g.item_id, g.item_version, 'restored'))}>
                  {tr('Restore question', '恢复这道题')}
                </button>
                <button disabled={busy} onClick={() => void work(() => engine.decideFlag(g.item_id, g.item_version, 'disabled'))}>
                  {tr('Keep disabled for this child', '对这个孩子继续停用')}
                </button>
              </div>
            )}
          </article>
        )
  }
}

const REPAIR_STEP_NUMBER: Record<string, number> = { exact: 1, similar: 2, generic: 3 }

const ERROR_LABELS: Record<string, { en: string; zh: string }> = {
  form_confusion: { en: 'Similar-looking form', zh: '字形混淆' },
  meaning_confusion: { en: 'Meaning confusion', zh: '意思混淆' },
  information_selection: { en: 'Picked the wrong information', zh: '信息选择错误' },
  sentence_order: { en: 'Sentence order', zh: '语序' },
  punctuation: { en: 'Punctuation', zh: '标点' },
  unknown_cause: { en: 'Cause not known', zh: '原因未明' },
}

export function ProgressView({
  engine, subject, language, work, busy, production,
}: {
  engine: LearningEngine
  subject: Subject
  language: Language
  work: Work
  busy: boolean
  /** Parent-observed writing/speaking progress per target (private pack), kept apart from recognition evidence. */
  production?: Map<string, ProductionProgress[]>
}) {
  const zh = language === 'zh'
  const tr = (en: string, cn: string) => (zh ? cn : en)
  const { message, run } = useRefusal(work, zh)
  const [editing, setEditing] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const rows = progressRows({ state: engine.state, derived: engine.derived(), today: engine.today(), subject, held: engine.heldTargets() })
  const stepName = [tr('original error', '原错误'), tr('related confusion', '相关混淆'), tr('broader application', '扩展运用')]
  const stateText = (r: ProgressRow) => {
    switch (r.state) {
      case 'repair': return `${tr('Repair', '订正')} ${r.repairStep}/3 · ${stepName[(r.repairStep ?? 1) - 1]}`
      case 'delayed_review': return tr('Delayed checks (not permanent mastery)', '延时复查（不代表永久掌握）')
      case 'learning': return tr('Learning', '学习中')
      case 'pending_content': return tr('Waiting for reviewed questions', '等待审核过的题目')
      case 'suspended': return tr('Paused: its question was flagged — decide above', '暂停：相关题目被标记，请在上方决定')
      case 'held': return tr('Paused: its mistake pack is set aside on this device', '暂停：本设备上的错题包已搁置')
      case 'unverified': return tr('Not verified, not practised', '未核实，不练习')
    }
  }
  const nextText = (r: ProgressRow) => r.next.kind === 'now' ? tr('Ready now', '现在可练习')
    : r.next.kind === 'after_task' ? tr('After the unfinished task ends', '未完成的练习结束后')
      : r.next.kind === 'date' ? (r.state === 'delayed_review' ? tr(`Next check ${r.next.date}`, `下次复查 ${r.next.date}`) : tr(`From ${r.next.date}`, `${r.next.date} 起`))
        : '—'
  return (
    <section className="summary" aria-labelledby={`progress-${subject}`}>
      <h2 id={`progress-${subject}`}>{tr(`${names.en[subject]} mistakes and progress`, `${names.zh[subject]}错题与进度`)}</h2>
      <p className="small">
        {tr(
          'One row per mistake target, including mistakes the app caught. Stages and dates are recalculated from the answers. “App answers” are recognition questions in the app; writing and speaking you observe are recorded separately and never counted as app answers.',
          '每个错题目标一行，包括应用自动记录的错题。阶段和日期根据作答重新计算。“应用作答”是应用内的辨认题；您观察到的书写和口头表现单独记录，不计入应用作答。',
        )}
      </p>
      {message && <p role="status">{message}</p>}
      {rows.length === 0 && <p>{tr('No mistakes are being practised.', '目前没有需要练习的错题。')}</p>}
      {rows.map((r) => {
        const t = r.target
        const label = t.target_value ?? targetLabel(t.knowledge_point_ref) ?? t.knowledge_point_ref ?? '—'
        const err = ERROR_LABELS[t.error_type]?.[zh ? 'zh' : 'en'] ?? t.error_type
        const prod = production?.get(t.id) ?? []
        return (
          <article className="review-card" key={t.id} data-testid={`progress-${t.id}`}>
            <h3><span lang="zh">{label}</span> <span className="small">· {err}</span></h3>
            <dl className="facts">
              <dt>{tr('Now', '现在')}</dt><dd data-testid="progress-state">{stateText(r)}</dd>
              <dt>{tr('Next practice', '下次练习')}</dt><dd data-testid="progress-next">{nextText(r)}</dd>
              <dt>{tr('Source', '来源')}</dt>
              <dd>
                {[r.appDays > 0 ? tr(`caught in app practice on ${r.appDays} day(s)`, `应用练习中出错 ${r.appDays} 天`) : null,
                  r.importedCases > 0 ? tr(`${r.importedCases} imported case(s) share this target`, `${r.importedCases} 个导入错题共用这个目标`) : null]
                  .filter(Boolean).join('; ')}
              </dd>
              <dt>{tr('App answers', '应用作答')}</dt>
              <dd data-testid="progress-recognition">
                {tr(
                  `${r.recognition.firstAnswers} first answers (${r.recognition.independentCorrect} correct without help, ${r.recognition.firstWrong} wrong); ${r.recognition.hintRetries} retries after a hint; ${r.recognition.corrections} supported corrections; ${r.recognition.repeatedItems} on a question seen before`,
                  `首次作答 ${r.recognition.firstAnswers} 次（独立答对 ${r.recognition.independentCorrect}，答错 ${r.recognition.firstWrong}）；提示后重试 ${r.recognition.hintRetries} 次；辅助订正 ${r.recognition.corrections} 次；其中 ${r.recognition.repeatedItems} 次是做过的题`,
                )}
                {r.recognition.lastPractisedOn ? tr(`; last ${r.recognition.lastPractisedOn}`, `；最近 ${r.recognition.lastPractisedOn}`) : ''}
              </dd>
              {prod.length > 0 && (
                <>
                  <dt>{tr('Writing/speaking you observed', '您观察的书写/口头')}</dt>
                  <dd data-testid="progress-production">
                    {prod.map((p) => {
                      const stage = p.stage === 'delayed_review' ? tr('delayed checks', '延时复查') : `${REPAIR_STEP_NUMBER[p.stage]}/3`
                      return tr(`stage ${stage}, ${p.independent_correct} correct on own, ${p.supported} with help`, `阶段 ${stage}，独立正确 ${p.independent_correct} 次，有帮助 ${p.supported} 次`)
                    }).join('; ')}
                  </dd>
                </>
              )}
            </dl>
            <div className="actions">
              {r.imported && (
                <button disabled={busy} onClick={() => { setEditing(editing === t.id ? null : t.id); setConfirming(null) }}>
                  {tr('Correct this mistake', '更正这条错题')}
                </button>
              )}
              {confirming === `target:${t.id}` ? (
                <>
                  <button className="primary" disabled={busy} onClick={() => void run(() => engine.invalidateTarget(t.id, 'not_a_mistake')).then(() => setConfirming(null))}>
                    {tr('Confirm: not a mistake', '确认：不是错题')}
                  </button>
                  <button disabled={busy} onClick={() => setConfirming(null)}>{tr('Cancel', '取消')}</button>
                </>
              ) : (
                <button disabled={busy} onClick={() => { setConfirming(`target:${t.id}`); setEditing(null) }}>
                  {tr('Not a mistake', '不是错题')}
                </button>
              )}
            </div>
            {editing === t.id && <AmendForm engine={engine} row={r} language={language} busy={busy} run={run} done={() => setEditing(null)} />}
            {r.imported && r.observations.length > 1 && (
              <ul className="small">
                {r.observations.map((o) => (
                  <li key={o.id}>
                    {o.id.replace(/^case:/, '').toUpperCase()} · {tr('observed', '记录日期')} {o.observed_on}{' '}
                    {confirming === `obs:${t.id}:${o.id}` ? (
                      <button disabled={busy} onClick={() => void run(() => engine.invalidateObservation(t.id, o.id, 'duplicate')).then(() => setConfirming(null))}>
                        {tr('Confirm duplicate', '确认重复')}
                      </button>
                    ) : (
                      <button disabled={busy} onClick={() => setConfirming(`obs:${t.id}:${o.id}`)}>{tr('Duplicate of another case', '与其他错题重复')}</button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </article>
        )
      })}
      <p className="small">
        {tr(
          'Corrections keep the original record and all answers. Progress is recalculated; finished days and story rewards already given are kept. There is no switch to mark something permanently mastered.',
          '更正会保留原记录和所有作答。进度会重新计算；已完成的日子和已给的故事奖励保持不变。没有“永久掌握”的开关。',
        )}
      </p>
    </section>
  )
}

function AmendForm({ engine, row, language, busy, run, done }: {
  engine: LearningEngine
  row: ProgressRow
  language: Language
  busy: boolean
  run: (fn: () => Promise<unknown>) => Promise<void>
  done: () => void
}) {
  const zh = language === 'zh'
  const tr = (en: string, cn: string) => (zh ? cn : en)
  const t = row.target
  const [kp, setKp] = useState(t.knowledge_point_ref ?? '')
  const [errorType, setErrorType] = useState(t.error_type)
  const release = engine.contentRelease(t.subject)
  const withQuestions = new Set(release?.items.filter((i) => i.course === t.course && i.material_ref === null).map((i) => i.knowledge_point_ref) ?? [])
  // Any point of the same course with reviewed short questions (a "word" mistake may really be a character one).
  const points = (release?.knowledge_points ?? []).filter((k) => k.course === t.course && (withQuestions.has(k.ref) || k.ref === t.knowledge_point_ref))
  const label = (ref: string) => targetLabel(ref) ?? ref
  const kindName: Record<string, string> = {
    character: tr('Characters', '汉字'), word: tr('Words', '词语'), language_point: tr('Language points', '语文知识'),
    reading_skill: tr('Reading skills', '阅读能力'),
  }
  const kinds = [...new Set(points.map((k) => k.target_kind))]
  const types = [...new Set(['unknown_cause', ...(ERROR_TYPES[t.subject] ?? []),
    ...(release?.items.filter((i) => i.knowledge_point_ref === kp).flatMap((i) => Object.values(i.error_types ?? {})) ?? [])])]
  return (
    <form
      className="amend-form"
      onSubmit={(ev) => {
        ev.preventDefault()
        const change = { ...(kp !== t.knowledge_point_ref ? { knowledge_point_ref: kp } : {}), ...(errorType !== t.error_type ? { error_type: errorType } : {}) }
        void run(async () => {
          await engine.amendTarget(t.id, change, kp !== t.knowledge_point_ref ? 'wrong_target' : 'wrong_error_type')
          done()
        })
      }}
    >
      <label>
        {tr('Target', '目标')}
        <select value={kp} onChange={(ev) => setKp(ev.target.value)} disabled={busy}>
          {kinds.map((kind) => (
            <optgroup key={kind} label={kindName[kind] ?? kind}>
              {points.filter((k) => k.target_kind === kind).sort((a, b) => label(a.ref).localeCompare(label(b.ref), 'zh'))
                .map((k) => <option key={k.ref} value={k.ref}>{label(k.ref)}</option>)}
            </optgroup>
          ))}
        </select>
      </label>
      <label>
        {tr('Error type', '错误类型')}
        <select value={errorType} onChange={(ev) => setErrorType(ev.target.value)} disabled={busy}>
          {types.map((x) => <option key={x} value={x}>{ERROR_LABELS[x]?.[zh ? 'zh' : 'en'] ?? x}</option>)}
        </select>
      </label>
      <p className="small">
        {tr(
          'Saving keeps the original and starts the corrected mistake again from stage 1 tomorrow: practice on the old target does not count for the new one.',
          '保存后保留原记录，更正后的错题明天起从第 1 阶段重新开始：旧目标的练习不计入新目标。',
        )}
      </p>
      <button className="primary" disabled={busy || (kp === t.knowledge_point_ref && errorType === t.error_type)}>{tr('Save correction', '保存更正')}</button>{' '}
      <button type="button" disabled={busy} onClick={done}>{tr('Cancel', '取消')}</button>
    </form>
  )
}
