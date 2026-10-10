import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { openGuestStorage, observeCheckpoint, saveSampleAnswer, type GuestCheckpoint, type SampleAnswer } from './storage'

const answers: { value: SampleAnswer; icon: string; label: string }[] = [
  { value: 'turtle', icon: '🐢', label: 'A turtle' },
  { value: 'stone', icon: '🪨', label: 'A stone' },
  { value: 'chair', icon: '🪑', label: 'A chair' },
]

export function App() {
  const [checkpoint, setCheckpoint] = useState<GuestCheckpoint | null>(null)
  const [storageError, setStorageError] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [exploring, setExploring] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const [shellReady, setShellReady] = useState(false)
  const [workerError, setWorkerError] = useState(false)
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: () => setWorkerError(true),
    onRegisteredSW: (_url, registration) => { if (registration?.active) setShellReady(true) },
  })

  useEffect(() => {
    if ('serviceWorker' in navigator) void navigator.serviceWorker.ready.then(() => setShellReady(true))
    let cancelled = false
    let unsubscribe = () => {}
    void openGuestStorage().then(() => {
      if (cancelled) return
      const subscription = observeCheckpoint().subscribe({
        next: (value) => { setCheckpoint(value); setStorageError(false) },
        error: () => setStorageError(true),
      })
      unsubscribe = () => subscription.unsubscribe()
    }).catch(() => { if (!cancelled) setStorageError(true) })
    const connected = () => setOnline(navigator.onLine)
    window.addEventListener('online', connected)
    window.addEventListener('offline', connected)
    return () => {
      cancelled = true
      unsubscribe()
      window.removeEventListener('online', connected)
      window.removeEventListener('offline', connected)
    }
  }, [])

  async function answer(value: SampleAnswer) {
    if (saving || !checkpoint || storageError) return
    setSaving(true); setSaveError(false)
    try { await saveSampleAnswer(value) }
    catch { setSaveError(true) }
    finally { setSaving(false) }
  }

  const lastAnswer = checkpoint?.lastAnswer
  return (
    <div className="app">
      <header className="header">
        <a href="/" className="brand" aria-label="Turtle Academy home">
          <img src="/turtle.svg" alt="" width="44" height="44" />
          <span>Turtle Academy</span>
        </a>
        <span className="guest">Guest adventure</span>
      </header>
      <main>
        <section className="welcome" aria-labelledby="welcome-title">
          <div>
            <p className="eyebrow">A WORLD OF LITTLE DISCOVERIES</p>
            <h1 id="welcome-title">Let curiosity<br />lead the way.</h1>
            <p className="intro">Look closely. Ask a question. Discover something new.</p>
          </div>
          <div className="welcome-art" aria-hidden="true">
            <span className="spark spark-one">✦</span>
            <img src="/turtle.svg" alt="" />
            <span className="spark spark-two">✧</span>
          </div>
        </section>

        <section className="worlds" aria-label="Learning worlds">
          <article className="world science">
            <span className="world-icon" aria-hidden="true">🌿</span>
            <p className="eyebrow">SCIENCE WORLD</p>
            <h2>The Discovery Trail</h2>
            <p>A small first adventure in living things.</p>
            <button className="primary" onClick={() => setExploring(true)}>Explore Science <span aria-hidden="true">→</span></button>
          </article>
          <article className="world chinese">
            <span className="world-icon character" aria-hidden="true">字</span>
            <p className="eyebrow">CHINESE WORLD</p>
            <h2>The Character Garden</h2>
            <p>A place for words, writing and careful practice.</p>
            <span className="coming">Adventures coming later</span>
          </article>
        </section>

        {exploring && (
          <section className="question" aria-labelledby="question-title">
            <p className="eyebrow">FIRST DISCOVERY · LIVING THINGS</p>
            <h2 id="question-title">Which one is living?</h2>
            <p>Think about what it needs and how it changes as it grows.</p>
            <div className="answers">
              {answers.map((item) => (
                <button key={item.value} disabled={saving || !checkpoint || storageError}
                  onClick={() => void answer(item.value)} aria-label={item.label}>
                  <span aria-hidden="true">{item.icon}</span>{item.label}
                </button>
              ))}
            </div>
            <div className="feedback" aria-live="polite" role="status">
              {saving ? 'Saving your discovery…' : saveError
                ? 'Your answer could not be saved. Please try again.'
                : lastAnswer === 'turtle'
                  ? 'Yes! A turtle is living. It needs food, water and air, and it grows.'
                  : lastAnswer
                    ? 'Look again: a stone and a chair do not grow or need food, water and air. Try the turtle.'
                    : 'Take your time. There is no timer.'}
            </div>
          </section>
        )}

        <aside className="travel-note" aria-label="Adventure availability">
          <span aria-hidden="true">✦</span>
          <div>
            <strong>{workerError ? 'Offline download is unavailable'
              : (offlineReady || shellReady) ? 'Ready for an offline adventure'
                : 'Preparing your offline adventure'}</strong>
            <p>{workerError ? 'You can continue online. Try reopening when your connection is available.'
              : (offlineReady || shellReady) ? 'This first discovery can travel with you, even without internet.'
                : 'Keep this page open online while the first discovery downloads.'}</p>
          </div>
          <span className="connection">{online ? 'Online' : 'Offline'}</span>
        </aside>

        {needRefresh && (
          <div className="update-note" role="status">
            <span>A new adventure update is ready.</span>
            <button disabled={saving || storageError || saveError}
              onClick={() => void updateServiceWorker(true)}>Update when ready</button>
          </div>
        )}
        <footer className="footer">
          <p>This early preview includes one Science discovery. More adventures are still being prepared.</p>
          <p role={storageError || saveError ? 'alert' : undefined}>
            {storageError ? 'This browser could not open your saved progress. Try again in a browser that allows local storage.'
              : saveError ? 'Your latest answer has not been saved.'
                : checkpoint ? 'Saved on this device · ' + checkpoint.attempts + ' discovery attempts'
                  : 'Opening your saved progress…'}
          </p>
          <p>Guest progress stays on this device and can be lost if browser data is cleared.</p>
        </footer>
      </main>
    </div>
  )
}
