import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ListChecks, ShoppingBasket, Trash2, X } from 'lucide-react'
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
import { TypedDeleteModal } from '../components/ui/TypedDeleteModal'
import { cn } from '../lib/cn'
import { formatCurrency, formatDate, todayValue } from '../lib/format'
import { useAuth } from '../providers/AuthProvider'
import type { GroceryCatalogItem, GroceryItem, MealPlan } from '../types'

type GroceryMeta = {
  total_spend: number
  item_count: number
  selected_meal_plan: MealPlan | null
}

const COMMON_UNITS = [
  'kg',
  'g',
  'liter',
  'ml',
  'pcs',
  'dozen',
  'packet',
  'bag',
  'box',
  'bottle',
  'jar',
  'bunch',
  'tray',
]

const initialForm = {
  meal_plan_id: 0,
  grocery_catalog_item_id: 0,
  title: '',
  quantity: 1,
  unit: 'kg',
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

function catalogOptionLabel(item: GroceryCatalogItem) {
  return item.category ? `${item.name} - ${item.category}` : item.name
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
  const [catalogQuery, setCatalogQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCatalogSubmitting, setIsCatalogSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<GroceryItem | null>(null)
  const [activeTab, setActiveTab] = useState<'groceries' | 'catalog'>('groceries')
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

  const filteredCatalogItems = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase()

    if (!query) {
      return activeCatalogItems
    }

    return activeCatalogItems.filter((item) =>
      catalogOptionLabel(item).toLowerCase().includes(query)
    )
  }, [activeCatalogItems, catalogQuery])

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
    const defaultCatalogItemId = response.data.data[0]?.id || 0

    setForm((current) => ({
      ...current,
      grocery_catalog_item_id: current.grocery_catalog_item_id || defaultCatalogItemId,
      title: current.title || response.data.data[0]?.name || '',
      unit: current.unit || response.data.data[0]?.default_unit || 'kg',
    }))

    const defaultCatalogItem = response.data.data.find((item) => item.id === defaultCatalogItemId)
    setCatalogQuery(defaultCatalogItem ? catalogOptionLabel(defaultCatalogItem) : '')
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

  function openAddModal() {
    setError('')
    setMessage('')
    const nextCatalogItemId = form.grocery_catalog_item_id || activeCatalogItems[0]?.id || 0

    const nextCatalogItem = activeCatalogItems.find((item) => item.id === nextCatalogItemId) ?? null
    setForm((current) => ({
      ...current,
      meal_plan_id: selectedMealPlanId || mealPlans[0]?.id || 0,
      grocery_catalog_item_id: nextCatalogItemId,
      title: nextCatalogItem?.name ?? current.title,
      unit: nextCatalogItem?.default_unit || current.unit || 'kg',
    }))
    setCatalogQuery(nextCatalogItem ? catalogOptionLabel(nextCatalogItem) : '')
    setIsAddModalOpen(true)
  }

  function openCatalogModal() {
    setError('')
    setMessage('')
    setCatalogForm(initialCatalogForm)
    setIsCatalogModalOpen(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')

    const trimmedTitle = catalogQuery.trim()

    if (!trimmedTitle) {
      setError('Enter an item name.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await api.post<{ data: GroceryItem; message: string }>('/groceries', {
        ...form,
        grocery_catalog_item_id: selectedCatalogItem?.id || null,
        title: trimmedTitle,
      })
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
        unit: current.unit,
      }))
      setIsAddModalOpen(false)
      setMessage('Grocery added. The amount was also recorded as your payment.')
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
      setIsCatalogModalOpen(false)
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

  function openDeleteModal(item: GroceryItem) {
    setError('')
    setMessage('')
    setDeleteTarget(item)
  }

  async function handleDelete(payload: { confirmation_text: string }) {
    if (!deleteTarget) {
      return
    }

    setIsDeleting(true)

    try {
      await api.delete(`/groceries/${deleteTarget.id}`, { data: payload })
      const nextItems = items.filter((entry) => entry.id !== deleteTarget.id)
      setItems(nextItems)
      setMeta((current) => ({
        ...current,
        total_spend: nextItems.reduce((sum, entry) => sum + entry.price, 0),
        item_count: nextItems.length,
      }))
      setDeleteTarget(null)
      setMessage('Grocery item deleted successfully.')
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError))
    } finally {
      setIsDeleting(false)
    }
  }

  function handleCatalogQueryChange(value: string) {
    setCatalogQuery(value)

    const normalizedValue = value.trim().toLowerCase()
    const match = activeCatalogItems.find((item) => {
      const label = catalogOptionLabel(item).toLowerCase()
      return label === normalizedValue || item.name.toLowerCase() === normalizedValue
    })

    setForm((current) => ({
      ...current,
      grocery_catalog_item_id: match?.id ?? 0,
      title: value,
      unit: match?.default_unit || current.unit || 'kg',
    }))
  }

  if (isLoading) {
    return (
      <div className="panel flex min-h-[320px] items-center justify-center">
        <Spinner label="Loading groceries..." />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <SectionHeading title="Meal Plan Groceries" />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard icon={ShoppingBasket} label="Plan Spend" value={formatCurrency(meta.total_spend)} />
        <MetricCard icon={ShoppingBasket} label="Items" tone="accent" value={meta.item_count} />
        <MetricCard icon={ListChecks} label="Catalog" tone="neutral" value={activeCatalogItems.length} />
        <MetricCard icon={ShoppingBasket} label="Shown" value={items.length} />
      </div>

      {canManageCatalog ? (
        <Card>
          <div className="flex flex-wrap gap-3">
            <button
              className={cn(
                'rounded-md px-3 py-2.5 text-sm font-semibold transition',
                activeTab === 'groceries'
                  ? 'bg-brand-700 text-white'
                  : 'border border-stone-200 bg-white text-stone-700 hover:border-brand-300 hover:bg-brand-50'
              )}
              onClick={() => setActiveTab('groceries')}
              type="button"
            >
              Groceries
            </button>
            <button
              className={cn(
                'rounded-md px-3 py-2.5 text-sm font-semibold transition',
                activeTab === 'catalog'
                  ? 'bg-brand-700 text-white'
                  : 'border border-stone-200 bg-white text-stone-700 hover:border-brand-300 hover:bg-brand-50'
              )}
              onClick={() => setActiveTab('catalog')}
              type="button"
            >
              Catalog
            </button>
          </div>
        </Card>
      ) : null}

      {activeTab === 'groceries' ? (
        <Card>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
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
              <div className="rounded-md border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm text-stone-700">
                {formatDate(meta.selected_meal_plan.start_date)} to {formatDate(meta.selected_meal_plan.end_date)}
              </div>
            ) : null}
            {canManageGroceries ? (
              <Button className="w-full md:w-auto" onClick={openAddModal} type="button">
                Add Grocery
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      {error ? (
        <div className="rounded-md border border-danger-100 bg-danger-100/60 px-3 py-2.5 text-sm font-medium whitespace-pre-line text-danger-500">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-md border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm font-medium text-brand-700">
          {message}
        </div>
      ) : null}

      {activeTab === 'groceries' ? (
        <div className="space-y-3">
          {items.length ? (
            items.map((item) => (
              <Card key={item.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold">{item.title}</h2>
                      {item.category ? <Badge variant="brand">{item.category}</Badge> : null}
                      {item.meal_plan ? <Badge variant="neutral">{item.meal_plan.name}</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm text-stone-600">
                      {item.quantity} {item.unit || 'units'} | {formatDate(item.purchased_on)}
                    </p>
                    <p className="mt-2 text-sm text-stone-500">
                      {item.added_by?.name ?? 'Unknown'}{item.member ? ` | Paid by ${item.member.name}` : ''}
                    </p>
                    {item.notes ? <p className="mt-3 text-sm leading-6 text-stone-600">{item.notes}</p> : null}
                  </div>

                  <div className="flex flex-col items-start gap-3 sm:items-end">
                    <Badge variant="accent">{formatCurrency(item.price)}</Badge>
                    {canManageGroceries ? (
                      <Button variant="ghost" onClick={() => openDeleteModal(item)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="flex min-h-[400px] items-center justify-center">
              <EmptyState icon={ShoppingBasket} title="No grocery entries" />
            </div>
          )}
        </div>
      ) : null}

      {canManageCatalog && activeTab === 'catalog' ? (
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Manage Grocery Catalog</h2>
              </div>
              <Button className="w-full sm:w-auto" onClick={openCatalogModal} type="button" variant="secondary">
                Add Item
              </Button>
          </div>

          <div className="mt-4 grid gap-3">
            {catalogItems.map((item) => (
              <div key={item.id} className="rounded-md border border-stone-200 bg-stone-50 p-3.5">
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

      <div
        className={cn(
          'fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/55 px-4 transition',
          isAddModalOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md bg-white p-3.5 shadow-[0_30px_80px_-30px_rgba(21,21,22,0.55)] sm:p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="mt-2 text-2xl font-bold">Add Grocery</h2>
              </div>
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="md:col-span-2 rounded-md border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm text-stone-700">
              <span className="font-semibold">{user?.name ?? 'Current admin'}</span>
              {user?.username ? ` (@${user.username})` : ''}
            </div>
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
              <Input
                list="grocery-catalog-options"
                placeholder="Type to search"
                value={catalogQuery}
                onChange={(event) => handleCatalogQueryChange(event.target.value)}
              />
              <datalist id="grocery-catalog-options">
                {filteredCatalogItems.map((item) => (
                  <option key={item.id} value={catalogOptionLabel(item)} />
                ))}
              </datalist>
            </div>
            {selectedCatalogItem ? (
              <div className="md:col-span-2 rounded-md border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-700">
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
              <label className="field-label">Unit</label>
              <Select value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}>
                {COMMON_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
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
            <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Saving...' : 'Save Grocery'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div
        className={cn(
          'fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/55 px-4 transition',
          isCatalogModalOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md bg-white p-3.5 shadow-[0_30px_80px_-30px_rgba(21,21,22,0.55)] sm:p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="mt-2 text-2xl font-bold">Add Catalog Item</h2>
              </div>
            <Button type="button" variant="ghost" onClick={() => setIsCatalogModalOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleCatalogSubmit}>
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
            <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setIsCatalogModalOpen(false)}>
                Cancel
              </Button>
              <Button disabled={isCatalogSubmitting} type="submit" variant="secondary">
                {isCatalogSubmitting ? 'Saving...' : 'Save Catalog Item'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <TypedDeleteModal
        error={error}
        isOpen={deleteTarget !== null}
        isSubmitting={isDeleting}
        submitLabel="Delete Grocery"
        targetDescription={
          deleteTarget
            ? `${deleteTarget.title} | ${formatCurrency(deleteTarget.price)} | ${formatDate(deleteTarget.purchased_on)}`
            : ''
        }
        targetFieldLabel="Type the exact grocery item title"
        targetLabel={deleteTarget?.title ?? ''}
        title="Delete Grocery Item"
        onClose={() => setDeleteTarget(null)}
        onConfirm={(payload) => handleDelete(payload)}
      />
    </div>
  )
}
