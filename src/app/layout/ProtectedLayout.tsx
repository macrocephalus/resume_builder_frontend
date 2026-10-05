import { Outlet } from 'react-router'
import { TopBar } from '@/app/layout/TopBar'

/** The frame of every signed-in screen; its route loader has already checked the session. */
export function ProtectedLayout() {
  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-page px-4 py-6 lg:px-6">
        <Outlet />
      </main>
    </>
  )
}
