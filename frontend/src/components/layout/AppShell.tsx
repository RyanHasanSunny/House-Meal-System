import { CalendarCheck2, LayoutDashboard, LogOut, ReceiptText, ScrollText, ShoppingBasket, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { useAuth } from '../../providers/AuthProvider'
import type { Role } from '../../types'

const navigation = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'member'] as Role[] },
  { to: '/meals', label: 'My Meals', icon: CalendarCheck2, roles: ['super_admin', 'admin', 'member'] as Role[] },
  { to: '/finance-summary', label: 'Summary', icon: ReceiptText, roles: ['super_admin', 'admin'] as Role[] },
  { to: '/groceries', label: 'Groceries', icon: ShoppingBasket, roles: ['super_admin', 'admin'] as Role[] },
  { to: '/users', label: 'Members', icon: Users, roles: ['super_admin', 'admin'] as Role[] },
  { to: '/meal-plans', label: 'Meal Plans', icon: ScrollText, roles: ['super_admin', 'admin'] as Role[] },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()

  if (!user) {
    return null
  }

  const items = navigation.filter((item) => item.roles.includes(user.role))

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="panel subtle-grid hidden w-[280px] shrink-0 flex-col justify-between p-6 lg:flex">
          <div>
            <div className="rounded-[26px] bg-ink-950 p-5 text-white shadow-[0_18px_40px_-24px_rgba(21,21,22,0.8)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-300">Bachelor House</p>
              <h2 className="mt-3 text-2xl font-bold text-white">House Meal System</h2>
              <p className="mt-3 text-sm leading-6 text-stone-300">
                Track meals, manage groceries, and keep the house operation clean month after month.
              </p>
            </div>

            <nav className="mt-6 space-y-2">
              {items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      isActive ? 'bg-brand-700 text-white' : 'text-stone-700 hover:bg-brand-50'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="rounded-[24px] border border-brand-100 bg-white/70 p-4">
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
        </aside>

        <div className="flex min-w-0 flex-1 flex-col pb-24 lg:pb-0">
          <header className="panel mb-6 flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Operational Dashboard</p>
              <h1 className="mt-1 text-2xl font-bold text-ink-950 sm:text-3xl">House Meal System</h1>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <Badge variant="accent">{user.role_label}</Badge>
              <Button variant="ghost" onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </div>

      <nav className="panel fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-2xl items-center justify-around px-2 py-2 lg:hidden">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex min-w-0 flex-col items-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-semibold transition ${
                isActive ? 'bg-brand-700 text-white' : 'text-stone-500'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
