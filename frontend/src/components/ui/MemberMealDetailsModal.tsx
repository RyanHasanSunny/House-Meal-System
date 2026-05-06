import { CalendarDays, UtensilsCrossed, X } from 'lucide-react'
import { Badge } from './Badge'
import { Button } from './Button'
import { cn } from '../../lib/cn'
import { formatDate, formatShortDate } from '../../lib/format'
import type { MealPlanSummaryMember } from '../../types'

export function MemberMealDetailsModal({
  isOpen,
  member,
  planName,
  countedThrough,
  onClose,
}: {
  isOpen: boolean
  member: MealPlanSummaryMember | null
  planName: string
  countedThrough: string | null
  onClose: () => void
}) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-[70] flex items-end justify-center bg-ink-950/55 p-2 transition sm:items-center sm:p-4',
        isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
      onClick={onClose}
    >
      <div
        className="max-h-[calc(100dvh-1rem)] w-full max-w-4xl overflow-y-auto rounded-md bg-white p-3 shadow-[0_30px_80px_-30px_rgba(21,21,22,0.55)] sm:max-h-[calc(100vh-2rem)] sm:p-3.5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="rounded-md bg-brand-100 p-2.5 text-brand-700">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold text-ink-950 sm:text-2xl">
                  {member ? member.user.name : 'Member meal details'}
                </h2>
                <p className="mt-1 truncate text-sm text-stone-500">
                  {member ? `@${member.user.username}` : ''}{member ? ` | ${planName}` : ''}
                </p>
              </div>
            </div>
            {member ? (
              <p className="mt-3 text-sm leading-5 text-stone-600">
                {countedThrough
                  ? `Counted meal history through ${formatDate(countedThrough)}. Future days stay visible here but are not added to totals yet.`
                  : 'This plan has not started yet, so no meals are counted yet.'}
              </p>
            ) : null}
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {member ? (
          <>
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              <div className="rounded-md border border-brand-100 bg-brand-50 px-2.5 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Meals Counted</p>
                <p className="mt-1.5 text-xl font-bold text-ink-950 sm:text-2xl">{member.taken_meals}</p>
              </div>
              <div className="rounded-md border border-stone-200 bg-white px-2.5 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Guest Meals</p>
                <p className="mt-1.5 text-xl font-bold text-ink-950 sm:text-2xl">{member.guest_meals}</p>
              </div>
              <div className="rounded-md border border-stone-200 bg-white px-2.5 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Lunch Counted</p>
                <p className="mt-1.5 text-xl font-bold text-ink-950 sm:text-2xl">{member.taken_lunches}</p>
              </div>
              <div className="rounded-md border border-stone-200 bg-white px-2.5 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Dinner Counted</p>
                <p className="mt-1.5 text-xl font-bold text-ink-950 sm:text-2xl">{member.taken_dinners}</p>
              </div>
              <div className="rounded-md border border-stone-200 bg-white px-2.5 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Plan Days</p>
                <p className="mt-1.5 text-xl font-bold text-ink-950 sm:text-2xl">{member.days.length}</p>
              </div>
            </div>

            <div className="mt-3 space-y-2.5 pr-0 sm:max-h-[52vh] sm:overflow-y-auto sm:pr-1">
              {member.days.map((day) => {
                const lunchLabel = day.counted
                  ? day.lunch_status === 'taken' ? 'Taken' : 'Skipped'
                  : day.lunch_status === 'taken' ? 'Will take' : 'Will skip'
                const dinnerLabel = day.counted
                  ? day.dinner_status === 'taken' ? 'Taken' : 'Skipped'
                  : day.dinner_status === 'taken' ? 'Will take' : 'Will skip'

                return (
                  <div key={day.date} className="rounded-md border border-stone-200 bg-stone-50/80 p-3">
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-stone-500">{formatDate(day.date)}</p>
                        <p className="mt-1 flex items-center gap-2 text-lg font-bold text-ink-950">
                          <CalendarDays className="h-4 w-4 text-brand-700" />
                          {formatShortDate(day.date)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={day.counted ? 'brand' : 'accent'}>
                          {day.counted ? 'Counted' : 'Future'}
                        </Badge>
                        <Badge variant={day.meal_total === 2 ? 'brand' : day.meal_total === 1 ? 'accent' : 'danger'}>
                          {day.meal_total} meal{day.meal_total === 1 ? '' : 's'}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2.5">
                      <div className="rounded-md bg-white px-2.5 py-2.5">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Lunch</p>
                        <p className="mt-1 text-lg font-bold text-ink-950">{lunchLabel}</p>
                        {day.guest_lunches ? (
                          <p className="mt-1 text-xs text-stone-500">
                            +{day.guest_lunches} guest meal{day.guest_lunches === 1 ? '' : 's'}
                          </p>
                        ) : null}
                      </div>
                      <div className="rounded-md bg-white px-2.5 py-2.5">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Dinner</p>
                        <p className="mt-1 text-lg font-bold text-ink-950">{dinnerLabel}</p>
                        {day.guest_dinners ? (
                          <p className="mt-1 text-xs text-stone-500">
                            +{day.guest_dinners} guest meal{day.guest_dinners === 1 ? '' : 's'}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
