import { Settings2, ShoppingBasket, ScrollText, UserRound, Users } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { cn } from '../lib/cn'
import { useAuth } from '../providers/AuthProvider'
import { AccountSettingsPage } from './AccountSettingsPage'
import { GroceriesPage } from './GroceriesPage'
import { MealPlansPage } from './MealPlansPage'
import { MembersPage } from './MembersPage'

const adminTabs = [
  { key: 'groceries', label: 'Groceries', icon: ShoppingBasket },
  { key: 'meal-plans', label: 'Meal Plans', icon: ScrollText },
  { key: 'members', label: 'Members', icon: Users },
] as const

const accountTab = { key: 'account', label: 'Account', icon: UserRound } as const

type SettingsTab = 'account' | (typeof adminTabs)[number]['key']

function isSettingsTab(value: string | null, tabs: ReadonlyArray<{ key: SettingsTab }>): value is SettingsTab {
  return tabs.some((tab) => tab.key === value)
}

export function SettingsPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabs = useMemo(
    () => [accountTab, ...(user?.role === 'member' ? [] : adminTabs)],
    [user?.role],
  )

  const activeTab = useMemo<SettingsTab>(() => {
    const tab = searchParams.get('tab')

    return isSettingsTab(tab, tabs) ? tab : 'account'
  }, [searchParams, tabs])

  function handleTabChange(tab: SettingsTab) {
    setSearchParams({ tab })
  }

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-brand-100 p-3 text-brand-700">
            <Settings2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="section-title">Settings</h1>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={cn(
                'inline-flex shrink-0 items-center justify-center rounded-md transition',
                activeTab === key
                  ? 'gap-2 bg-brand-700 px-3 py-2.5 text-sm font-semibold text-white'
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

      {activeTab === 'account' ? <AccountSettingsPage /> : null}
      {activeTab === 'groceries' ? <GroceriesPage /> : null}
      {activeTab === 'meal-plans' ? <MealPlansPage /> : null}
      {activeTab === 'members' ? <MembersPage /> : null}
    </div>
  )
}
