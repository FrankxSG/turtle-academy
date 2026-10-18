import { useState } from 'react'
import type { AuthClient } from '../auth/client.ts'
import type { Runtime } from '../ui/runtime.ts'
import { names, subjects, type Language } from '../ui/development.ts'
import { responseText } from '../ui/Practice.tsx'
import { resetPin, validPin, verifyPin } from './device.ts'
import { Mistakes } from './Mistakes.tsx'

export function Parent({
  id,
  runtime,
  language,
  unlocked,
  unlock,
  close,
  work,
  freshAuth,
  busy,
}: {
  id: string
  runtime: Runtime
  language: Language
  unlocked: boolean
  unlock: () => void
  close: () => void
  work: (fn: () => Promise<unknown>) => Promise<void>
  freshAuth: () => AuthClient
  busy: boolean
}) {
  const [pin, setPin] = useState('')
  const [reset, setReset] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [zone, setZone] = useState(runtime.engine.state.settings.timezone)
  const zh = language === 'zh'
  const engine = runtime.engine
  const tr = (en: string, cn: string) => (zh ? cn : en)
  const reasons: Record<string, string> = {
    full: tr('Full task completed', '已完成整次练习'),
    shortened_no_eligible_content: tr(
      'No more eligible questions were available',
      '没有更多符合条件的题目',
    ),
    zero_eligible: tr(
      'No eligible questions were available',
      '没有可用的符合条件题目',
    ),
    replacements_exhausted: tr(
      'No suitable replacement questions remained',
      '没有合适的替换题目',
    ),
    in_progress: tr('In progress', '进行中'),
  }
  async function verify() {
    const entered = pin
    setPin('')
    setMessage('')
    await work(async () => {
      const r = await verifyPin(id, entered)
      if (r.ok) unlock()
      else
        setMessage(
          tr(
            `Still locked. Try again after ${r.waitSeconds} seconds.`,
            `未解锁，请在 ${r.waitSeconds} 秒后重试。`,
          ),
        )
    })
  }
  async function resetCurrent() {
    const entered = pin
    const secret = password
    setPin('')
    setPassword('')
    setMessage('')
    await work(async () => {
      await resetPin(id, entered, email, secret, freshAuth())
      setReset(false)
      setMessage(
        tr(
          'PIN changed. Unlock with your new PIN.',
          'PIN 已更改，请用新 PIN 解锁。',
        ),
      )
    })
  }
  return (
    <section className="parent">
      <div className="section-top">
        <p className="eyebrow">
          {tr('PARENT AREA · THIS DEVICE ONLY', '家长区 · 仅保存在本设备')}
        </p>
        <button onClick={close} disabled={busy}>
          {tr('Exit and lock', '退出并锁定')}
        </button>
      </div>
      <h1>{tr('A little support along the way.', '陪伴每一步成长。')}</h1>
      <p>
        {tr(
          'Development preview. Use synthetic data only. There is no cloud backup; clearing browser data can lose records.',
          '开发预览，请只使用模拟数据。没有云端备份，清除浏览器数据可能丢失记录。',
        )}
      </p>
      {!unlocked ? (
        <div className="parent-gate">
          <h2>
            {reset
              ? tr('Reset PIN online', '在线重设 PIN')
              : tr('Enter parent PIN', '输入家长 PIN')}
          </h2>
          <form
            onSubmit={(ev) => {
              ev.preventDefault()
              void (reset ? resetCurrent() : verify())
            }}
          >
            {reset && (
              <>
                <label>
                  {tr('Account email', '账户邮箱')}
                  <input
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    required
                  />
                </label>
                <label>
                  {tr('Account password', '账户密码')}
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                    required
                  />
                </label>
              </>
            )}
            <label>
              {reset ? tr('New PIN', '新 PIN') : tr('Parent PIN', '家长 PIN')}
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                minLength={4}
                maxLength={6}
                pattern="[0-9]{4,6}"
                value={pin}
                onChange={(ev) => setPin(ev.target.value)}
                required
              />
            </label>
            <button className="primary" disabled={busy || !validPin(pin)}>
              {reset
                ? tr('Verify password and reset', '验证密码并重设')
                : tr('Unlock parent area', '解锁家长区')}
            </button>
          </form>
          <button
            className="text-button"
            disabled={busy}
            onClick={() => {
              setReset(!reset)
              setPin('')
              setPassword('')
              setMessage('')
            }}
          >
            {reset
              ? tr('Back to PIN unlock', '返回 PIN 解锁')
              : tr('Forgot PIN?', '忘记 PIN？')}
          </button>
          <p className="small">
            {tr(
              'A 4–6 digit PIN deters casual access. Anyone who copies device storage can guess it offline; in-app back-off cannot prevent that. The PIN does not encrypt records or provide server authorization.',
              '4–6 位 PIN 只防止随手访问。复制设备存储的人可离线猜测 PIN；应用内等待限制无法阻止这种猜测。PIN 不加密记录，也不提供服务器授权。',
            )}
          </p>
        </div>
      ) : (
        <>
          <div className="settings-grid">
            <article>
              <h2>{tr('Daily practice size', '每日练习量')}</h2>
              <p>
                {tr(
                  '6–19 main questions per subject. Changes apply to new tasks. Language tasks finish whole materials and can exceed this number.',
                  '每科 6–19 题。更改从下一次新任务生效。语言任务完成整份材料，题数可能更多。',
                )}
              </p>
              {subjects.map((s) => (
                <label key={s}>
                  {names[language][s]}
                  <select
                    aria-label={`${names[language][s]} X`}
                    value={engine.xFor(s)}
                    disabled={busy}
                    onChange={(ev) =>
                      void work(() => engine.setX(s, Number(ev.target.value)))
                    }
                  >
                    {Array.from({ length: 14 }, (_, i) => i + 6).map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
              ))}
            </article>
            <article>
              <h2>{tr('Time and rest', '时间与休息')}</h2>
              <form
                onSubmit={(ev) => {
                  ev.preventDefault()
                  void work(() => engine.setTimezone(zone))
                }}
              >
                <label>
                  {tr('Timezone', '时区')}
                  <input
                    value={zone}
                    onChange={(ev) => setZone(ev.target.value)}
                    required
                  />
                </label>
                <button disabled={busy}>
                  {tr('Save timezone', '保存时区')}
                </button>
              </form>
              <p>
                {tr(
                  'Timezone changes do not create extra learning days or bring review forward.',
                  '更改时区不会提前解锁复习，也不会重复计算学习日。',
                )}
              </p>
              <button
                disabled={busy || engine.dailyStatus().rest}
                onClick={() => void work(() => engine.setRestDay())}
              >
                {tr('Today is a rest day', '今天休息')}
              </button>
            </article>
          </div>
          {runtime.program && (
            <Mistakes
              program={runtime.program}
              language={language}
              work={work}
              busy={busy}
            />
          )}
          <section className="summary">
            <h2>{tr('Practice summary', '练习记录')}</h2>
            {engine.state.completions
              .filter((c) => c.task_id === null)
              .map((c) => (
                <p key={`${c.subject}:${c.local_date}`}>
                  {names[language][c.subject]} · {c.local_date}:{' '}
                  {reasons[c.reason]}
                </p>
              ))}
            <p>
              {tr(
                'Measured active time excludes pause, background time and gaps of two minutes or more. Teaching counts; planned workload is not a measured duration.',
                '实际活跃时间不计暂停、后台与两分钟无操作。教学计入；估计题量不等于实际时长。',
              )}
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{tr('Subject', '科目')}</th>
                    <th>{tr('Actual active seconds', '实际活跃时间（秒）')}</th>
                    <th>{tr('Answered / planned', '已提交 / 计划题数')}</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s) => {
                    const tasks = engine.state.tasks.filter(
                      (t) => t.subject === s,
                    )
                    return (
                      <tr key={s}>
                        <th>{names[language][s]}</th>
                        <td data-testid={`time-${s}`}>
                          {tasks.reduce((n, t) => n + t.active_seconds, 0)}
                        </td>
                        <td>
                          {tasks.reduce(
                            (n, t) => n + engine.answeredCount(t),
                            0,
                          )}{' '}
                          / {tasks.reduce((n, t) => n + t.planned_total, 0)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {engine.state.tasks.map((t) => (
              <details key={t.id}>
                <summary>
                  {names[language][t.subject]} · {t.local_date} ·{' '}
                  {t.status === 'finalised'
                    ? tr('Finished', '已结束')
                    : tr('In progress', '进行中')}
                </summary>
                <p>
                  {tr('Completion reason: ', '结束原因：')}
                  {
                    reasons[
                      engine.state.completions.find((c) => c.task_id === t.id)
                        ?.reason ?? 'in_progress'
                    ]
                  }
                </p>
                <ol>
                  {engine.state.presentations
                    .filter((p) => p.task_id === t.id)
                    .map((p) => (
                      <li key={p.id}>
                        <p>
                          {tr('Question', '问题')} {p.position + 1}
                          {p.status === 'flagged_replaced' ||
                          p.status === 'invalidated'
                            ? tr(
                                ' (replaced, excluded from evidence)',
                                '（已替换，不计入证据）',
                              )
                            : ''}
                        </p>
                        <ul>
                          {engine.state.events
                            .filter((e) => e.presentation_id === p.id)
                            .map((e) => (
                              <li key={e.id}>
                                {e.phase === 'first'
                                  ? tr('First answer', '首次答案')
                                  : e.phase === 'retry'
                                    ? tr('Hint-assisted retry', '提示后重试')
                                    : tr('Supported correction', '辅助订正')}
                                : {responseText(p.item_id, e.response)} ·{' '}
                                {e.correct
                                  ? tr('correct', '正确')
                                  : tr('needs correction', '需订正')}{' '}
                              </li>
                            ))}
                        </ul>
                      </li>
                    ))}
                </ol>
              </details>
            ))}
          </section>
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  )
}
