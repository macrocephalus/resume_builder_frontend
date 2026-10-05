import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import { App } from '@/app/App'
import { createApp } from '@/app/createApp'

// A build-time constant: the plain dev server and the production build never load the mocks.
if (import.meta.env.MODE === 'mock') {
  const { startMockWorker } = await import('@/mocks/browser')
  await startMockWorker()
}

const { queryClient, router } = createApp()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App queryClient={queryClient} router={router} />
  </StrictMode>,
)
