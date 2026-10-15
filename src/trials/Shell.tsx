import type { ReactNode } from 'react'

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="t-app">
      <header className="t-header">
        <a href="#/" className="t-brand">Trials</a>
        <span className="t-tag">Not the learner app</span>
      </header>
      <main>{children}</main>
    </div>
  )
}
