import { useEffect, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { createAuthClient, readAuthConfig } from './auth/client.ts'
import type { Step } from './engine/engine.ts'
import type { Checkpoint, Response, Subject } from './engine/types.ts'
import { Hub } from './hub/Hub.tsx'
import { identityKey, initializeDevice, isInitialized, validPin } from './parent/device.ts'
import { Parent } from './parent/Parent.tsx'
import type { SaveStatus } from './engine/persistence.ts'
import { openRuntime, type Runtime } from './ui/runtime.ts'
import { Practice } from './ui/Practice.tsx'
import type { Language } from './ui/development.ts'

const config = readAuthConfig(import.meta.env)
const stories = {
  en: ['Moss finds a tiny lantern beside the library. Its light is sleeping. “Shall we look for its lost glow?”', 'By the pond, a ripple reflects a golden spark. Moss carries the spark gently back to the lantern.', 'A breeze turns the lantern toward the island path. Its glow reaches the library door.', 'The little lantern shines again. The island keeps its light, and Moss is ready for quiet visits and new discoveries.'],
  zh: ['小海龟在图书馆旁找到一盏小灯。灯光睡着了。“我们一起找回它的光，好吗？”', '池塘的波纹映出一颗金色的光点。小海龟轻轻把光点带回小灯旁。', '微风把小灯转向岛上的小路。温暖的光一直照到图书馆门口。', '小灯又亮起来了。小岛会一直保留这份光。小海龟也会陪你聊天，一起发现新事物。'],
}
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
  const [shellReady, setShellReady] = useState(false)
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({ onRegisteredSW: () => { void navigator.serviceWorker.ready.then(() => setShellReady(true)) } })
  const zh = language === 'zh'
  const tr = (en: string, cn: string) => zh ? cn : en

  async function load(key: string, zone: string) {
    const r = await openRuntime(key, zone)
    runtimeRef.current = r; setRuntime(r); setLanguage(r.engine.state.settings.ui_language)
    setEntry('ready'); setSave(r.writer.status())
  }
  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const session = auth.getStoredSession()
        const key = session ? await identityKey(session.userId) : null
        if (!alive) return
        if (key && await isInitialized(key)) {
          if (!alive) return
          // No expiry check, network request or refresh gate for initialized local practice.
          const r = await openRuntime(key, 'Asia/Singapore')
          if (!alive) { r.close(); return }
          runtimeRef.current = r; setRuntime(r); setId(key); setEntry('ready')
          setLanguage(r.engine.state.settings.ui_language); setSave(r.writer.status())
        } else if (alive) setEntry('login')
      } catch (e) { if (alive) { setEntry('login'); setError(e instanceof Error && e.message === 'practice_open_in_another_tab' ? 'This practice is open in another tab. Close it there, then reload.' : 'This browser could not open your saved progress. Allow local storage and reload; existing records have not been replaced.') } }
    })()
    const connected = () => setOnline(navigator.onLine)
    window.addEventListener('online', connected); window.addEventListener('offline', connected)
    return () => { alive = false; runtimeRef.current?.close(); runtimeRef.current = null; window.removeEventListener('online', connected); window.removeEventListener('offline', connected) }
  }, [auth])

  useEffect(() => runtime?.writer.onStatus(setSave), [runtime])
  useEffect(() => {
    if (!runtime) return
    const activeTask = () => view === 'practice' && step && !checkpoint && step.kind !== 'done' ? step.taskId : null
    const visible = () => {
      setUnlocked(false)
      const task = activeTask()
      if (document.hidden) { if (task) void runtime.engine.background(task) }
      else { void runtime.writer.onForeground(); if (task) void runtime.engine.resume(task) }
    }
    const touch = () => { const task = activeTask(); if (!document.hidden && task) runtime.engine.touch(task) }
    const leave = () => { const task = activeTask(); if (task) void runtime.engine.background(task) }
    document.addEventListener('visibilitychange', visible)
    document.addEventListener('pointerdown', touch); document.addEventListener('keydown', touch)
    window.addEventListener('pagehide', leave)
    // Persist accumulated interaction time without manufacturing new activity while idle.
    const timer = setInterval(() => { if (!document.hidden && activeTask()) void runtime.engine.flush() }, 15_000)
    return () => { document.removeEventListener('visibilitychange', visible); document.removeEventListener('pointerdown', touch); document.removeEventListener('keydown', touch); window.removeEventListener('pagehide', leave); clearInterval(timer) }
  }, [runtime, view, step, checkpoint])

  async function work(fn: () => Promise<unknown>) {
    if (running.current) return
    running.current = true; setBusy(true); setError('')
    try { await fn(); redraw((n) => n + 1) }
    catch { setError(tr('The action could not finish. Try again. Online PIN reset needs the same account’s valid password; failed verification leaves your PIN unchanged.', '操作未完成，请重试。在线重设需使用同一账户的有效密码，验证失败时原有 PIN 保持不变。')) }
    finally { running.current = false; setBusy(false) }
  }

  async function advance(taskId: string) {
    const r = runtimeRef.current!
    const next = await r.engine.next(taskId)
    setStep(next)
    const pending = r.engine.pendingCheckpoints()[0]
    if (pending && !r.writer.status().warning) {
      if (next.kind !== 'done') await r.engine.pause(taskId)
      // Persist delivered state BEFORE presenting a checkpoint, so reload cannot replay it.
      await r.engine.deliverCheckpoint(pending.id)
      r.engine.state.story.chapter = Math.max(r.engine.state.story.chapter, Math.min(pending.story_seq + 1, stories.en.length))
      if (pending.story_seq >= stories.en.length - 1) {
        r.engine.state.story.ended = true
        if (!r.engine.state.story.world_flags.includes('lantern-lit')) r.engine.state.story.world_flags.push('lantern-lit')
      }
      await r.engine.flush()
      if (!r.writer.status().warning) setCheckpoint({ ...pending })
    }
  }
  async function login() {
    const secret = password; setPassword('')
    await work(async () => {
      if (!navigator.onLine) throw new Error('online_setup_required')
      const result = await auth.signInWithPassword(email, secret)
      if (!result.ok) throw new Error('sign_in_failed')
      const key = await identityKey(result.session.userId)
      setId(key); setEmail('')
      if (await isInitialized(key)) await load(key, timezone)
      else setEntry('setup')
    })
  }
  async function setup() {
    const chosen = pin; setPin(''); setConfirmPin('')
    await work(async () => {
      if (!navigator.onLine) throw new Error('online_setup_required')
      new Intl.DateTimeFormat('en', { timeZone: timezone }).format()
      await initializeDevice(id, chosen)
      await load(id, timezone)
    })
  }
  function start(subject: Subject) { void work(async () => {
    if (runtime!.engine.dailyStatus().rest) return
    const result = await runtime!.engine.startOrResume(subject, { optional: true })
    if (result.kind === 'task') { setView('practice'); await advance(result.task.id) }
  }) }
  function submit(response: Response) { void work(async () => {
    if (!step || step.kind !== 'question') return
    const e = runtime!.engine
    if (step.awaiting === 'first') await e.answer(step.presentation.id, response)
    else if (step.awaiting === 'retry') await e.retry(step.presentation.id, response)
    else await e.correct(step.presentation.id, response)
    await advance(step.taskId)
  }) }
  function pause() { void work(async () => { if (step?.kind !== 'done' && step) await runtime!.engine.pause(step.taskId); setView('hub'); setStep(null); setCheckpoint(null) }) }
  function parent() { void work(async () => { if (view === 'practice' && step && step.kind !== 'done') await runtime!.engine.pause(step.taskId); setUnlocked(false); setCheckpoint(null); setView('parent') }) }
  function toggle() { void work(async () => { const next = zh ? 'en' : 'zh'; if (runtime) { runtime.engine.state.settings.ui_language = next; await runtime.engine.flush() }; setLanguage(next) }) }

  return <div className="app"><header className="header"><a className="brand" href="/" aria-label="Turtle Academy home"><img src="/turtle.svg" alt="" width="42" height="42" /><span>Turtle Academy</span></a><nav aria-label={tr('Main navigation', '主导航')}><button disabled={busy} onClick={toggle}>{zh ? 'English' : '中文'}</button>{entry === 'ready' && <button disabled={busy} onClick={parent}>{tr('Parent area', '家长区')}</button>}</nav></header><main>
    <div className="preview-banner">{tr('Development preview · synthetic content only · no subject is released', '开发预览 · 仅限模拟内容 · 所有科目均未发布')}</div>
    {error && <p role="alert" className="error">{error}</p>}
    {save?.warning && <div className="error" role="alert"><strong>{tr('Some changes are not saved.', '部分更改尚未保存。')}</strong> {tr('Reloading, closing or termination may lose these changes. You may continue with this warning; the app retries while open.', '刷新、关闭或系统终止应用可能丢失这些更改。可在警告下继续，应用会自动重试。')}<button disabled={busy} onClick={() => void work(async () => { await runtime!.writer.onForeground() })}>{tr('Retry local save', '重试本地保存')}</button></div>}
    {entry === 'loading' && <p role="status">{tr('Opening this device’s records…', '正在打开本设备记录…')}</p>}
    {entry === 'login' && <section className="entry-card"><p className="eyebrow">{tr('PARENT SETUP', '家长首次设置')}</p><h1>{tr('Your island adventure begins here.', '小岛上的冒险，从这里开始。')}</h1><p>{tr('First setup needs internet. Sign in with a pre-provisioned parent account, using synthetic data only.', '首次设置需联网。请用预先配置的家长账户登录，只使用模拟数据。')}</p>{!config && <p role="status">{tr('Sign-in is not configured. The developer must configure the synthetic test environment.', '尚未配置登录服务，请由开发者配置测试环境。')}</p>}<form onSubmit={(ev) => { ev.preventDefault(); void login() }}><label>{tr('Parent email', '家长邮箱')}<input type="email" autoComplete="username" value={email} onChange={(ev) => setEmail(ev.target.value)} required /></label><label>{tr('Password', '密码')}<input type="password" autoComplete="current-password" value={password} onChange={(ev) => setPassword(ev.target.value)} required /></label><button className="primary" disabled={busy || !online || !config}>{tr('Sign in', '登录')}</button></form></section>}
    {entry === 'setup' && <section className="entry-card"><h1>{tr('Set up this device', '设置本设备')}</h1><p>{tr('Choose a 4–6 digit PIN for routine local parent controls. It does not encrypt records or provide server authorization.', '设置 4–6 位 PIN，只用于本设备的日常家长控制。PIN 不加密记录，也不提供服务器授权。')}</p><form onSubmit={(ev) => { ev.preventDefault(); void setup() }}><label>{tr('Choose PIN', '设置 PIN')}<input type="password" inputMode="numeric" autoComplete="off" value={pin} maxLength={6} onChange={(ev) => setPin(ev.target.value)} required /></label><label>{tr('Confirm PIN', '再次输入 PIN')}<input type="password" inputMode="numeric" autoComplete="off" value={confirmPin} maxLength={6} onChange={(ev) => setConfirmPin(ev.target.value)} required /></label><label>{tr('Timezone', '时区')}<input value={timezone} onChange={(ev) => setTimezone(ev.target.value)} required /></label><button className="primary" disabled={busy || !online || !validPin(pin) || pin !== confirmPin}>{tr('Open the island', '打开小岛')}</button></form></section>}
    {runtime && entry === 'ready' && <>
      {view === 'hub' && <Hub engine={runtime.engine} language={language} busy={busy} start={start} />}
      {view === 'parent' && <Parent id={id} runtime={runtime} language={language} unlocked={unlocked} unlock={() => setUnlocked(true)} close={() => { setUnlocked(false); setView('hub'); setStep(null) }} work={work} busy={busy} freshAuth={() => createAuthClient(config, { storage: null, fetch: (input, init) => fetch(String(input).endsWith('/auth/v1/logout') ? `${input}?scope=local` : input, init) })} />}
      {view === 'practice' && step && !checkpoint && <Practice engine={runtime.engine} step={step} language={language} busy={busy} submit={submit} teaching={() => void work(async () => { await runtime.engine.completeTeaching(step.taskId); await advance(step.taskId) })} pause={pause} flag={() => void work(async () => { if (step.kind === 'question') { await runtime.engine.flag(step.presentation.id, 'question_unclear'); await advance(step.taskId) } })} />}
      {checkpoint && <section className="story-card" aria-label={tr('Story checkpoint', '故事片段')}><img src="/turtle.svg" alt="" /><p className="eyebrow">{tr('A MOMENT WITH MOSS', '小岛来信')} · {checkpoint.kind}</p><h1>{checkpoint.story_seq < stories.en.length ? tr('The little lantern', '小灯的故事') : tr('A visit from Moss', '小海龟来访')}</h1><p>{stories[language][checkpoint.story_seq] ?? tr('Moss rests beside the glowing lantern. There is always something small to notice here.', '小海龟坐在明亮的小灯旁，等你一起看看今天的小岛。')}</p><button disabled={busy} className="primary" onClick={() => void work(async () => { setCheckpoint(null); if (step && step.kind !== 'done') await runtime.engine.resume(step.taskId); if (step) await advance(step.taskId) })}>{tr('Continue', '继续')}</button></section>}
    </>}
    <footer><p>{online ? tr('Online', '在线') : tr('Offline', '离线')} · {shellReady ? tr('Ready for an offline adventure', '应用已缓存，可离线打开') : tr('Preparing the offline app…', '正在准备离线应用…')}</p><p>{tr('Records stay on this device. No cloud backup. Browser storage clearing or eviction can lose records.', '记录仅在本设备，没有云端备份。清除或回收浏览器存储可能丢失记录。')}</p>{needRefresh && <button disabled={busy || view !== 'hub' || !!save?.warning} onClick={() => void updateServiceWorker(true)}>{tr('Update app when ready', '更新应用')}</button>}</footer>
  </main></div>
}
