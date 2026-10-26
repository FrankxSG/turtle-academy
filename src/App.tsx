import { useEffect, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { createAuthClient, readAuthConfig } from './auth/client.ts'
import type { Step } from './engine/engine.ts'
import type { Checkpoint, Response, Subject } from './engine/types.ts'
import { Hub } from './hub/Hub.tsx'
import {
  identityKey,
  initializeDevice,
  isInitialized,
  validPin,
} from './parent/device.ts'
import { Parent } from './parent/Parent.tsx'
import type { SaveStatus } from './engine/persistence.ts'
import { openRuntime, type Runtime } from './ui/runtime.ts'
import { keepStorage, type StorageKeep } from './ui/keep-storage.ts'
import { Practice } from './ui/Practice.tsx'
import type { Language } from './ui/development.ts'
import { stories, deliverStory, canPresentStory } from './ui/story.ts'
import { SyncManager, type SyncStatus } from './sync/manager.ts'
import { createTransport } from './sync/transport.ts'

const config = readAuthConfig(import.meta.env)
type Entry = 'loading' | 'login' | 'setup' | 'ready'

export function App() {
  const [auth] = useState(() => createAuthClient(config))
  const [entry, setEntry] = useState<Entry>('loading')
  const [id, setId] = useState('')
  const [runtime, setRuntime] = useState<Runtime | null>(null)
  const runtimeRef = useRef<Runtime | null>(null)
  const [language, setLanguage] = useState<Language>('en')
  const [view, setView] = useState<'hub' | 'practice' | 'parent'>('hub')
  const [unlocked, setUnlocked] = useState(false)
  const [step, setStep] = useState<Step | null>(null)
  const [checkpoint, setCheckpoint] = useState<Checkpoint | null>(null)
  const [busy, setBusy] = useState(false)
  const running = useRef(false)
  const [error, setError] = useState('')
  const [save, setSave] = useState<SaveStatus | null>(null)
  const [, redraw] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [timezone, setTimezone] = useState('Asia/Singapore')
  const [online, setOnline] = useState(navigator.onLine)
  const [kept, setKept] = useState<StorageKeep | null>(null)
  const [shellReady, setShellReady] = useState(false)
  const [sync, setSync] = useState<SyncStatus | null>(null)
  const syncRef = useRef<SyncManager | null>(null)
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW: () => {
      void navigator.serviceWorker.ready.then(() => setShellReady(true))
    },
  })
  const zh = language === 'zh'
  const tr = (en: string, cn: string) => (zh ? cn : en)

  async function load(key: string, zone: string) {
    const r = await openRuntime(key, zone)
    runtimeRef.current = r
    setRuntime(r)
    setLanguage(r.engine.state.settings.ui_language)
    setEntry('ready')
    setSave(r.writer.status())
  }
  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const session = auth.getStoredSession()
        const key = session ? await identityKey(session.userId) : null
        if (!alive) return
        if (key && (await isInitialized(key))) {
          if (!alive) return
          // No expiry check, network request or refresh gate for initialized local practice.
          const r = await openRuntime(key, 'Asia/Singapore')
          if (!alive) {
            r.close()
            return
          }
          runtimeRef.current = r
          setRuntime(r)
          setId(key)
          setEntry('ready')
          setLanguage(r.engine.state.settings.ui_language)
          setSave(r.writer.status())
        } else if (alive) setEntry('login')
      } catch (e) {
        if (alive) {
          setEntry('login')
          setError(
            e instanceof Error && e.message === 'practice_open_in_another_tab'
              ? 'This practice is open in another tab. Close it there, then reload.'
              : 'This browser could not open your saved progress. Allow local storage and reload; existing records have not been replaced.',
          )
        }
      }
    })()
    const connected = () => setOnline(navigator.onLine)
    window.addEventListener('online', connected)
    window.addEventListener('offline', connected)
    return () => {
      alive = false
      runtimeRef.current?.close()
      runtimeRef.current = null
      window.removeEventListener('online', connected)
      window.removeEventListener('offline', connected)
    }
  }, [auth])

  useEffect(() => runtime?.writer.onStatus(setSave), [runtime])
  // Live sync for this identity's working copy. Practice never waits for it: local saving comes first, uploads
  // queue, and runs start on open, foreground, reconnection, shortly after changes and on "Sync now".
  useEffect(() => {
    if (!runtime || !config || !id) return
    const manager = new SyncManager({
      transport: createTransport(config),
      auth,
      identity: id,
      identityOf: identityKey,
      records: runtime.records,
      pack: runtime.pack,
      engine: runtime.engine,
      program: () => runtime.program,
    })
    syncRef.current = manager
    const offStatus = manager.onStatus((s) => {
      setSync(s)
      redraw((n) => n + 1)
    })
    const offWriter = runtime.writer.onStatus(() => {
      void manager.refresh()
      manager.soon()
    })
    const online = () => void manager.syncNow('online')
    const visible = () => {
      if (!document.hidden) void manager.syncNow('foreground')
    }
    window.addEventListener('online', online)
    document.addEventListener('visibilitychange', visible)
    void manager.refresh().then(() => manager.syncNow('open'))
    return () => {
      offStatus()
      offWriter()
      window.removeEventListener('online', online)
      document.removeEventListener('visibilitychange', visible)
      manager.dispose()
      if (syncRef.current === manager) syncRef.current = null
      setSync(null)
    }
  }, [runtime, id, auth])
  // Bootstrap readiness is independent of network status: a lookup, failed request or expired session must
  // not let a reset device start a competing task before its saved task and content have been recovered.
  const restoring = !!config && (!sync || !sync.practiceReady)
  // When a reset device finishes restoring, show the family's restored language (setup and any switch made while
  // restoring were display-only or were replaced by the restored setting).
  const practiceReady = sync?.practiceReady ?? false
  useEffect(() => {
    if (practiceReady && runtimeRef.current) setLanguage(runtimeRef.current.engine.state.settings.ui_language)
  }, [practiceReady])
  // A separate, non-persistent client for re-verification (PIN reset, sync sign-in). Its sign-out revokes only its
  // own session, never the parent's other sessions.
  const freshAuth = () =>
    createAuthClient(config, {
      storage: null,
      fetch: (input, init) =>
        fetch(String(input).endsWith('/auth/v1/logout') ? `${input}?scope=local` : input, init),
    })
  // The device holds the working copy (the only copy until cloud sync exists): ask the browser not to clear it under storage pressure.
  useEffect(() => {
    if (entry !== 'ready') return
    let alive = true
    void keepStorage(navigator.storage).then((k) => { if (alive) setKept(k) })
    return () => { alive = false }
  }, [entry])
  useEffect(() => {
    if (!runtime) return
    const activeTask = () =>
      view === 'practice' && step && !checkpoint && step.kind !== 'done'
        ? step.taskId
        : null
    const visible = () => {
      setUnlocked(false)
      const task = activeTask()
      if (document.hidden) {
        if (task) void runtime.engine.background(task)
      } else {
        void runtime.writer.onForeground()
        if (task) void runtime.engine.resume(task)
      }
    }
    const touch = () => {
      const task = activeTask()
      if (!document.hidden && task) runtime.engine.touch(task)
    }
    const leave = () => {
      const task = activeTask()
      if (task) void runtime.engine.background(task)
    }
    document.addEventListener('visibilitychange', visible)
    document.addEventListener('pointerdown', touch)
    document.addEventListener('keydown', touch)
    window.addEventListener('pagehide', leave)
    // Persist accumulated interaction time without manufacturing new activity while idle.
    const timer = setInterval(() => {
      if (!document.hidden && activeTask()) void runtime.engine.flush()
    }, 15_000)
    return () => {
      document.removeEventListener('visibilitychange', visible)
      document.removeEventListener('pointerdown', touch)
      document.removeEventListener('keydown', touch)
      window.removeEventListener('pagehide', leave)
      clearInterval(timer)
    }
  }, [runtime, view, step, checkpoint])

  async function work(fn: () => Promise<unknown>) {
    if (running.current) return
    running.current = true
    setBusy(true)
    setError('')
    try {
      await fn()
      redraw((n) => n + 1)
    } catch (e) {
      const code = e instanceof Error ? e.message : ''
      setError(
        code.startsWith('reset_requires_')
          ? tr(
              'The action could not finish. Try again. Online PIN reset needs the same account’s valid password; failed verification leaves your PIN unchanged.',
              '操作未完成，请重试。在线重设需使用同一账户的有效密码，验证失败时原有 PIN 保持不变。',
            )
          : code === 'different_account'
            ? tr(
                'These records belong to a different parent account. Sign in with that account to sync them.',
                '这些记录属于另一个家长账户。请用该账户登录以同步。',
              )
          : code === 'sign_in_failed'
            ? tr(
                'Sign-in failed. Check your account details and connection, then try again.',
                '登录失败，请检查账户信息和网络后重试。',
              )
            : code === 'online_setup_required'
              ? tr(
                  'Connect to the internet to finish the first setup.',
                  '请连接网络以完成首次设置。',
                )
              : e instanceof RangeError
                ? tr(
                    'Use a valid timezone, such as Asia/Singapore.',
                    '请输入有效时区，例如 Asia/Singapore。',
                  )
                : tr(
                    'This change could not be saved securely. Please try again. Existing records have not been erased.',
                    '无法安全保存这次更改，请重试。原有记录没有被清除。',
                  ),
      )
    } finally {
      running.current = false
      setBusy(false)
    }
  }

  async function advance(taskId: string) {
    const r = runtimeRef.current!
    const next = await r.engine.next(taskId)
    setStep(next)
    const pending = r.engine.pendingCheckpoints()[0]
    if (
      pending &&
      canPresentStory(r.engine, next) &&
      !r.writer.status().warning
    ) {
      if (next.kind !== 'done') await r.engine.pause(taskId)
      // Persist delivered state BEFORE presenting a checkpoint, so reload cannot replay it.
      await deliverStory(r.engine, pending)
      // Present even if this delivery write failed: it is already marked delivered and queued, so
      // skipping the card would lose the scene once saving recovers. The save warning discloses
      // that a reload before recovery may show it again.
      setCheckpoint({ ...pending })
    }
  }
  async function login() {
    const secret = password
    setPassword('')
    await work(async () => {
      if (!navigator.onLine) throw new Error('online_setup_required')
      const result = await auth.signInWithPassword(email, secret)
      if (!result.ok) throw new Error('sign_in_failed')
      const key = await identityKey(result.session.userId)
      setId(key)
      setEmail('')
      if (await isInitialized(key)) await load(key, timezone)
      else setEntry('setup')
    })
  }
  async function setup() {
    const chosen = pin
    setPin('')
    setConfirmPin('')
    await work(async () => {
      if (!navigator.onLine) throw new Error('online_setup_required')
      new Intl.DateTimeFormat('en', { timeZone: timezone }).format()
      await initializeDevice(id, chosen)
      await load(id, timezone)
      runtimeRef.current!.engine.state.settings.ui_language = language
      await runtimeRef.current!.engine.flush()
      setLanguage(language)
    })
  }
  function start(subject: Subject) {
    void work(async () => {
      // A new or reset device first restores the family's records, so today's task is not started twice.
      if (restoring || (syncRef.current && !syncRef.current.status().practiceReady)) return
      if (runtime!.engine.dailyStatus().rest) return
      const result = await runtime!.engine.startOrResume(subject, {
        optional: true,
      })
      if (result.kind === 'task') {
        setView('practice')
        await advance(result.task.id)
      }
    })
  }
  function submit(response: Response) {
    void work(async () => {
      if (!step || step.kind !== 'question') return
      const e = runtime!.engine
      if (step.awaiting === 'first')
        await e.answer(step.presentation.id, response)
      else if (step.awaiting === 'retry')
        await e.retry(step.presentation.id, response)
      else await e.correct(step.presentation.id, response)
      await advance(step.taskId)
    })
  }
  function pause() {
    void work(async () => {
      if (step?.kind !== 'done' && step)
        await runtime!.engine.pause(step.taskId)
      setView('hub')
      setStep(null)
      setCheckpoint(null)
    })
  }
  function parent() {
    void work(async () => {
      if (view === 'practice' && step && step.kind !== 'done')
        await runtime!.engine.pause(step.taskId)
      setUnlocked(false)
      setCheckpoint(null)
      setView('parent')
    })
  }
  function toggle() {
    void work(async () => {
      const next = zh ? 'en' : 'zh'
      // While a reset device restores, change only what is shown: a saved edit would be queued and, as pending
      // local work, would replace the family's synced language when recovery finishes.
      if (runtime && !restoring) {
        runtime.engine.state.settings.ui_language = next
        await runtime.engine.flush()
      }
      setLanguage(next)
    })
  }

  return (
    <div className="app">
      <header className="header">
        <a className="brand" href="/" aria-label="Turtle Academy home">
          <img src="/turtle.svg" alt="" width="42" height="42" />
          <span>Turtle Academy</span>
        </a>
        <nav aria-label={tr('Main navigation', '主导航')}>
          <button disabled={busy} onClick={toggle}>
            {zh ? 'English' : '中文'}
          </button>
          {entry === 'ready' && (
            <button disabled={busy} onClick={parent}>
              {tr('Parent area', '家长区')}
            </button>
          )}
        </nav>
      </header>
      <main>
        <div className="preview-banner">
          {tr(
            'Development preview · synthetic learner records only · no subject is formally released',
            '开发预览 · 仅限模拟学习记录 · 所有科目均未正式发布',
          )}
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {save?.warning && (
          <div className="error" role="alert">
            <strong>
              {tr('Some changes are not saved.', '部分更改尚未保存。')}
            </strong>{' '}
            {tr(
              'Reloading, closing or termination may lose these changes. You may continue with this warning; the app retries while open.',
              '刷新、关闭或系统终止应用可能丢失这些更改。可在警告下继续，应用会自动重试。',
            )}
            <button
              disabled={busy}
              onClick={() =>
                void work(async () => {
                  await runtime!.writer.onForeground()
                })
              }
            >
              {tr('Retry local save', '重试本地保存')}
            </button>
          </div>
        )}
        {entry === 'loading' && (
          <p role="status">
            {tr('Opening this device’s records…', '正在打开本设备记录…')}
          </p>
        )}
        {entry === 'login' && (
          <section className="entry-card">
            <p className="eyebrow">{tr('PARENT SETUP', '家长首次设置')}</p>
            <h1>
              {tr(
                'Your island adventure begins here.',
                '小岛上的冒险，从这里开始。',
              )}
            </h1>
            <p>
              {tr(
                'First setup needs internet. Sign in with a pre-provisioned parent account, using synthetic data only.',
                '首次设置需联网。请用预先配置的家长账户登录，只使用模拟数据。',
              )}
            </p>
            {!config && (
              <p role="status">
                {tr(
                  'Sign-in is not configured. The developer must configure the synthetic test environment.',
                  '尚未配置登录服务，请由开发者配置测试环境。',
                )}
              </p>
            )}
            <form
              onSubmit={(ev) => {
                ev.preventDefault()
                void login()
              }}
            >
              <label>
                {tr('Parent email', '家长邮箱')}
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  required
                />
              </label>
              <label>
                {tr('Password', '密码')}
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  required
                />
              </label>
              <button className="primary" disabled={busy || !online || !config}>
                {tr('Sign in', '登录')}
              </button>
            </form>
          </section>
        )}
        {entry === 'setup' && (
          <section className="entry-card">
            <h1>{tr('Set up this device', '设置本设备')}</h1>
            <p>
              {tr(
                'Choose a 4–6 digit PIN for routine local parent controls. It does not encrypt records or provide server authorization.',
                '设置 4–6 位 PIN，只用于本设备的日常家长控制。PIN 不加密记录，也不提供服务器授权。',
              )}
            </p>
            <form
              onSubmit={(ev) => {
                ev.preventDefault()
                void setup()
              }}
            >
              <label>
                {tr('Choose PIN', '设置 PIN')}
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  value={pin}
                  maxLength={6}
                  onChange={(ev) => setPin(ev.target.value)}
                  required
                />
              </label>
              <label>
                {tr('Confirm PIN', '再次输入 PIN')}
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  value={confirmPin}
                  maxLength={6}
                  onChange={(ev) => setConfirmPin(ev.target.value)}
                  required
                />
              </label>
              <label>
                {tr('Timezone', '时区')}
                <input
                  value={timezone}
                  onChange={(ev) => setTimezone(ev.target.value)}
                  required
                />
              </label>
              <button
                className="primary"
                disabled={
                  busy || !online || !validPin(pin) || pin !== confirmPin
                }
              >
                {tr('Open the island', '打开小岛')}
              </button>
            </form>
          </section>
        )}
        {runtime && entry === 'ready' && (
          <>
            {view === 'hub' && (
              <>
                {restoring && (
                  <p role="status" data-testid="restoring">
                    {tr(
                      'Restoring this child’s records from the backend. Practice opens when it finishes.',
                      '正在从云端恢复孩子的记录，完成后即可练习。',
                    )}
                  </p>
                )}
                <Hub
                  engine={runtime.engine}
                  language={language}
                  busy={busy || restoring}
                  start={start}
                />
              </>
            )}
            {view === 'parent' && (
              <Parent
                id={id}
                runtime={runtime}
                language={language}
                unlocked={unlocked}
                unlock={() => setUnlocked(true)}
                close={() => {
                  setUnlocked(false)
                  setView('hub')
                  setStep(null)
                }}
                work={work}
                busy={busy}
                restoring={restoring}
                sync={sync}
                save={save}
                syncNow={() => void work(async () => { await syncRef.current?.syncNow('manual') })}
                signIn={(mail, secret) =>
                  void work(async () => {
                    if (!navigator.onLine) throw new Error('online_setup_required')
                    // Verify the account on a separate, non-persistent client first: a different account must
                    // never replace this working copy's session or receive its queued changes.
                    const verifier = freshAuth()
                    const check = await verifier.signInWithPassword(mail, secret)
                    if (!check.ok) throw new Error('sign_in_failed')
                    void verifier.signOut()
                    if ((await identityKey(check.session.userId)) !== id) throw new Error('different_account')
                    const result = await auth.signInWithPassword(mail, secret)
                    if (!result.ok) throw new Error('sign_in_failed')
                    await syncRef.current?.syncNow('sign_in')
                  })
                }
                signOut={() =>
                  void work(async () => {
                    syncRef.current?.dispose()
                    syncRef.current = null
                    await auth.signOut()
                    runtimeRef.current?.close()
                    runtimeRef.current = null
                    setRuntime(null)
                    setUnlocked(false)
                    setView('hub')
                    setStep(null)
                    setEntry('login')
                  })
                }
                freshAuth={freshAuth}
              />
            )}
            {view === 'practice' && step && !checkpoint && (
              <Practice
                engine={runtime.engine}
                step={step}
                language={language}
                busy={busy}
                submit={submit}
                teaching={() =>
                  void work(async () => {
                    await runtime.engine.completeTeaching(step.taskId)
                    await advance(step.taskId)
                  })
                }
                pause={pause}
                flag={() =>
                  void work(async () => {
                    if (step.kind === 'question') {
                      await runtime.engine.flag(
                        step.presentation.id,
                        'question_unclear',
                      )
                      await advance(step.taskId)
                    }
                  })
                }
              />
            )}
            {checkpoint && (
              <section
                className="story-card"
                aria-label={tr('Story checkpoint', '故事片段')}
              >
                <img src="/turtle.svg" alt="" />
                <p className="eyebrow">
                  {tr('A MOMENT WITH MOSS', '小岛来信')}
                </p>
                <h1>
                  {checkpoint.story_seq < stories.en.length
                    ? tr('The little lantern', '小灯的故事')
                    : tr('A visit from Moss', '小海龟来访')}
                </h1>
                <p>
                  {stories[language][checkpoint.story_seq] ??
                    tr(
                      'Moss rests beside the glowing lantern. There is always something small to notice here.',
                      '小海龟坐在明亮的小灯旁，等你一起看看今天的小岛。',
                    )}
                </p>
                <button
                  disabled={busy}
                  className="primary"
                  onClick={() =>
                    void work(async () => {
                      setCheckpoint(null)
                      if (step && step.kind !== 'done')
                        await runtime.engine.resume(step.taskId)
                      if (step) await advance(step.taskId)
                    })
                  }
                >
                  {tr('Continue', '继续')}
                </button>
              </section>
            )}
          </>
        )}
        <footer>
          <p>
            {online ? tr('Online', '在线') : tr('Offline', '离线')} ·{' '}
            {shellReady
              ? entry === 'ready'
                ? tr('Ready for an offline adventure', '应用已缓存，可离线打开')
                : tr(
                    'App cached; first setup still needs internet',
                    '应用已缓存，首次设置仍需联网',
                  )
              : tr('Preparing the offline app…', '正在准备离线应用…')}
          </p>
          <p>
            {config
              ? tr(
                  'Records are saved on this device first and sync to the family’s backend when online. Clearing browser storage loses changes not yet uploaded.',
                  '记录先保存在本设备，联网时同步到家庭云端。清除浏览器存储会丢失尚未上传的更改。',
                )
              : tr(
                  'Records stay on this device. Sync is not configured. Browser storage clearing or eviction can lose records.',
                  '记录仅在本设备，尚未配置同步。清除或回收浏览器存储可能丢失记录。',
                )}
          </p>
          {kept && (
            <p data-testid="storage-kept">
              {kept === 'kept'
                ? tr('This browser has agreed to keep these records when space runs low.', '浏览器已同意在空间不足时保留这些记录。')
                : kept === 'unsupported'
                ? tr(
                    'This browser cannot be asked to keep these records when space runs low. Keep enough free space on the device.',
                    '此浏览器无法设置在空间不足时保留这些记录。请为设备保留足够的可用空间。',
                  )
                : tr(
                    'This browser has not agreed to keep these records when space runs low. Add the app to the home screen, then reopen it from there. On iPhone or iPad, do this before practice starts: records made in the browser tab may not carry over.',
                    '浏览器尚未同意在空间不足时保留这些记录。请把应用添加到主屏幕，再从主屏幕打开。在 iPhone 或 iPad 上，请在开始练习前完成：浏览器标签页中的记录可能不会转移。',
                  )}
            </p>
          )}
          {needRefresh && (
            <button
              disabled={busy || view !== 'hub' || !!save?.warning}
              onClick={() => void updateServiceWorker(true)}
            >
              {tr('Update app when ready', '更新应用')}
            </button>
          )}
        </footer>
      </main>
    </div>
  )
}
