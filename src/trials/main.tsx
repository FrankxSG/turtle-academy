import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TrialsApp } from './TrialsApp'
import './trials.css'

// Trials entry. No service worker, storage, auth or product imports.
createRoot(document.getElementById('root')!).render(<StrictMode><TrialsApp /></StrictMode>)
