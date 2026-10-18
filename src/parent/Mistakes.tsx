// Parent-only (PIN-gated) mistake programme panel: install the private pack, see every accepted case with its
// evidence-based status, record parent-observed writing/pinyin/speaking checks and save the private export.
//
// Nothing here is shown to the child. The pack and export are files the parent moves on purpose; the app holds
// no repository credentials (TDD: private repository writes happen outside the child app).
import { useState } from 'react'
import type { MistakeProgram } from '../mistakes/program.ts'
import type { CaseRow, CaseStatus } from '../mistakes/report.ts'
import type { ProductionEvent } from '../mistakes/production.ts'
import type { Language } from '../ui/development.ts'

export function Mistakes({
  program,
  language,
  work,
  busy,
}: {
  program: MistakeProgram
  language: Language
  work: (fn: () => Promise<unknown>) => Promise<void>
  busy: boolean
}) {
  if (!__PRIVATE_PACK_ENABLED__) return null
  const zh = language === 'zh'
  const tr = (en: string, cn: string) => (zh ? cn : en)
  const [, setTick] = useState(0)
  const [message, setMessage] = useState('')
  const refresh = () => setTick((n) => n + 1)
  const report = program.report()
  const plans = program.plans()

  const status: Record<CaseStatus, string> = {
    not_imported: tr('Not imported', '未导入'),
    pending_content: tr('Waiting for questions', '题目待补充'),
    not_yet_evidenced: tr('Not yet evidenced', '尚无练习证据'),
    in_repair: tr('In repair', '订正练习中'),
    in_delayed_review: tr('In delayed review', '延时复查中'),
    external_only: tr('Parent-observed only', '仅家长观察'),
  }
  const stageName = (s: string | null) =>
    s === null
      ? '—'
      : ({
          acquisition: tr('learn', '学习'),
          exact: tr('same question', '原题'),
          similar: tr('similar', '相似题'),
          generic: tr('new context', '新情境'),
          delayed_review: tr('delayed check', '延时复查'),
        }[s] ?? s)

  async function install(file: File) {
    setMessage('')
    await work(async () => {
      try {
        const r = await program.installPack(JSON.parse(await file.text()))
        const added = r.added_targets + r.added_observations > 0
        setMessage(
          tr(
            `Imported. New practice targets: ${r.added_targets}; new cases linked to existing targets: ${r.added_observations}.` +
              (added ? ' New cases start tomorrow.' : ' Nothing new; existing progress is unchanged.'),
            `已导入。新增练习目标 ${r.added_targets} 个；链接到已有目标的新错例 ${r.added_observations} 个。` +
              (added ? '新错例明天开始练习。' : '没有新内容，已有进度不变。'),
          ),
        )
      } catch (e) {
        const detail = e instanceof Error ? e.message : String(e)
        // A rejected file and a failed save on this device need different actions from the parent.
        setMessage(
          e instanceof Error && e.name === 'PackRejected'
            ? tr('This file was not accepted: ', '文件未被接受：') + detail
            : tr(
                'The pack could not be saved on this device, so nothing new is in use. Please try again. Details: ',
                '错题包未能保存在本设备上，新内容未启用。请再试一次。详情：',
              ) + detail,
        )
      }
      refresh()
    })
  }

  function download() {
    const file = program.exportFile()
    if (!file) return
    const blob = new Blob([JSON.stringify(file, null, 2) + '\n'], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mistake-progress-${file.as_of}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function record(planId: string, mode: ProductionEvent['mode'], result: ProductionEvent['result']) {
    await work(async () => {
      await program.recordProduction(planId, mode, result)
      refresh()
    })
  }

  return (
    <section className="summary" aria-labelledby="mistakes-title">
      <h2 id="mistakes-title">{tr('Mistake practice', '错题练习')}</h2>
      <p>
        {tr(
          'Load the private mistake pack prepared from the private repository. Accepted cases become practice targets from the next day. Questions answered in the app count only for recognition; writing, pinyin writing and speaking are checked by you below.',
          '载入从私有仓库生成的错题包。已确认的错例从第二天开始进入练习。应用内答题只证明认读与选择；书写、拼音书写和说话由家长在下方记录。',
        )}
      </p>
      <label>
        {tr('Private mistake pack (.json)', '私有错题包（.json）')}
        <input
          type="file"
          accept="application/json,.json"
          disabled={busy}
          data-testid="mistake-pack"
          onChange={(ev) => {
            const f = ev.target.files?.[0]
            ev.target.value = ''
            if (f) void install(f)
          }}
        />
      </label>
      {program.openError && (
        <p role="alert" data-testid="mistake-open-error">
          {tr(
            'The saved mistake pack does not fit this version of the app, so it is not in use. Practice continues. Load an updated pack from the private repository. Details: ',
            '已保存的错题包与当前版本不符，暂不使用；练习照常进行。请从私有仓库载入更新后的错题包。详情：',
          )}
          {program.openError}
        </p>
      )}
      {message && (
        <p role="status" data-testid="mistake-message">
          {message}
        </p>
      )}
      {!report ? (
        <p>{tr('No mistake pack loaded on this device yet.', '本设备尚未载入错题包。')}</p>
      ) : (
        <>
          <p data-testid="mistake-totals">
            {tr('Cases', '错例')} {report.totals.cases} ·{' '}
            {(Object.keys(status) as CaseStatus[])
              .filter((k) => report.totals[k] > 0)
              .map((k) => `${status[k]} ${report.totals[k]}`)
              .join(' · ')}
          </p>
          <button className="primary" disabled={busy} onClick={download} data-testid="mistake-export">
            {tr('Save progress file for the private repository', '保存进度文件（用于私有仓库）')}
          </button>
          <p className="small">
            {tr(
              'The file has case numbers, targets, answers and dates only — no names, account or device details. Commit it to the private repository; never attach it to the public project.',
              '文件只含错例编号、目标、作答与日期，不含姓名、账号或设备信息。请提交到私有仓库，切勿上传到公开项目。',
            )}
          </p>
          {report.expansion_queue.length > 0 && (
            <details>
              <summary>
                {tr('Waiting for questions', '题目待补充')} ({report.expansion_queue.length})
              </summary>
              <ul>
                {report.expansion_queue.map((q) => (
                  <li key={q.target_ref}>
                    {q.target_ref}: {tr('missing ', '缺少 ')}
                    {q.missing.map(stageName).join(', ')} · {q.cases.join(', ')}
                  </li>
                ))}
              </ul>
            </details>
          )}
          <div className="table-wrap">
            <table data-testid="mistake-table">
              <thead>
                <tr>
                  <th>{tr('Case', '错例')}</th>
                  <th>{tr('Target', '目标')}</th>
                  <th>{tr('Status', '状态')}</th>
                  <th>{tr('Stage', '阶段')}</th>
                  <th>{tr('First answers ✓/✗', '首答 ✓/✗')}</th>
                  <th>{tr('Next', '下次')}</th>
                  <th>{tr('Parent check', '家长检查')}</th>
                </tr>
              </thead>
              <tbody>
                {report.cases.map((c) => (
                  <CaseLine key={c.case_id} c={c} status={status} stageName={stageName} tr={tr} />
                ))}
              </tbody>
            </table>
          </div>
          {plans.size > 0 && (
            <>
              <h3>{tr('Writing, pinyin and speaking checks', '书写、拼音与说话检查')}</h3>
              <p className="small">
                {tr(
                  'Give the prompt with the model hidden. Choose "Correct on own" only if the child did it without help. Teaching, copying or prompting is "With help" and never moves the stage on.',
                  '遮住范字/范例后给出提示。孩子独立完成才选「独立正确」。讲解、照抄或提示属于「有帮助」，不会推进阶段。',
                )}
              </p>
              {[...plans.values()].map(({ plan, cases }) => {
                const p = program.productionProgress(plan.id)
                const prompt = plan.stages[p.stage === 'delayed_review' ? 'generic' : p.stage].prompt
                const waiting = p.next_on !== null && p.next_on > program.engine.today()
                return (
                  <article key={plan.id} className="production" data-testid={`plan-${plan.id}`}>
                    <p>
                      <strong>{cases.join(', ')}</strong> ·{' '}
                      {plan.mode === 'external_speaking'
                        ? tr('speaking', '说话')
                        : tr('writing', '书写')}{' '}
                      · {stageName(p.stage)}
                      {p.next_on ? ` · ${tr('from', '起')} ${p.next_on}` : ''}
                    </p>
                    <p lang="zh">{prompt}</p>
                    <p className="small">
                      {tr('Independent correct', '独立正确')} {p.independent_correct} ·{' '}
                      {tr('not yet', '尚未')} {p.independent_not_yet} · {tr('with help', '有帮助')} {p.supported}
                    </p>
                    {waiting && (
                      <p className="small">
                        {tr('Not due yet; a check now is kept but does not count.', '尚未到期；现在记录会保存，但不计入进度。')}
                      </p>
                    )}
                    <button disabled={busy} onClick={() => void record(plan.id, 'independent', 'correct')}>
                      {tr('Correct on own', '独立正确')}
                    </button>{' '}
                    <button disabled={busy} onClick={() => void record(plan.id, 'independent', 'not_yet')}>
                      {tr('Not yet', '尚未掌握')}
                    </button>{' '}
                    <button disabled={busy} onClick={() => void record(plan.id, 'supported', 'not_yet')}>
                      {tr('With help', '有帮助')}
                    </button>
                  </article>
                )
              })}
            </>
          )}
        </>
      )}
    </section>
  )
}

function CaseLine({
  c,
  status,
  stageName,
  tr,
}: {
  c: CaseRow
  status: Record<CaseStatus, string>
  stageName: (s: string | null) => string
  tr: (en: string, cn: string) => string
}) {
  // A case waiting for questions has no stage or date to show yet.
  const r = c.status === 'pending_content' ? null : c.recognition
  const prod = c.production
  return (
    <tr data-testid={`case-${c.case_id}`}>
      <th>
        {c.case_id}
        {c.uncertain && (
          <span title={tr('Source reading uncertain', '原始记录辨认不确定')}> ?</span>
        )}
      </th>
      <td lang="zh">
        {c.target}
        {c.shared_with.length > 0 && (
          <span className="small"> ({tr('shared with ', '与 ')}{c.shared_with.join(', ')})</span>
        )}
      </td>
      <td>{status[c.status]}</td>
      <td>{r ? stageName(r.stage) : '—'}</td>
      <td>{r ? `${r.first_responses.correct}/${r.first_responses.wrong}` : '—'}</td>
      <td style={{ whiteSpace: 'nowrap' }}>
        {r ? (r.next_delayed_check ?? r.eligible_from ?? '—') : '—'}
      </td>
      <td>
        {prod
          ? prod.events === 0
            ? tr('not yet evidenced', '尚无证据')
            : `${stageName(prod.stage)} · ✓${prod.independent_correct}`
          : '—'}
      </td>
    </tr>
  )
}
