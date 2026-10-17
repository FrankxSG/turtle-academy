import type { LearningEngine, Step } from '../engine/engine.ts'
import type { Response } from '../engine/types.ts'
import { Answer } from './Answer.tsx'
import { exercise, material, names, type Language } from './development.ts'

export function responseText(itemId: string, response: Response): string {
  const e = exercise(itemId)
  const option = (id: string) => e.options.find((o) => o.id === id)?.text ?? '—'
  return response.kind === 'matching' ? response.pairs.map((p) => `${e.left?.find((l) => l.id === p.left)?.text ?? '—'} ↔ ${option(p.right)}`).join('; ') : response.option_ids.map(option).join(response.kind === 'ordered' ? ' → ' : ', ')
}
export function Practice({ engine, step, language, busy, submit, teaching, pause, flag }: { engine: LearningEngine; step: Step; language: Language; busy: boolean; submit: (r: Response) => void; teaching: () => void; pause: () => void; flag: () => void }) {
  const task = engine.task(step.taskId)
  const zh = language === 'zh'
  const p = step.kind === 'question' ? step.presentation : null
  const releaseMaterial = p?.material_ref ? material(p.material_ref) : null
  const slots = p?.material_ref ? task.plan.slots.filter((s) => s.material_ref === p.material_ref) : []
  // No first-answer correctness is rendered while ANY answerable material question awaits its first response.
  const materialFinishedFirst = slots.length > 0 && slots.every((slot) => engine.state.presentations.some((row) => row.task_id === task.id && row.position === slot.position && row.status !== 'flagged_replaced' && engine.state.events.some((ev) => ev.presentation_id === row.id && ev.phase === 'first')))
  return <section className="practice"><div className="section-top"><p className="eyebrow">{names[language][task.subject]} · {zh ? '开发用模拟内容' : 'SYNTHETIC DEVELOPMENT CONTENT'}</p><button disabled={busy} onClick={pause}>{zh ? '暂停并返回' : 'Pause and return'}</button></div><h1>{zh ? '仔细看看，慢慢想。' : 'Look closely. Take your time.'}</h1><p>{zh ? '先观察，再尝试。提交前可以修改答案。' : 'Notice the details. You can change your choice before submitting.'}</p><progress aria-label={zh ? '练习进度' : 'Practice progress'} max={task.planned_total} value={engine.answeredCount(task)} /><p>{engine.answeredCount(task)} / {task.planned_total} {zh ? '题已提交' : 'questions answered'}</p>
    {releaseMaterial && <article className="material"><h2>{releaseMaterial.title}</h2><p className="academic">{releaseMaterial.text}</p><p className="shape-picture" aria-label="● ■ ▲">●　■　▲</p><ol>{slots.map((slot) => {
      const row = engine.state.presentations.find((r) => r.task_id === task.id && r.position === slot.position && r.status !== 'flagged_replaced' && r.status !== 'invalidated')
      const id = row?.item_id ?? slot.item_id
      if (!id) return null
      const first = row && engine.state.events.find((ev) => ev.presentation_id === row.id && ev.phase === 'first')
      return <li key={slot.position} className={row?.id === p?.id ? 'current-question' : ''}><p className="academic">{exercise(id).stem}</p>{first && <p>{zh ? '你的首次答案：' : 'Your first answer: '}{responseText(id, first.response)}{materialFinishedFirst && <span className="material-feedback"> · {first.correct ? (zh ? '正确' : 'Correct') : (zh ? '一起再看看' : 'Let’s look again')}</span>}</p>}</li>
    })}</ol><p>{zh ? '全部首次作答完成后，才会显示反馈。' : 'Feedback follows all first answers in this material.'}</p></article>}
    {step.kind === 'teaching' && <article className="question-card academic"><h2>Look at the shapes</h2><p className="shape-picture">●　■　▲</p><p>A circle has no corners. A square has four corners. A triangle has three. Look at each shape before choosing.</p><button className="primary" disabled={busy} onClick={teaching}>{zh ? '开始尝试' : 'Ready to try'}</button></article>}
    {step.kind === 'question' && <article className="question-card" aria-label={zh ? '当前问题' : 'Current question'} data-step={`${step.presentation.id}:${step.awaiting}`}><h2 className="academic" lang={task.subject === 'chinese' ? 'zh' : 'en'}>{exercise(step.item.id).stem}</h2>{!releaseMaterial && <p className="shape-picture">●　■　▲</p>}
      {step.awaiting === 'retry' && <aside className="hint academic"><strong>{zh ? '提示' : 'Hint'}</strong><p>{exercise(step.item.id).hint}</p></aside>}
      {step.awaiting === 'correction' && <aside className="hint academic"><strong>{zh ? '一起订正' : 'Supported correction'}</strong><p>{exercise(step.item.id).explanation}</p><p>{zh ? '请根据说明选择一次答案。' : 'Use the explanation to choose the answer once more.'}</p></aside>}
      <Answer key={`${step.presentation.id}-${step.awaiting}`} exercise={exercise(step.item.id)} language={language} disabled={busy} submit={submit} />
      <button className="text-button" disabled={busy} onClick={flag}>{zh ? '这道题可能有问题，换一题' : 'Report a problem and replace this question'}</button>
    </article>}
    {step.kind === 'done' && <article className="question-card"><h2>{zh ? '这次练习完成了！' : 'This trail is complete!'}</h2><p>{step.completion.answered} {zh ? '题已完成。' : 'questions completed.'}</p>{step.completion.reason !== 'full' && <p>{zh ? '可用题目不足，按实际完成数量结束。家长区可查看原因。' : 'This task ended at the actual count because no more eligible questions were available. The reason is in the parent summary.'}</p>}<button className="primary" disabled={busy} onClick={pause}>{zh ? '返回小岛' : 'Return to the island'}</button></article>}
  </section>
}
