import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

/**
 * Layout global de la aplicación (ver AGENTS.md → Layout).
 * Las páginas nunca duplican sidebar ni topbar.
 */
export function Shell() {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <div className="flex min-h-dvh bg-slate-100">
      <Sidebar abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onAbrirMenu={() => setMenuAbierto(true)} />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
