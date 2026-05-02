import { useEffect, useState } from 'react'
import { CalendarCheck2, Soup } from 'lucide-react'
import { api, getApiErrorMessage } from '../api/client'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Spinner } from '../components/ui/Spinner'
import { formatDate } from '../lib/format'
import type { MealStatus, MealStatusMeta } from '../types'

export function MealsPage() {
  const [statuses, setStatuses] = useState<MealStatus[]>([])
  const [meta, setMeta] = useState<MealStatusMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState<number | null>(null)

  useEffect(() => {
    async function loadStatuses() {
      try {
        const response = await api.get<{ data: MealStatus[]; meta: MealStatusMeta }>('/meal-statuses')
        setStatuses(response.data.data)
        setMeta(response.data.meta)
      } catch (loadError) {
        setError(getApiErrorMessage(loadError))
      } finally {
        setIsLoading(false)
      }
    }

    void loadStatuses()
  }, [])

  async function toggleMeal(status: MealStatus, field: 'skip_lunch' | 'skip_dinner') {
    setError('')
    setSavingId(status.id)

    try {
      const response = await api.patch<{ data: MealStatus }>(`/meal-statuses/${status.id}`, {
        [field]: !status[field],
      })

      setStatuses((current) => current.map((entry) => (entry.id === status.id ? response.data.data : entry)))
    } catch (toggleError) {
      setError(getApiErrorMessage(toggleError))
    } finally {
      setSavingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="panel flex min-h-[320px] items-center justify-center">
        <Spinner label="Loading meal statuses..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        title="My Meals"
        copy="Only mark the meals you cannot take. Unmarked lunch and dinner stay counted as taken automatically."
      />

      {meta?.meal_plan ? (
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        <div className="rounded-2xl border border-danger-100 bg-danger-100/60 px-4 py-3 text-sm font-medium text-danger-500">
          {error}
        </div>
      ) : null}

      {statuses.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {statuses.map((status) => (
            <Card key={status.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-500">{formatDate(status.meal_date)}</p>
                  <h2 className="mt-2 text-xl font-bold text-ink-950">{status.meal_date}</h2>
                </div>
                <Badge variant={status.skip_lunch || status.skip_dinner ? 'accent' : 'brand'}>
                  {status.skip_lunch || status.skip_dinner ? 'Custom status' : 'All taken'}
                </Badge>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="rounded-[22px] border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-brand-100 p-2 text-brand-700">
                        <Soup className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink-950">Lunch</p>
                        <p className="text-sm text-stone-500">{status.skip_lunch ? 'Marked as skipped' : 'Counted as taken'}</p>
                      </div>
                    </div>
                    <Button
                      disabled={!status.can_edit || savingId === status.id}
                      variant={status.skip_lunch ? 'danger' : 'ghost'}
                      onClick={() => toggleMeal(status, 'skip_lunch')}
                    >
                      {status.skip_lunch ? 'Undo Skip' : 'Skip Lunch'}
                    </Button>
                  </div>
                </div>

                <div className="rounded-[22px] border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-accent-100 p-2 text-[#9a5d1d]">
                        <CalendarCheck2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink-950">Dinner</p>
                        <p className="text-sm text-stone-500">{status.skip_dinner ? 'Marked as skipped' : 'Counted as taken'}</p>
                      </div>
                    </div>
                    <Button
                      disabled={!status.can_edit || savingId === status.id}
                      variant={status.skip_dinner ? 'danger' : 'ghost'}
                      onClick={() => toggleMeal(status, 'skip_dinner')}
                    >
                      {status.skip_dinner ? 'Undo Skip' : 'Skip Dinner'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CalendarCheck2}
          title="No meal statuses found"
          copy="When an admin creates a plan, your daily lunch and dinner entries will appear here automatically."
        />
      )}
    </div>
  )
}
