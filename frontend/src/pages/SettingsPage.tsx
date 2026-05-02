import { LogOut, Settings2, ShoppingBasket, ScrollText, Users } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { cn } from '../lib/cn'
import { useAuth } from '../providers/AuthProvider'
import { GroceriesPage } from './GroceriesPage'
import { MealPlansPage } from './MealPlansPage'
import { MembersPage } from './MembersPage'

const tabs = [
  { key: 'groceries', label: 'Groceries', icon: ShoppingBasket },
  { key: 'meal-plans', label: 'Meal Plans', icon: ScrollText },
  { key: 'members', label: 'Members', icon: Users },
] as const

type SettingsTab = (typeof tabs)[number]['key']

function isSettingsTab(value: string | null): value is SettingsTab {
  return tabs.some((tab) => tab.key === value)
}

export function SettingsPage() {
  const { logout } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTab = useMemo<SettingsTab>(() => {
    const tab = searchParams.get('tab')

    return isSettingsTab(tab) ? tab : 'groceries'
  }, [searchParams])

  function handleTabChange(tab: SettingsTab) {
    setSearchParams({ tab })
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-brand-100 p-3 text-brand-700">
            <Settings2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="section-title">Settings</h1>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3 overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={cn(
                'inline-flex shrink-0 items-center justify-center rounded-2xl transition',
                activeTab === key
                  ? 'gap-2 bg-brand-700 px-4 py-3 text-sm font-semibold text-white'
                  : 'h-12 w-12 border border-stone-200 bg-white text-stone-700 hover:border-brand-300 hover:bg-brand-50'
              )}
              onClick={() => handleTabChange(key)}
              type="button"
              aria-label={label}
              title={label}
            >
              <Icon className="h-4 w-4" />
              {activeTab === key ? <span>{label}</span> : null}
            </button>
          ))}
        </div>
      </Card>

      {activeTab === 'groceries' ? <GroceriesPage /> : null}
      {activeTab === 'meal-plans' ? <MealPlansPage /> : null}
      {activeTab === 'members' ? <MembersPage /> : null}

      <Card className="lg:hidden">
        <Button className="w-full" variant="ghost" onClick={() => void logout()}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </Card>
    </div>
  )
}
