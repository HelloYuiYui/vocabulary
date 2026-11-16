import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { languageAt } from './routing/languageAt.ts'
import './styles/index.css'

// Each language has its own colours, picked by the page's lang attribute.
// Setting it before the first render avoids a flash of the French palette.
document.documentElement.lang = languageAt(location.hash)?.code ?? 'en'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
