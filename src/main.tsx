import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import { App } from '@/app/App'
import { createAppRouter } from '@/app/router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App router={createAppRouter()} />
  </StrictMode>,
)
