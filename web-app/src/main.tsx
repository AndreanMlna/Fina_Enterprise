import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// SRE Defense: Tangani perubahan hash aset saat deployment baru berlangsung di Vercel/CDN
window.addEventListener('vite:preloadError', (event) => {
  console.warn('[FINA SRE] Vite chunk preload desynchronization detected. Refreshing for latest deployment...', event)
  const lastReload = sessionStorage.getItem('fina_last_preload_reload')
  const now = Date.now()
  if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
    sessionStorage.setItem('fina_last_preload_reload', now.toString())
    window.location.reload()
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
