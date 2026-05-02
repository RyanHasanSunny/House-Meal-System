import { CalendarRange, ScrollText, ShoppingBasket, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api, getApiErrorMessage } from '../api/client'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Select } from '../components/ui/Select'
import { Spinner } from '../components/ui/Spinner'
import { TextArea } from '../components/ui/TextArea'
import { cn } from '../lib/cn'
import { formatCurrency, formatDate, isDateActive, todayValue } from '../lib/format'
import { useAuth } from '../providers/AuthProvider'
import type { MealPlan, MealPlanSummary } from '../types'

type PlanFormState = {
  name: string
  type: 'weekly' | 'monthly' | 'custom'
  start_date: string
  end_date: string
  notes: string
}

function addDays(dateString: string, days: number) {
  const date = new Date(dateString)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function daysInMonth(dateString: string) {
  const date = new Date(dateString)
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

const defaultStartDate = todayValue()

export function MealPlansPage() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<MealPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null)
  const [form, setForm] = useState<PlanFormState>({
    name: `${new Date(defaultStartDate).toLocaleString('en-BD', { month: 'long' })} Meal Plan`,
    type: 'monthly',
    start_date: defaultStartDate,
    end_date: addDays(defaultStartDate, daysInMonth(defaultStartDate) - 1),
    notes: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MealPlan | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadPlans() {
      try {
        const [plansResponse, activeResponse] = await Promise.all([
          api.get<{ data: MealPlan[] }>('/meal-plans'),
          api.get<{ data: MealPlan | null }>('/meal-plans/active'),
        ])

        setPlans(plansResponse.data.data)

        const initialPlan = activeResponse.data.data ?? plansResponse.data.data[0] ?? null
        if (initialPlan) {
          const detailResponse = await api.get<{ data: MealPlan }>(`/meal-plans/${initialPlan.id}`)
          setSelectedPlan(detailResponse.data.data)
        } else {
          setSelectedPlan(null)
        }
      } catch (loadError) {
        setError(getApiErrorMessage(loadError))
      } finally {
        setIsLoading(false)
      }
    }

    void loadPlans()
  }, [])

  const selectedSummary: MealPlanSummary | null = selectedPlan?.summary ?? null

  async function handlePlanSelect(planId: number) {
    try {
      const response = await api.get<{ data: MealPlan }>(`/meal-plans/${planId}`)
      setSelectedPlan(response.data.data)
    } catch (loadError) {
      setError(getApiErrorMessage(loadError))
    }
  }

  function syncForm(type: PlanFormState['type'], startDate: string) {
    if (type === 'weekly') {
      return {
        name: `Weekly Plan starting ${formatDate(startDate)}`,
        start_date: startDate,
        end_date: addDays(startDate, 6),
      }
    }

    if (type === 'monthly') {
      const span = daysInMonth(startDate)
      const label = new Date(startDate).toLocaleString('en-BD', { month: 'long', year: 'numeric' })

      return {
        name: `${label} Meal Plan`,
        start_date: startDate,
        end_date: addDays(startDate, span - 1),
      }
    }

    return {
      name: form.name,
      start_date: startDate,
      end_date: form.end_date < startDate ? startDate : form.end_date,
    }
  }

  function updateType(type: PlanFormState['type']) {
    const synced = syncForm(type, form.start_date)
    setForm((current) => ({
      ...current,
      type,
      ...synced,
    }))
  }

  function updateStartDate(startDate: string) {
    const synced = syncForm(form.type, startDate)
    setForm((current) => ({
      ...current,
      ...synced,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)

    try {
      const response = await api.post<{ data: MealPlan; message: string }>('/meal-plans', form)
      setPlans((current) => [response.data.data, ...current])
      setSelectedPlan(response.data.data)
      setMessage(response.data.message)
    } catch (submitError) {
      setError(getApiErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  function openDeleteModal(plan: MealPlan) {
    setError('')
    setMessage('')
    setDeleteTarget(plan)
    setDeleteConfirmation('')
  }

  async function handleDeletePlan() {
    if (!deleteTarget) {
      return
    }

    setError('')
    setMessage('')
    setIsDeleting(true)

    try {
      await api.delete(`/meal-plans/${deleteTarget.id}`, {
        data: {
          confirmation_name: deleteConfirmation,
        },
      })

      const nextPlans = plans.filter((plan) => plan.id !== deleteTarget.id)
      setPlans(nextPlans)
      setSelectedPlan((current) => (current?.id === deleteTarget.id ? null : current))
      setDeleteTarget(null)
      setDeleteConfirmation('')
      setMessage('Meal plan deleted successfully.')
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError))
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="panel flex min-h-[320px] items-center justify-center">
        <Spinner label="Loading meal plans..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeading title="Meal Plans" />

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-brand-100 p-3 text-brand-700">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Create Plan</h2>
            </div>
          </div>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="md:col-span-2">
              <label className="field-label">Plan Type</label>
              <Select value={form.type} onChange={(event) => updateType(event.target.value as PlanFormState['type'])}>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="custom">Custom</option>
              </Select>
            </div>
            <div>
              <label className="field-label">Start Date</label>
              <Input type="date" value={form.start_date} onChange={(event) => updateStartDate(event.target.value)} />
            </div>
            <div>
              <label className="field-label">End Date</label>
              <Input
                type="date"
                disabled={form.type !== 'custom'}
                value={form.end_date}
                onChange={(event) => setForm((current) => ({ ...current, end_date: event.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="field-label">Plan Name</label>
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="field-label">Notes</label>
              <TextArea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
            </div>

            {error ? (
              <div className="md:col-span-2 rounded-2xl border border-danger-100 bg-danger-100/60 px-4 py-3 text-sm font-medium whitespace-pre-line text-danger-500">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="md:col-span-2 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
                {message}
              </div>
            ) : null}

            <div className="md:col-span-2">
              <Button className="w-full sm:w-auto" disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Creating...' : 'Create Meal Plan'}
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          {plans.length ? (
            plans.map((plan) => (
              <Card key={plan.id} className={selectedPlan?.id === plan.id ? 'ring-2 ring-brand-300' : ''}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold">{plan.name}</h2>
                      <Badge variant={isDateActive(plan.start_date, plan.end_date) ? 'brand' : 'accent'}>
                        {isDateActive(plan.start_date, plan.end_date) ? 'Active' : plan.type_label}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-stone-600">
                      {formatDate(plan.start_date)} to {formatDate(plan.end_date)}
                    </p>
                    <p className="mt-2 text-sm text-stone-500">
                      {plan.meal_statuses_count} member-day entries | {plan.grocery_items_count} grocery items
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" onClick={() => handlePlanSelect(plan.id)}>
                      View Summary
                    </Button>
                    {user?.role === 'super_admin' ? (
                      <Button variant="ghost" onClick={() => openDeleteModal(plan)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))
          ) : <EmptyState icon={ScrollText} title="No meal plans yet" />}
        </div>
      </div>

      {selectedPlan && selectedSummary ? (
        <div className="space-y-6">
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selectedPlan.name}</h2>
                <p className="mt-2 text-sm text-stone-600">
                  {formatDate(selectedPlan.start_date)} to {formatDate(selectedPlan.end_date)}
                </p>
                {selectedPlan.current_admin ? (
                  <p className="mt-2 text-sm text-stone-500">
                    Weekly admin: {selectedPlan.current_admin.name} (@{selectedPlan.current_admin.username})
                  </p>
                ) : null}
              </div>
              <Badge variant="brand">{selectedSummary.totals.taken_meals} total counted meals</Badge>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-5">
              <div className="panel-soft p-4">
                <p className="text-sm text-stone-500">Members</p>
                <p className="mt-2 text-2xl font-bold">{selectedSummary.member_count}</p>
              </div>
              <div className="panel-soft p-4">
                <p className="text-sm text-stone-500">Lunch Taken</p>
                <p className="mt-2 text-2xl font-bold">{selectedSummary.totals.taken_lunches}</p>
              </div>
              <div className="panel-soft p-4">
                <p className="text-sm text-stone-500">Dinner Taken</p>
                <p className="mt-2 text-2xl font-bold">{selectedSummary.totals.taken_dinners}</p>
              </div>
              <div className="panel-soft p-4">
                <p className="text-sm text-stone-500">Grocery Spend</p>
                <p className="mt-2 text-2xl font-bold">{formatCurrency(selectedPlan.groceries.total_spend)}</p>
              </div>
              <div className="panel-soft p-4">
                <p className="text-sm text-stone-500">Grocery Items</p>
                <p className="mt-2 text-2xl font-bold">{selectedPlan.groceries.item_count}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Groceries Under This Plan</h2>
              </div>
              <Badge variant="accent">{formatCurrency(selectedPlan.groceries.total_spend)}</Badge>
            </div>

            {selectedPlan.groceries.items.length ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {selectedPlan.groceries.items.map((item) => (
                  <div key={item.id} className="rounded-[22px] border border-stone-200 bg-stone-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-ink-950">{item.title}</p>
                          {item.category ? <Badge variant="brand">{item.category}</Badge> : null}
                        </div>
                        <p className="mt-2 text-sm text-stone-600">
                          {item.quantity} {item.unit || 'units'} | {formatDate(item.purchased_on)}
                        </p>
                        <p className="mt-2 text-sm text-stone-500">Added by {item.added_by?.name ?? 'Unknown'}</p>
                      </div>
                      <Badge variant="accent">{formatCurrency(item.price)}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState icon={ShoppingBasket} title="No groceries yet" />}
          </Card>

          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Member Breakdown</h2>
              </div>
              <Badge variant="brand">{selectedSummary.tracked_days} tracked days</Badge>
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
                {selectedSummary.members.map((member) => (
                  <div key={member.user.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1.6fr_repeat(5,0.8fr)] md:items-center">
                    <div>
                      <p className="font-semibold text-ink-950">{member.user.name}</p>
                      <p className="text-sm text-stone-500">@{member.user.username}</p>
                    </div>
                    <p>{member.taken_lunches}</p>
                    <p>{member.skipped_lunches}</p>
                    <p>{member.taken_dinners}</p>
                    <p>{member.skipped_dinners}</p>
                    <p className="font-bold text-ink-950">{member.taken_meals}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      <div
        className={cn(
          'fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/55 px-4 transition',
          deleteTarget ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <div className="w-full max-w-lg rounded-[28px] bg-white p-5 shadow-[0_30px_80px_-30px_rgba(21,21,22,0.55)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="mt-2 text-2xl font-bold">Delete Meal Plan</h2>
            </div>
            <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {deleteTarget ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-[22px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
                {deleteTarget.name}
              </div>
              <div>
                <label className="field-label">Type Plan Name</label>
                <Input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={isDeleting || deleteConfirmation.trim() !== deleteTarget.name}
                  type="button"
                  variant="danger"
                  onClick={() => void handleDeletePlan()}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Plan'}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
