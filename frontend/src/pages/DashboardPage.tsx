import { Activity, Calculator, CalendarClock, ReceiptText, ShoppingCart, Users2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, getApiErrorMessage } from '../api/client'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { MemberMealDetailsModal } from '../components/ui/MemberMealDetailsModal'
import { MetricCard } from '../components/ui/MetricCard'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Spinner } from '../components/ui/Spinner'
import { TodayMealMembersModal } from '../components/ui/TodayMealMembersModal'
import { formatCurrency, formatDate, formatShortDate } from '../lib/format'
import { useAuth } from '../providers/AuthProvider'
import type { AdminDashboardData, MealPlanSummaryMember, MemberDashboardData } from '../types'

type TodayMealModalState =
  | { type: 'lunch'; title: string }
  | { type: 'dinner'; title: string }
  | null

export function DashboardPage() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState<AdminDashboardData | MemberDashboardData | null>(null)
  const [selectedAdminMember, setSelectedAdminMember] = useState<MealPlanSummaryMember | null>(null)
  const [selectedTodayMeal, setSelectedTodayMeal] = useState<TodayMealModalState>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await api.get<{ data: AdminDashboardData | MemberDashboardData }>('/dashboard')
        setSelectedAdminMember(null)
        setSelectedTodayMeal(null)
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
    const counting = memberDashboard.summary.counting
    const countedThroughLabel = counting?.counted_through ? formatDate(counting.counted_through) : 'Not started yet'

    return (
      <div className="space-y-3">
        <SectionHeading title="Your Meal Overview" />

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 2xl:grid-cols-7">
          <MetricCard icon={CalendarClock} label="Lunch Counted" value={memberDashboard.summary.taken_lunches} />
          <MetricCard icon={CalendarClock} label="Dinner Counted" tone="accent" value={memberDashboard.summary.taken_dinners} />
          <MetricCard icon={Activity} label="Meals Counted" tone="neutral" value={memberDashboard.summary.taken_meals} />
          <MetricCard icon={Activity} label="Guest Meals" tone="accent" value={memberDashboard.summary.guest_meals} />
          <MetricCard icon={Activity} label="Future Skips" tone="accent" value={memberDashboard.summary.upcoming_skips} />
          <MetricCard icon={Calculator} label="Meal Rate" tone="neutral" value={formatCurrency(memberDashboard.summary.meal_rate)} />
          <MetricCard icon={ReceiptText} label="Meal Cost" value={formatCurrency(memberDashboard.summary.meal_cost)} />
        </div>

        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              {memberDashboard.active_plan ? (
                <p className="mt-2 text-sm text-stone-500">
                  {formatCurrency(memberDashboard.summary.meal_rate)} x {memberDashboard.summary.taken_meals} counted meals, including{' '}
                  {memberDashboard.summary.guest_meals} guest meals ={' '}
                  {formatCurrency(memberDashboard.summary.meal_cost)}
                </p>
              ) : null}
            </div>
            {memberDashboard.active_plan ? <Badge variant="brand">{memberDashboard.active_plan.type}</Badge> : null}
          </div>

          {memberDashboard.active_plan && counting ? (
            <div className="mt-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-md border border-brand-100 bg-brand-50 px-3 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Counted Through</p>
                  <p className="mt-2 text-lg font-bold text-ink-950">{countedThroughLabel}</p>
                </div>
                <div className="rounded-md border border-stone-200 bg-white px-3 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Days Counted</p>
                  <p className="mt-2 text-lg font-bold text-ink-950">
                    {counting.counted_days} / {counting.total_days}
                  </p>
                </div>
                <div className="rounded-md border border-stone-200 bg-white px-3 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Plan Meals So Far</p>
                  <p className="mt-2 text-lg font-bold text-ink-950">{memberDashboard.summary.plan_counted_meals}</p>
                </div>
              </div>
              <p className="text-sm text-stone-500">
                {counting.status === 'not_started'
                  ? 'This plan has not started yet, so no meals are counted.'
                  : counting.status === 'completed'
                    ? `All plan days are counted through ${countedThroughLabel}.`
                    : `Meals are counted through ${countedThroughLabel}. Future plan days will be added automatically when their date starts.`}
              </p>
            </div>
          ) : null}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Today & Upcoming Days</h2>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {memberDashboard.upcoming.map((status) => (
              <div key={status.id} className="rounded-md border border-brand-100 bg-brand-50/70 p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-500">{formatDate(status.meal_date)}</p>
                    <p className="mt-1 text-lg font-bold text-ink-950">{formatShortDate(status.meal_date)}</p>
                  </div>
                  <Badge variant={status.skip_lunch || status.skip_dinner || status.guest_meals ? 'accent' : 'brand'}>
                    {status.skip_lunch || status.skip_dinner || status.guest_meals ? 'Custom set' : 'All meals taken'}
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md bg-white px-3 py-2.5">
                    <p className="text-stone-500">Lunch</p>
                    <p className="mt-1 font-semibold">{status.skip_lunch ? 'Will skip' : 'Will take'}</p>
                    {status.guest_lunches ? (
                      <p className="mt-1 text-xs text-stone-500">
                        +{status.guest_lunches} guest meal{status.guest_lunches === 1 ? '' : 's'}
                      </p>
                    ) : null}
                  </div>
                  <div className="rounded-md bg-white px-3 py-2.5">
                    <p className="text-stone-500">Dinner</p>
                    <p className="mt-1 font-semibold">{status.skip_dinner ? 'Will skip' : 'Will take'}</p>
                    {status.guest_dinners ? (
                      <p className="mt-1 text-xs text-stone-500">
                        +{status.guest_dinners} guest meal{status.guest_dinners === 1 ? '' : 's'}
                      </p>
                    ) : null}
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
  const todayMealMembers = selectedTodayMeal
    ? selectedTodayMeal.type === 'lunch'
      ? adminDashboard.today.lunch_members
      : adminDashboard.today.dinner_members
    : []

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        <MetricCard icon={Users2} label="Members" value={adminDashboard.counts.members} />
        <MetricCard icon={Users2} label="Admins" tone="neutral" value={adminDashboard.counts.admins} />
        <button className="text-left" type="button" onClick={() => setSelectedTodayMeal({ type: 'lunch', title: "Today's Lunch Members" })}>
          <MetricCard icon={CalendarClock} label="Today's Lunch" tone="accent" value={adminDashboard.today.lunches} />
        </button>
        <button className="text-left" type="button" onClick={() => setSelectedTodayMeal({ type: 'dinner', title: "Today's Dinner Members" })}>
          <MetricCard icon={CalendarClock} label="Today's Dinner" tone="neutral" value={adminDashboard.today.dinners} />
        </button>
        <MetricCard icon={Activity} label="Guest Meals" tone="accent" value={adminDashboard.today.guest_meals} />
        <MetricCard icon={ShoppingCart} label="Monthly Grocery" value={formatCurrency(adminDashboard.groceries.monthly_spend)} />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
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
              <div className="panel-soft p-3.5">
                <p className="text-sm text-stone-500">Tracked Members</p>
                <p className="mt-1 text-xl font-bold sm:text-2xl">{adminDashboard.active_plan.summary.member_count}</p>
              </div>
              <div className="panel-soft p-3.5">
                <p className="text-sm text-stone-500">Days Counted</p>
                <p className="mt-1 text-xl font-bold sm:text-2xl">
                  {adminDashboard.active_plan.summary.counting.counted_days} / {adminDashboard.active_plan.summary.counting.total_days}
                </p>
              </div>
              <div className="panel-soft p-3.5">
                <p className="text-sm text-stone-500">Meals Counted So Far</p>
                <p className="mt-1 text-xl font-bold sm:text-2xl">{adminDashboard.active_plan.summary.totals.taken_meals}</p>
              </div>
              <div className="panel-soft p-3.5">
                <p className="text-sm text-stone-500">Lunch Counted</p>
                <p className="mt-1 text-xl font-bold sm:text-2xl">{adminDashboard.active_plan.summary.totals.taken_lunches}</p>
              </div>
              <div className="panel-soft p-3.5">
                <p className="text-sm text-stone-500">Dinner Counted</p>
                <p className="mt-1 text-xl font-bold sm:text-2xl">{adminDashboard.active_plan.summary.totals.taken_dinners}</p>
              </div>
              <div className="panel-soft p-3.5">
                <p className="text-sm text-stone-500">Guest Meals</p>
                <p className="mt-1 text-xl font-bold sm:text-2xl">{adminDashboard.active_plan.summary.totals.guest_meals}</p>
              </div>
              <div className="panel-soft p-3.5">
                <p className="text-sm text-stone-500">Plan Grocery Spend</p>
                <p className="mt-1 text-xl font-bold sm:text-2xl">{formatCurrency(adminDashboard.active_plan.grocery_total_spend)}</p>
                <p className="mt-1 text-xs text-stone-500">{adminDashboard.active_plan.grocery_items_count} items recorded</p>
              </div>
            </div>
          ) : null}

          {adminDashboard.active_plan ? (
            <p className="mt-4 text-sm text-stone-500">
              {adminDashboard.active_plan.summary.counting.status === 'completed'
                ? `All ${adminDashboard.active_plan.summary.counting.total_days} plan days are already counted.`
                : adminDashboard.active_plan.summary.counting.counted_through
                  ? `Meal totals are counted through ${formatDate(adminDashboard.active_plan.summary.counting.counted_through)}. Future plan days are excluded until their date starts.`
                  : 'This plan has not started yet, so no meals are counted.'}
            </p>
          ) : null}
        </Card>

        <Card>
          <h2 className="text-2xl font-bold">Recent Grocery Items</h2>
          <div className="mt-4 space-y-3">
            {adminDashboard.groceries.recent.map((item) => (
              <div key={item.id} className="rounded-md border border-stone-200 bg-stone-50 px-3 py-3">
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Member Breakdown</h2>
            </div>
            <Badge variant="brand">
              {adminDashboard.active_plan.summary.counting.counted_days} of {adminDashboard.active_plan.summary.tracked_days} days counted
            </Badge>
          </div>

          <div className="mt-4 overflow-hidden rounded-md border border-stone-200">
            <div className="hidden grid-cols-[1.5fr_repeat(6,0.75fr)] gap-2 bg-stone-100 px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 md:grid">
              <span>Member</span>
              <span>Lunch</span>
              <span>Lunch Skip</span>
              <span>Dinner</span>
              <span>Dinner Skip</span>
              <span>Guest</span>
              <span>Total</span>
            </div>

            <div className="divide-y divide-stone-200 bg-white">
              {adminDashboard.active_plan.summary.members.map((member) => (
                <div key={member.user.id} className="px-3 py-3">
                  <div className="md:hidden">
                    <div>
                      <button className="group text-left" type="button" onClick={() => setSelectedAdminMember(member)}>
                        <p className="font-semibold text-ink-950 transition group-hover:text-brand-700">{member.user.name}</p>
                        <p className="text-sm text-stone-500 transition group-hover:text-brand-700">
                          @{member.user.username} - View meal days
                        </p>
                      </button>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-md bg-stone-50 px-3 py-2.5">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Lunch</p>
                        <p className="mt-1 text-lg font-bold text-ink-950">{member.taken_lunches}</p>
                      </div>
                      <div className="rounded-md bg-stone-50 px-3 py-2.5">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Lunch Skip</p>
                        <p className="mt-1 text-lg font-bold text-ink-950">{member.skipped_lunches}</p>
                      </div>
                      <div className="rounded-md bg-stone-50 px-3 py-2.5">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Dinner</p>
                        <p className="mt-1 text-lg font-bold text-ink-950">{member.taken_dinners}</p>
                      </div>
                      <div className="rounded-md bg-stone-50 px-3 py-2.5">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Dinner Skip</p>
                        <p className="mt-1 text-lg font-bold text-ink-950">{member.skipped_dinners}</p>
                      </div>
                    </div>
                    <div className="mt-3 rounded-md bg-brand-50 px-3 py-2.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Guest Meals</p>
                      <p className="mt-1 text-xl font-bold text-ink-950">{member.guest_meals}</p>
                    </div>
                    <div className="mt-3 rounded-md bg-brand-50 px-3 py-2.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Total</p>
                      <p className="mt-1 text-xl font-bold text-ink-950">{member.taken_meals}</p>
                    </div>
                  </div>

                  <div className="hidden gap-3 md:grid md:grid-cols-[1.5fr_repeat(6,0.75fr)] md:items-center">
                    <div>
                      <button className="group text-left" type="button" onClick={() => setSelectedAdminMember(member)}>
                        <p className="font-semibold text-ink-950 transition group-hover:text-brand-700">{member.user.name}</p>
                        <p className="text-sm text-stone-500 transition group-hover:text-brand-700">
                          @{member.user.username} - View meal days
                        </p>
                      </button>
                    </div>
                    <p className="text-sm font-medium text-stone-700 md:text-base">{member.taken_lunches}</p>
                    <p className="text-sm font-medium text-stone-700 md:text-base">{member.skipped_lunches}</p>
                    <p className="text-sm font-medium text-stone-700 md:text-base">{member.taken_dinners}</p>
                    <p className="text-sm font-medium text-stone-700 md:text-base">{member.skipped_dinners}</p>
                    <p className="text-sm font-medium text-stone-700 md:text-base">{member.guest_meals}</p>
                    <p className="text-sm font-bold text-ink-950 md:text-base">{member.taken_meals}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : null}

      <MemberMealDetailsModal
        countedThrough={adminDashboard.active_plan?.summary.counting.counted_through ?? null}
        isOpen={selectedAdminMember !== null}
        member={selectedAdminMember}
        planName={adminDashboard.active_plan?.name ?? ''}
        onClose={() => setSelectedAdminMember(null)}
      />

      <TodayMealMembersModal
        isOpen={selectedTodayMeal !== null}
        members={todayMealMembers}
        title={selectedTodayMeal?.title ?? ''}
        onClose={() => setSelectedTodayMeal(null)}
      />
    </div>
  )
}
