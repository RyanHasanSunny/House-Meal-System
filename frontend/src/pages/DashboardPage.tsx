import { Activity, CalendarClock, ShoppingCart, Users2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, getApiErrorMessage } from '../api/client'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { MetricCard } from '../components/ui/MetricCard'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Spinner } from '../components/ui/Spinner'
import { formatCurrency, formatDate, formatShortDate } from '../lib/format'
import { useAuth } from '../providers/AuthProvider'
import type { AdminDashboardData, MemberDashboardData } from '../types'

export function DashboardPage() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState<AdminDashboardData | MemberDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await api.get<{ data: AdminDashboardData | MemberDashboardData }>('/dashboard')
        setDashboard(response.data.data)
      } catch (loadError) {
        setError(getApiErrorMessage(loadError))
      } finally {
        setIsLoading(false)
      }
    }

    void loadDashboard()
  }, [])

  if (isLoading) {
    return (
      <div className="panel flex min-h-[360px] items-center justify-center">
        <Spinner label="Loading dashboard..." />
      </div>
    )
  }

  if (error || !dashboard || !user) {
    return (
      <EmptyState
        icon={Activity}
        title="Dashboard unavailable"
        copy={error || 'The dashboard data could not be loaded right now.'}
      />
    )
  }

  if (user.role === 'member') {
    const memberDashboard = dashboard as MemberDashboardData

    return (
      <div className="space-y-6">
        <SectionHeading title="Your Meal Overview" />

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <MetricCard icon={CalendarClock} label="Lunch Taken" value={memberDashboard.summary.taken_lunches} />
          <MetricCard icon={CalendarClock} label="Dinner Taken" tone="accent" value={memberDashboard.summary.taken_dinners} />
          <MetricCard icon={Activity} label="Lunch Skipped" tone="neutral" value={memberDashboard.summary.skipped_lunches} />
          <MetricCard icon={Activity} label="Upcoming Skips" tone="accent" value={memberDashboard.summary.upcoming_skips} />
        </div>

        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Current Plan</p>
              <h2 className="mt-2 text-2xl font-bold">
                {memberDashboard.active_plan ? memberDashboard.active_plan.name : 'No active plan'}
              </h2>
              {memberDashboard.active_plan ? (
                <p className="mt-2 text-sm text-stone-600">
                  {formatDate(memberDashboard.active_plan.start_date)} to {formatDate(memberDashboard.active_plan.end_date)}
                </p>
              ) : null}
            </div>
            {memberDashboard.active_plan ? <Badge variant="brand">{memberDashboard.active_plan.type}</Badge> : null}
          </div>
        </Card>

        <Card>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Upcoming Days</h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {memberDashboard.upcoming.map((status) => (
              <div key={status.id} className="rounded-[22px] border border-brand-100 bg-brand-50/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-500">{formatDate(status.meal_date)}</p>
                    <p className="mt-1 text-lg font-bold text-ink-950">{formatShortDate(status.meal_date)}</p>
                  </div>
                  <Badge variant={status.skip_lunch || status.skip_dinner ? 'accent' : 'brand'}>
                    {status.skip_lunch || status.skip_dinner ? 'Skip set' : 'All meals taken'}
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-stone-500">Lunch</p>
                    <p className="mt-1 font-semibold">{status.skip_lunch ? 'Will skip' : 'Will take'}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-stone-500">Dinner</p>
                    <p className="mt-1 font-semibold">{status.skip_dinner ? 'Will skip' : 'Will take'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  const adminDashboard = dashboard as AdminDashboardData

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard icon={Users2} label="Members" value={adminDashboard.counts.members} />
        <MetricCard icon={Users2} label="Admins" tone="neutral" value={adminDashboard.counts.admins} />
        <MetricCard icon={CalendarClock} label="Today's Meals" tone="accent" value={adminDashboard.today.total_meals} />
        <MetricCard icon={ShoppingCart} label="Monthly Grocery" value={formatCurrency(adminDashboard.groceries.monthly_spend)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Active Plan</p>
              <h2 className="mt-2 text-xl font-bold sm:text-2xl">
                {adminDashboard.active_plan ? adminDashboard.active_plan.name : 'No active meal plan'}
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                {adminDashboard.active_plan
                  ? `${formatDate(adminDashboard.active_plan.start_date)} to ${formatDate(adminDashboard.active_plan.end_date)}`
                  : ''}
              </p>
              {adminDashboard.current_admin ? (
                <p className="mt-1 text-sm text-stone-500">
                  Current admin: {adminDashboard.current_admin.name} (@{adminDashboard.current_admin.username})
                </p>
              ) : null}
            </div>
            {adminDashboard.active_plan ? <Badge variant="brand">{adminDashboard.active_plan.type}</Badge> : null}
          </div>

          {adminDashboard.active_plan ? (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
              <div className="panel-soft p-4">
                <p className="text-sm text-stone-500">Tracked Members</p>
                <p className="mt-1 text-xl font-bold sm:text-2xl">{adminDashboard.active_plan.summary.member_count}</p>
              </div>
              <div className="panel-soft p-4">
                <p className="text-sm text-stone-500">Lunch Count</p>
                <p className="mt-1 text-xl font-bold sm:text-2xl">{adminDashboard.active_plan.summary.totals.taken_lunches}</p>
              </div>
              <div className="panel-soft p-4">
                <p className="text-sm text-stone-500">Dinner Count</p>
                <p className="mt-1 text-xl font-bold sm:text-2xl">{adminDashboard.active_plan.summary.totals.taken_dinners}</p>
              </div>
              <div className="panel-soft p-4">
                <p className="text-sm text-stone-500">Plan Grocery Spend</p>
                <p className="mt-1 text-xl font-bold sm:text-2xl">{formatCurrency(adminDashboard.active_plan.grocery_total_spend)}</p>
              </div>
              <div className="panel-soft p-4">
                <p className="text-sm text-stone-500">Plan Grocery Items</p>
                <p className="mt-1 text-xl font-bold sm:text-2xl">{adminDashboard.active_plan.grocery_items_count}</p>
              </div>
            </div>
          ) : null}
        </Card>

        <Card>
          <h2 className="text-2xl font-bold">Recent Grocery Items</h2>
          <div className="mt-5 space-y-3">
            {adminDashboard.groceries.recent.map((item) => (
              <div key={item.id} className="rounded-[22px] border border-stone-200 bg-stone-50 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink-950">{item.title}</p>
                    <p className="mt-1 text-sm text-stone-500">
                      {formatDate(item.purchased_on)}{item.added_by ? ` by ${item.added_by}` : ''}
                    </p>
                  </div>
                  <Badge variant="accent">{formatCurrency(item.price)}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {adminDashboard.active_plan ? (
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Member Breakdown</h2>
            </div>
            <Badge variant="brand">{adminDashboard.active_plan.summary.tracked_days} tracked days</Badge>
          </div>

          <div className="mt-5 overflow-hidden rounded-[24px] border border-stone-200">
            <div className="hidden grid-cols-[1.6fr_repeat(5,0.8fr)] gap-2 bg-stone-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 md:grid">
              <span>Member</span>
              <span>Lunch</span>
              <span>Lunch Skip</span>
              <span>Dinner</span>
              <span>Dinner Skip</span>
              <span>Total</span>
            </div>

            <div className="divide-y divide-stone-200 bg-white">
              {adminDashboard.active_plan.summary.members.map((member) => (
                <div key={member.user.id} className="px-4 py-4">
                  <div className="md:hidden">
                    <div>
                      <p className="font-semibold text-ink-950">{member.user.name}</p>
                      <p className="text-sm text-stone-500">@{member.user.username}</p>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-stone-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Lunch</p>
                        <p className="mt-1 text-lg font-bold text-ink-950">{member.taken_lunches}</p>
                      </div>
                      <div className="rounded-2xl bg-stone-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Lunch Skip</p>
                        <p className="mt-1 text-lg font-bold text-ink-950">{member.skipped_lunches}</p>
                      </div>
                      <div className="rounded-2xl bg-stone-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Dinner</p>
                        <p className="mt-1 text-lg font-bold text-ink-950">{member.taken_dinners}</p>
                      </div>
                      <div className="rounded-2xl bg-stone-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Dinner Skip</p>
                        <p className="mt-1 text-lg font-bold text-ink-950">{member.skipped_dinners}</p>
                      </div>
                    </div>
                    <div className="mt-3 rounded-2xl bg-brand-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Total</p>
                      <p className="mt-1 text-xl font-bold text-ink-950">{member.taken_meals}</p>
                    </div>
                  </div>

                  <div className="hidden gap-3 md:grid md:grid-cols-[1.6fr_repeat(5,0.8fr)] md:items-center">
                    <div>
                      <p className="font-semibold text-ink-950">{member.user.name}</p>
                      <p className="text-sm text-stone-500">@{member.user.username}</p>
                    </div>
                    <p className="text-sm font-medium text-stone-700 md:text-base">{member.taken_lunches}</p>
                    <p className="text-sm font-medium text-stone-700 md:text-base">{member.skipped_lunches}</p>
                    <p className="text-sm font-medium text-stone-700 md:text-base">{member.taken_dinners}</p>
                    <p className="text-sm font-medium text-stone-700 md:text-base">{member.skipped_dinners}</p>
                    <p className="text-sm font-bold text-ink-950 md:text-base">{member.taken_meals}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
