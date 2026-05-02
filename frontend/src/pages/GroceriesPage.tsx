import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ListChecks, ShoppingBasket, Trash2 } from 'lucide-react'
import { api, getApiErrorMessage } from '../api/client'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { MetricCard } from '../components/ui/MetricCard'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Select } from '../components/ui/Select'
import { Spinner } from '../components/ui/Spinner'
import { TextArea } from '../components/ui/TextArea'
import { formatCurrency, formatDate, todayValue } from '../lib/format'
import { useAuth } from '../providers/AuthProvider'
import type { GroceryCatalogItem, GroceryItem, MealPlan } from '../types'

type GroceryMeta = {
  total_spend: number
  item_count: number
  selected_meal_plan: MealPlan | null
}

const initialForm = {
  meal_plan_id: 0,
  grocery_catalog_item_id: 0,
  quantity: 1,
  price: 0,
  purchased_on: todayValue(),
  notes: '',
}

const initialCatalogForm = {
  name: '',
  category: '',
  default_unit: '',
  sort_order: 0,
  is_active: true,
}

export function GroceriesPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<GroceryItem[]>([])
  const [catalogItems, setCatalogItems] = useState<GroceryCatalogItem[]>([])
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [selectedMealPlanId, setSelectedMealPlanId] = useState(0)
  const [meta, setMeta] = useState<GroceryMeta>({
    total_spend: 0,
    item_count: 0,
    selected_meal_plan: null,
  })
  const [form, setForm] = useState(initialForm)
  const [catalogForm, setCatalogForm] = useState(initialCatalogForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCatalogSubmitting, setIsCatalogSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const canManageGroceries = user?.role === 'super_admin' || user?.role === 'admin'
  const canManageCatalog = user?.role === 'super_admin'

  const activeCatalogItems = useMemo(
    () => catalogItems.filter((item) => item.is_active),
    [catalogItems]
  )

  const selectedCatalogItem =
    activeCatalogItems.find((item) => item.id === form.grocery_catalog_item_id)
    ?? catalogItems.find((item) => item.id === form.grocery_catalog_item_id)
    ?? null

  async function loadGroceries(mealPlanId?: number) {
    const response = await api.get<{ data: GroceryItem[]; meta: GroceryMeta }>('/groceries', {
      params: mealPlanId ? { meal_plan_id: mealPlanId } : undefined,
    })

    setItems(response.data.data)
    setMeta(response.data.meta)

    const resolvedPlanId = response.data.meta.selected_meal_plan?.id ?? mealPlanId ?? 0
    setSelectedMealPlanId(resolvedPlanId)
    setForm((current) => ({ ...current, meal_plan_id: resolvedPlanId }))
  }

  async function loadCatalog() {
    const response = await api.get<{ data: GroceryCatalogItem[] }>('/grocery-catalog')
    setCatalogItems(response.data.data)
    setForm((current) => ({
      ...current,
      grocery_catalog_item_id: current.grocery_catalog_item_id || response.data.data[0]?.id || 0,
    }))
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        const plansResponse = await api.get<{ data: MealPlan[] }>('/meal-plans')
        setMealPlans(plansResponse.data.data)
        await Promise.all([
          loadCatalog(),
          loadGroceries(plansResponse.data.data[0]?.id),
        ])
      } catch (loadError) {
        setError(getApiErrorMessage(loadError))
      } finally {
        setIsLoading(false)
      }
    }

    void bootstrap()
  }, [])

  async function handleMealPlanChange(mealPlanId: number) {
    setError('')
    setMessage('')

    try {
      await loadGroceries(mealPlanId)
    } catch (loadError) {
      setError(getApiErrorMessage(loadError))
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)

    try {
      const response = await api.post<{ data: GroceryItem; message: string }>('/groceries', form)
      const nextItems = [response.data.data, ...items]
      setItems(nextItems)
      setMeta((current) => ({
        ...current,
        total_spend: nextItems.reduce((sum, item) => sum + item.price, 0),
        item_count: nextItems.length,
      }))
      setForm((current) => ({
        ...initialForm,
        meal_plan_id: current.meal_plan_id,
        grocery_catalog_item_id: current.grocery_catalog_item_id,
      }))
      setMessage(response.data.message)
    } catch (submitError) {
      setError(getApiErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCatalogSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsCatalogSubmitting(true)

    try {
      const response = await api.post<{ data: GroceryCatalogItem; message: string }>('/grocery-catalog', catalogForm)
      const nextCatalog = [...catalogItems, response.data.data].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
      setCatalogItems(nextCatalog)
      setCatalogForm(initialCatalogForm)
      setMessage(response.data.message)
    } catch (submitError) {
      setError(getApiErrorMessage(submitError))
    } finally {
      setIsCatalogSubmitting(false)
    }
  }

  async function handleCatalogToggle(item: GroceryCatalogItem) {
    setError('')
    setMessage('')

    try {
      const response = await api.patch<{ data: GroceryCatalogItem; message: string }>(`/grocery-catalog/${item.id}`, {
        is_active: !item.is_active,
      })

      setCatalogItems((current) =>
        current
          .map((entry) => (entry.id === item.id ? response.data.data : entry))
          .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
      )
      setMessage(response.data.message)
    } catch (toggleError) {
      setError(getApiErrorMessage(toggleError))
    }
  }

  async function handleDelete(item: GroceryItem) {
    setError('')
    setMessage('')

    try {
      await api.delete(`/groceries/${item.id}`)
      const nextItems = items.filter((entry) => entry.id !== item.id)
      setItems(nextItems)
      setMeta((current) => ({
        ...current,
        total_spend: nextItems.reduce((sum, entry) => sum + entry.price, 0),
        item_count: nextItems.length,
      }))
      setMessage('Grocery item deleted successfully.')
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError))
    }
  }

  if (isLoading) {
    return (
      <div className="panel flex min-h-[320px] items-center justify-center">
        <Spinner label="Loading groceries..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Meal Plan Groceries"
        copy="Admins now pick from a common grocery list. Super admins maintain that shared item catalog for rice, oil, masala, chicken, fish, egg, potato, and more."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={ShoppingBasket} label="Plan Spend" value={formatCurrency(meta.total_spend)} />
        <MetricCard icon={ShoppingBasket} label="Plan Items" tone="accent" value={meta.item_count} />
        <MetricCard icon={ListChecks} label="Catalog Items" tone="neutral" value={activeCatalogItems.length} />
        <MetricCard icon={ShoppingBasket} label="Visible Items" value={items.length} />
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className="field-label">Meal Plan</label>
            <Select value={selectedMealPlanId} onChange={(event) => void handleMealPlanChange(Number(event.target.value))}>
              {mealPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </Select>
          </div>
          {meta.selected_meal_plan ? (
            <div className="rounded-[22px] border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-stone-700">
              {formatDate(meta.selected_meal_plan.start_date)} to {formatDate(meta.selected_meal_plan.end_date)}
            </div>
          ) : null}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          {canManageGroceries ? (
            <Card>
              <div className="mb-5">
                <h2 className="text-2xl font-bold">Add Grocery From Catalog</h2>
                <p className="mt-2 text-sm text-stone-600">Choose a common item first, then enter quantity and price for the selected meal plan.</p>
              </div>

              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
                <div className="md:col-span-2">
                  <label className="field-label">Meal Plan</label>
                  <Select
                    value={form.meal_plan_id}
                    onChange={(event) => {
                      const mealPlanId = Number(event.target.value)
                      setForm((current) => ({ ...current, meal_plan_id: mealPlanId }))
                      setSelectedMealPlanId(mealPlanId)
                    }}
                  >
                    {mealPlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <label className="field-label">Catalog Item</label>
                  <Select
                    value={form.grocery_catalog_item_id}
                    onChange={(event) => setForm((current) => ({ ...current, grocery_catalog_item_id: Number(event.target.value) }))}
                  >
                    {activeCatalogItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}{item.category ? ` - ${item.category}` : ''}
                      </option>
                    ))}
                  </Select>
                </div>
                {selectedCatalogItem ? (
                  <div className="md:col-span-2 rounded-[22px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
                    Category: <span className="font-semibold">{selectedCatalogItem.category ?? 'General'}</span>
                    {' | '}
                    Default unit: <span className="font-semibold">{selectedCatalogItem.default_unit ?? 'units'}</span>
                  </div>
                ) : null}
                <div>
                  <label className="field-label">Quantity</label>
                  <Input
                    min="0"
                    step="0.01"
                    type="number"
                    value={form.quantity}
                    onChange={(event) => setForm((current) => ({ ...current, quantity: Number(event.target.value) }))}
                  />
                </div>
                <div>
                  <label className="field-label">Price</label>
                  <Input
                    min="0"
                    step="0.01"
                    type="number"
                    value={form.price}
                    onChange={(event) => setForm((current) => ({ ...current, price: Number(event.target.value) }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="field-label">Purchase Date</label>
                  <Input type="date" value={form.purchased_on} onChange={(event) => setForm((current) => ({ ...current, purchased_on: event.target.value }))} />
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
                    {isSubmitting ? 'Saving...' : 'Add Grocery'}
                  </Button>
                </div>
              </form>
            </Card>
          ) : null}

          {canManageCatalog ? (
            <Card>
              <div className="mb-5">
                <h2 className="text-2xl font-bold">Manage Grocery Catalog</h2>
                <p className="mt-2 text-sm text-stone-600">Super admins control the shared grocery list used by all admins.</p>
              </div>

              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCatalogSubmit}>
                <div className="md:col-span-2">
                  <label className="field-label">Item Name</label>
                  <Input value={catalogForm.name} onChange={(event) => setCatalogForm((current) => ({ ...current, name: event.target.value }))} />
                </div>
                <div>
                  <label className="field-label">Category</label>
                  <Input value={catalogForm.category} onChange={(event) => setCatalogForm((current) => ({ ...current, category: event.target.value }))} />
                </div>
                <div>
                  <label className="field-label">Default Unit</label>
                  <Input value={catalogForm.default_unit} onChange={(event) => setCatalogForm((current) => ({ ...current, default_unit: event.target.value }))} />
                </div>
                <div>
                  <label className="field-label">Sort Order</label>
                  <Input
                    min="0"
                    step="1"
                    type="number"
                    value={catalogForm.sort_order}
                    onChange={(event) => setCatalogForm((current) => ({ ...current, sort_order: Number(event.target.value) }))}
                  />
                </div>
                <div>
                  <label className="field-label">Status</label>
                  <Select
                    value={catalogForm.is_active ? 'active' : 'inactive'}
                    onChange={(event) => setCatalogForm((current) => ({ ...current, is_active: event.target.value === 'active' }))}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Button className="w-full sm:w-auto" disabled={isCatalogSubmitting} type="submit" variant="secondary">
                    {isCatalogSubmitting ? 'Saving...' : 'Add Catalog Item'}
                  </Button>
                </div>
              </form>

              <div className="mt-6 grid gap-3">
                {catalogItems.map((item) => (
                  <div key={item.id} className="rounded-[22px] border border-stone-200 bg-stone-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-ink-950">{item.name}</p>
                          {item.category ? <Badge variant="brand">{item.category}</Badge> : null}
                          <Badge variant={item.is_active ? 'accent' : 'danger'}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-stone-600">
                          Unit: {item.default_unit ?? 'units'} | Order: {item.sort_order}
                        </p>
                      </div>
                      <Button variant="ghost" onClick={() => void handleCatalogToggle(item)}>
                        {item.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          {items.length ? (
            items.map((item) => (
              <Card key={item.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold">{item.title}</h2>
                      {item.category ? <Badge variant="brand">{item.category}</Badge> : null}
                      {item.meal_plan ? <Badge variant="neutral">{item.meal_plan.name}</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm text-stone-600">
                      {item.quantity} {item.unit || 'units'} | {formatDate(item.purchased_on)}
                    </p>
                    <p className="mt-2 text-sm text-stone-500">Added by {item.added_by?.name ?? 'Unknown'}</p>
                    {item.notes ? <p className="mt-3 text-sm leading-6 text-stone-600">{item.notes}</p> : null}
                  </div>

                  <div className="flex flex-col items-start gap-3 sm:items-end">
                    <Badge variant="accent">{formatCurrency(item.price)}</Badge>
                    {canManageGroceries ? (
                      <Button variant="ghost" onClick={() => void handleDelete(item)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <EmptyState icon={ShoppingBasket} title="No grocery entries" copy="Select a meal plan, choose a catalog item, and start logging groceries for that plan." />
          )}
        </div>
      </div>
    </div>
  )
}
