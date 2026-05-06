import { useEffect, useState } from 'react'
import { CalendarCheck2, Soup } from 'lucide-react'
import { api, getApiErrorMessage } from '../api/client'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Select } from '../components/ui/Select'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Spinner } from '../components/ui/Spinner'
import { formatDate } from '../lib/format'
import { useAuth } from '../providers/AuthProvider'
import type { MealStatus, MealStatusMeta, User } from '../types'

const LUNCH_CUTOFF_HOUR = 14
const DINNER_CUTOFF_HOUR = 21

function getDhakaDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)

  return {
    year: Number(parts.find((part) => part.type === 'year')?.value ?? '0'),
    month: Number(parts.find((part) => part.type === 'month')?.value ?? '0'),
    day: Number(parts.find((part) => part.type === 'day')?.value ?? '0'),
    hour: Number(parts.find((part) => part.type === 'hour')?.value ?? '0'),
  }
}

function isMealEditableLocally(mealDate: string, meal: 'lunch' | 'dinner', now: Date) {
  const current = getDhakaDateParts(now)
  const [year, month, day] = mealDate.split('-').map(Number)
  const currentDateKey = current.year * 10_000 + current.month * 100 + current.day
  const mealDateKey = year * 10_000 + month * 100 + day

  if (mealDateKey > currentDateKey) {
    return true
  }

  if (mealDateKey < currentDateKey) {
    return false
  }

  const cutoffHour = meal === 'lunch' ? LUNCH_CUTOFF_HOUR : DINNER_CUTOFF_HOUR

  return current.hour < cutoffHour
}

export function MealsPage() {
  const { user } = useAuth()
  const [statuses, setStatuses] = useState<MealStatus[]>([])
  const [meta, setMeta] = useState<MealStatusMeta | null>(null)
  const [members, setMembers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [savingId, setSavingId] = useState<number | null>(null)
  const [now, setNow] = useState(() => new Date())

  const canManageMemberMeals = user?.role === 'super_admin'

  async function loadStatuses(userId?: number) {
    const response = await api.get<{ data: MealStatus[]; meta: MealStatusMeta }>('/meal-statuses', {
      params: userId ? { user_id: userId } : undefined,
    })

    setStatuses(response.data.data)
    setMeta(response.data.meta)
  }

  useEffect(() => {
    async function bootstrap() {
      setError('')

      try {
        if (canManageMemberMeals) {
          const response = await api.get<{ data: User[] }>('/users')
          const memberOptions = response.data.data.filter((entry) => entry.role === 'member')

          setMembers(memberOptions)
          setSelectedUserId(user?.id ?? null)
          await loadStatuses(user?.id)
        } else {
          setMembers([])
          setSelectedUserId(null)
          await loadStatuses()
        }
      } catch (loadError) {
        setError(getApiErrorMessage(loadError))
      } finally {
        setIsLoading(false)
      }
    }

    void bootstrap()
  }, [canManageMemberMeals, user?.id])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 30_000)

    return () => window.clearInterval(timer)
  }, [])

  async function handleSelectedUserChange(nextUserId: number) {
    setError('')
    setMessage('')
    setIsLoading(true)
    setSelectedUserId(nextUserId)

    try {
      await loadStatuses(nextUserId === user?.id ? undefined : nextUserId)
    } catch (loadError) {
      setError(getApiErrorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }

  async function updateMealStatus(status: MealStatus, payload: Partial<Pick<MealStatus, 'skip_lunch' | 'skip_dinner' | 'guest_lunches' | 'guest_dinners'>>) {
    setError('')
    setMessage('')
    setSavingId(status.id)

    try {
      const response = await api.patch<{ data: MealStatus }>(`/meal-statuses/${status.id}`, payload)

      setStatuses((current) => current.map((entry) => (entry.id === status.id ? response.data.data : entry)))
      setMessage('Meal status updated successfully.')
    } catch (toggleError) {
      const nextMessage = getApiErrorMessage(toggleError)

      if (nextMessage === 'Lunch skip time has passed.') {
        setStatuses((current) =>
          current.map((entry) =>
            entry.id === status.id ? { ...entry, can_edit_lunch: false, can_edit: entry.can_edit_dinner } : entry
          )
        )
      }

      if (nextMessage === 'Dinner skip time has passed.') {
        setStatuses((current) =>
          current.map((entry) =>
            entry.id === status.id ? { ...entry, can_edit_dinner: false, can_edit: entry.can_edit_lunch } : entry
          )
        )
      }

      setError(nextMessage)
    } finally {
      setSavingId(null)
    }
  }

  function toggleMeal(status: MealStatus, field: 'skip_lunch' | 'skip_dinner') {
    void updateMealStatus(status, {
      [field]: !status[field],
    })
  }

  function updateGuestMeals(status: MealStatus, field: 'guest_lunches' | 'guest_dinners', nextValue: number) {
    void updateMealStatus(status, {
      [field]: Math.min(Math.max(nextValue, 0), 3),
    })
  }

  if (isLoading) {
    return (
      <div className="panel flex min-h-[320px] items-center justify-center">
        <Spinner label="Loading meal statuses..." />
      </div>
    )
  }

  const viewableUsers = user
    ? [user, ...members.filter((entry) => entry.id !== user.id)]
    : []

  return (
    <div className="space-y-3">
      <SectionHeading
        title={canManageMemberMeals ? 'Meal Statuses' : 'My Meals'}
        copy={
          canManageMemberMeals
            ? 'View your own meals or switch to any member to manage lunch and dinner skips.'
            : 'Only mark the meals you cannot take. Unmarked lunch and dinner stay counted as taken automatically.'
        }
      />

      {canManageMemberMeals ? (
        <Card>
          <div className="grid gap-3 md:grid-cols-[280px_1fr] md:items-end">
            <div>
              <label className="field-label">View Member</label>
              <Select
                value={selectedUserId ?? user?.id ?? 0}
                onChange={(event) => void handleSelectedUserChange(Number(event.target.value))}
              >
                {viewableUsers.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.id === user?.id ? `${entry.name} (You)` : `${entry.name} (@${entry.username})`}
                  </option>
                ))}
              </Select>
            </div>
            <div className="rounded-md border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm text-stone-700">
              {meta ? `${meta.selected_user.name} (@${meta.selected_user.username})` : 'Select a member to manage meal statuses.'}
            </div>
          </div>
        </Card>
      ) : null}

      {meta?.meal_plan ? (
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Selected Plan</p>
              <h2 className="mt-2 text-2xl font-bold">{meta.meal_plan.name}</h2>
              <p className="mt-2 text-sm text-stone-600">
                {formatDate(meta.meal_plan.start_date)} to {formatDate(meta.meal_plan.end_date)}
              </p>
            </div>
            <Badge variant="brand">{meta.meal_plan.type}</Badge>
          </div>
        </Card>
      ) : null}

      {error ? (
        <div className="rounded-md border border-danger-100 bg-danger-100/60 px-3 py-2.5 text-sm font-medium text-danger-500">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-md border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm font-medium text-brand-700">
          {message}
        </div>
      ) : null}

      {statuses.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {statuses.map((status) => {
            const canEditLunch = status.can_edit_lunch && isMealEditableLocally(status.meal_date, 'lunch', now)
            const canEditDinner = status.can_edit_dinner && isMealEditableLocally(status.meal_date, 'dinner', now)

            return (
              <Card key={status.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-500">{formatDate(status.meal_date)}</p>
                    <h2 className="mt-2 text-xl font-bold text-ink-950">{status.meal_date}</h2>
                  </div>
                  <Badge variant={status.skip_lunch || status.skip_dinner || status.guest_meals ? 'accent' : 'brand'}>
                    {status.skip_lunch || status.skip_dinner || status.guest_meals ? 'Custom status' : 'All taken'}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-md border border-stone-200 bg-stone-50 p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-md bg-brand-100 p-2 text-brand-700">
                          <Soup className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-ink-950">Lunch</p>
                          <p className="text-sm text-stone-500">{status.skip_lunch ? 'Marked as skipped' : 'Counted as taken'}</p>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                            Guest meals {status.guest_lunches} / 3
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <Button
                          disabled={!canEditLunch || savingId === status.id}
                          variant={status.skip_lunch ? 'danger' : 'ghost'}
                          onClick={() => toggleMeal(status, 'skip_lunch')}
                        >
                          {status.skip_lunch ? 'Undo Skip' : 'Skip Lunch'}
                        </Button>
                        <div className="flex items-center gap-1.5">
                          <Button
                            disabled={!canEditLunch || savingId === status.id || status.guest_lunches <= 0}
                            variant="ghost"
                            onClick={() => updateGuestMeals(status, 'guest_lunches', status.guest_lunches - 1)}
                          >
                            - Guest
                          </Button>
                          <Button
                            disabled={!canEditLunch || savingId === status.id || status.guest_lunches >= 3}
                            variant="ghost"
                            onClick={() => updateGuestMeals(status, 'guest_lunches', status.guest_lunches + 1)}
                          >
                            + Guest
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border border-stone-200 bg-stone-50 p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-md bg-accent-100 p-2 text-[#9a5d1d]">
                          <CalendarCheck2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-ink-950">Dinner</p>
                          <p className="text-sm text-stone-500">{status.skip_dinner ? 'Marked as skipped' : 'Counted as taken'}</p>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                            Guest meals {status.guest_dinners} / 3
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <Button
                          disabled={!canEditDinner || savingId === status.id}
                          variant={status.skip_dinner ? 'danger' : 'ghost'}
                          onClick={() => toggleMeal(status, 'skip_dinner')}
                        >
                          {status.skip_dinner ? 'Undo Skip' : 'Skip Dinner'}
                        </Button>
                        <div className="flex items-center gap-1.5">
                          <Button
                            disabled={!canEditDinner || savingId === status.id || status.guest_dinners <= 0}
                            variant="ghost"
                            onClick={() => updateGuestMeals(status, 'guest_dinners', status.guest_dinners - 1)}
                          >
                            - Guest
                          </Button>
                          <Button
                            disabled={!canEditDinner || savingId === status.id || status.guest_dinners >= 3}
                            variant="ghost"
                            onClick={() => updateGuestMeals(status, 'guest_dinners', status.guest_dinners + 1)}
                          >
                            + Guest
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={CalendarCheck2}
          title="No meal statuses found"
          copy={canManageMemberMeals ? 'No meal statuses are available for the selected user.' : undefined}
        />
      )}
    </div>
  )
}
