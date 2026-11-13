import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { languageFor } from './data/language.ts'
import { loadLanguageCode } from './storage/storage.ts'
import './styles/index.css'

// Each language has its own colours, picked by the page's lang attribute.
// Setting it before the first render avoids a flash of the French palette.
document.documentElement.lang = languageFor(loadLanguageCode()).code

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
