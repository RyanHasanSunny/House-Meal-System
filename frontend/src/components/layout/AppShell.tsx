import { CalendarCheck2, LayoutDashboard, LogOut, ReceiptText, Settings2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { useAuth } from '../../providers/AuthProvider'
import type { Role } from '../../types'

const navigation = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'member'] as Role[] },
  { to: '/meals', label: 'My Meals', icon: CalendarCheck2, roles: ['super_admin', 'admin', 'member'] as Role[] },
  { to: '/finance-summary', label: 'Summary', icon: ReceiptText, roles: ['super_admin', 'admin', 'member'] as Role[] },
  { to: '/settings', label: 'Settings', icon: Settings2, roles: ['super_admin', 'admin', 'member'] as Role[] },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()

  if (!user) {
    return null
  }

  const items = navigation.filter((item) => item.roles.includes(user.role))

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-2.5 px-2.5 py-2.5 sm:px-4 lg:px-5">
        <aside className="panel subtle-grid hidden w-[252px] shrink-0 flex-col p-3.5 lg:flex">
          <div>
            <div className="rounded-md bg-ink-950 p-3.5 text-white shadow-[0_18px_40px_-24px_rgba(21,21,22,0.8)]">
              <h2 className="text-2xl font-bold text-white">GAABAI KHAI</h2>
            </div>

            <nav className="mt-4 space-y-2">
              {items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                      isActive ? 'bg-brand-700 text-white' : 'text-stone-700 hover:bg-brand-50'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-4 rounded-md border border-brand-100 bg-white/70 p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink-950">{user.name}</p>
                  <p className="text-sm text-stone-500">@{user.username}</p>
                </div>
                <Badge variant="brand">{user.role_label}</Badge>
              </div>
              <Button className="mt-4 w-full" variant="ghost" onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col pb-24 lg:pb-0">
          <header className="mb-3 flex items-center justify-between gap-3 rounded-md border border-white/10 bg-ink-950 p-3.5 text-white shadow-[0_18px_40px_-24px_rgba(21,21,22,0.8)] lg:hidden">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.24em] text-white/65">GAABAI KHAI</p>
              <p className="truncate text-sm text-white/80">@{user.username}</p>
            </div>
            <Button
              className="shrink-0 border-white/10 bg-white text-ink-950 hover:border-white/20 hover:bg-brand-50"
              variant="ghost"
              onClick={() => void logout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="px-2 pt-5 text-center text-xs leading-6 text-stone-500 sm:px-4">
            <p>Developed by Ryan Hasan Sunny</p>
            <p>Inspired by Hasib Talukdar, MD Fahad Hossain, Jisan Hawladar</p>
          </footer>
        </div>
      </div>

      <nav className="panel fixed bottom-3 left-3 right-3 z-50 mx-auto max-w-2xl px-1.5 py-1.5 lg:hidden">
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex min-w-0 flex-col items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[9px] font-semibold leading-[1.05] text-center transition ${
                  isActive ? 'bg-brand-700 text-white' : 'text-stone-500 hover:bg-brand-50'
                }`
              }
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="max-w-full whitespace-normal">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
