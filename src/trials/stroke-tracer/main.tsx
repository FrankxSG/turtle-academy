import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TrialPage } from './TrialPage'
import '../../styles.css'

createRoot(document.getElementById('root')!).render(<StrictMode><TrialPage /></StrictMode>)
