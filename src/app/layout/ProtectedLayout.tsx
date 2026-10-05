import { Outlet } from 'react-router'
import { TopBar } from '@/app/layout/TopBar'

export function ProtectedLayout() {
  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-page px-4 py-6">
        <Outlet />
      </main>
    </>
  )
}
