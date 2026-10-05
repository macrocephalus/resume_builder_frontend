import { Outlet } from 'react-router'
import { Backdrop } from '@/app/layout/Backdrop'

export function RootLayout() {
  return (
    <>
      <Backdrop />
      <Outlet />
    </>
  )
}
