import { BanknoteArrowDown, Calculator, ReceiptText, ShoppingBasket, Trash2, Users2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
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
import { formatCurrency, formatDate, todayValue } from '../lib/format'
import { useAuth } from '../providers/AuthProvider'
import type { MonthlyFinanceSummary } from '../types'

const initialPaymentForm = {
  user_id: 0,
  amount: 0,
  paid_on: todayValue(),
  notes: '',
}

export function FinanceSummaryPage() {
  const { user } = useAuth()
  const [selectedMonth, setSelectedMonth] = useState(todayValue().slice(0, 7))
  const [summary, setSummary] = useState<MonthlyFinanceSummary | null>(null)
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MonthlyFinanceSummary['payments'][number] | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const canManagePayments = user?.role === 'super_admin' || user?.role === 'admin'

  async function loadSummary(month: string) {
    const response = await api.get<{ data: MonthlyFinanceSummary }>('/finance-summary/monthly', {
      params: { month },
    })

    setSummary(response.data.data)
    setPaymentForm((current) => ({
      ...current,
      user_id: current.user_id || response.data.data.eligible_members[0]?.id || 0,
    }))
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        await loadSummary(selectedMonth)
      } catch (loadError) {
        setError(getApiErrorMessage(loadError))
      } finally {
        setIsLoading(false)
      }
    }

    void bootstrap()
  }, [])

  async function handleMonthChange(month: string) {
    setSelectedMonth(month)
    setError('')
    setMessage('')

    try {
      await loadSummary(month)
    } catch (loadError) {
      setError(getApiErrorMessage(loadError))
    }
  }

  async function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)

    try {
      await api.post('/member-payments', paymentForm)
      await loadSummary(selectedMonth)
      setPaymentForm((current) => ({
        ...initialPaymentForm,
        user_id: current.user_id,
        paid_on: current.paid_on,
      }))
      setMessage('Payment recorded successfully.')
    } catch (submitError) {
      setError(getApiErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  function paymentDeleteTargetLabel(payment: MonthlyFinanceSummary['payments'][number]) {
    return payment.user ? `@${payment.user.username}` : `payment-${payment.id}`
  }

  function openDeleteModal(payment: MonthlyFinanceSummary['payments'][number]) {
    setError('')
    setMessage('')
    setDeleteTarget(payment)
  }

  async function handleDeletePayment(payload: { confirmation_text: string }) {
    if (!deleteTarget) {
      return
    }

    setError('')
    setMessage('')
    setIsDeleting(true)

    try {
      await api.delete(`/member-payments/${deleteTarget.id}`, { data: payload })
      await loadSummary(selectedMonth)
      setDeleteTarget(null)
      setMessage('Payment deleted successfully.')
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError))
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="panel flex min-h-[320px] items-center justify-center">
        <Spinner label="Loading monthly summary..." />
      </div>
    )
  }

  if (!summary) {
    return <EmptyState icon={ReceiptText} title="Summary unavailable" copy={error || 'Could not load monthly finance data.'} />
  }

  const countedThroughLabel = summary.counting.counted_through ? formatDate(summary.counting.counted_through) : 'Not started yet'
  const mealsTotalLabel = summary.counting.status === 'completed' ? 'Total Meals' : 'Counted Meals'

  return (
    <div className="space-y-3">
      <SectionHeading title="Monthly Financial Summary" />

      <Card>
        <div className="grid gap-3 md:grid-cols-[240px_1fr] md:items-end">
          <div>
            <label className="field-label">Summary Month</label>
            <Input type="month" value={selectedMonth} onChange={(event) => void handleMonthChange(event.target.value)} />
          </div>
          <div className="rounded-md border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm text-stone-700">
            {formatDate(summary.period.start_date)} to {formatDate(summary.period.end_date)}
          </div>
        </div>

        <div className="mt-4 rounded-md border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-600">
          {summary.counting.status === 'not_started'
            ? 'This month has not started yet, so no meals are counted.'
            : summary.counting.status === 'completed'
              ? `This summary includes the full month through ${countedThroughLabel}.`
              : `Meals are counted through ${countedThroughLabel}. Future dates are excluded until those days start.`}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard icon={ReceiptText} label="Total Gross" value={formatCurrency(summary.totals.total_gross)} />
        <MetricCard icon={Users2} label="Per Head Expense" tone="neutral" value={formatCurrency(summary.totals.per_head_expense)} />
        <MetricCard icon={Calculator} label="Meal Rate" tone="accent" value={formatCurrency(summary.totals.meal_rate)} />
        <MetricCard icon={BanknoteArrowDown} label="Total Due" value={formatCurrency(summary.totals.total_due)} />
      </div>

      {(error || message) && !canManagePayments ? (
        <div className="space-y-3">
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
        </div>
      ) : null}

      <div className="grid gap-3 xl:grid-cols-[0.88fr_1.12fr]">
        {canManagePayments ? (
          <Card>
            <div className="mb-3">
              <h2 className="text-2xl font-bold">Record Payment</h2>
            </div>

            <form className="grid gap-3 md:grid-cols-2" onSubmit={handlePaymentSubmit}>
              <div className="md:col-span-2">
                <label className="field-label">Member</label>
                <Select value={paymentForm.user_id} onChange={(event) => setPaymentForm((current) => ({ ...current, user_id: Number(event.target.value) }))}>
                  {summary.eligible_members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role_label})
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="field-label">Amount Paid</label>
                <Input
                  min="0"
                  step="0.01"
                  type="number"
                  value={paymentForm.amount}
                  onChange={(event) => setPaymentForm((current) => ({ ...current, amount: Number(event.target.value) }))}
                />
              </div>
              <div>
                <label className="field-label">Paid On</label>
                <Input type="date" value={paymentForm.paid_on} onChange={(event) => setPaymentForm((current) => ({ ...current, paid_on: event.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="field-label">Notes</label>
                <TextArea value={paymentForm.notes} onChange={(event) => setPaymentForm((current) => ({ ...current, notes: event.target.value }))} />
              </div>

              {error ? (
                <div className="md:col-span-2 rounded-md border border-danger-100 bg-danger-100/60 px-3 py-2.5 text-sm font-medium whitespace-pre-line text-danger-500">
                  {error}
                </div>
              ) : null}

              {message ? (
                <div className="md:col-span-2 rounded-md border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm font-medium text-brand-700">
                  {message}
                </div>
              ) : null}

              <div className="md:col-span-2">
                <Button className="w-full sm:w-auto" disabled={isSubmitting} type="submit">
                  {isSubmitting ? 'Saving...' : 'Record Payment'}
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">Monthly Summary</h2>
                <p className="mt-2 text-sm text-stone-500">Members can view all totals, balances, and payment history here.</p>
              </div>
              <Badge variant="neutral">Read only</Badge>
            </div>
          </Card>
        )}

        <Card className="self-start overflow-hidden p-0">
          <div className="flex flex-col gap-2.5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <h2 className="text-2xl font-bold">Month Totals</h2>
            <Badge variant={summary.counting.status === 'completed' ? 'brand' : 'accent'}>
              {summary.counting.counted_days} of {summary.counting.total_days} days
            </Badge>
          </div>

          <div className="grid border-t border-stone-200 bg-white md:grid-cols-[170px_1fr]">
            <div className="bg-ink-950 px-4 py-4 text-white sm:px-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">{mealsTotalLabel}</p>
              <p className="mt-2 text-4xl font-bold leading-none text-white">{summary.totals.total_meals}</p>
              <p className="mt-2 text-sm leading-5 text-white/65">
                {summary.counting.counted_through ? `Through ${countedThroughLabel}` : 'Plan has not started'}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/50">
                {summary.totals.guest_meals} guest meals
              </p>
            </div>

            <div className="grid grid-cols-2">
              <div className="border-b border-r border-stone-200 px-3.5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Members</p>
                <p className="mt-2 text-2xl font-bold text-ink-950">{summary.totals.total_members}</p>
              </div>
              <div className="border-b border-stone-200 px-3.5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Days</p>
                <p className="mt-2 text-2xl font-bold text-ink-950">
                  {summary.counting.counted_days} / {summary.counting.total_days}
                </p>
              </div>
              <div className="border-r border-stone-200 px-3.5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Paid</p>
                <p className="mt-2 text-2xl font-bold text-brand-700">{formatCurrency(summary.totals.total_paid)}</p>
              </div>
              <div className="px-3.5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Due</p>
                <p className="mt-2 text-2xl font-bold text-danger-500">{formatCurrency(summary.totals.total_due)}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Member Summary</h2>
          </div>
          <Badge variant="brand">{summary.members.length} tracked members</Badge>
        </div>

        <div className="mt-4 overflow-hidden rounded-md border border-stone-200">
          <div className="hidden grid-cols-[1.35fr_repeat(7,0.85fr)] gap-2 bg-stone-100 px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 lg:grid">
            <span>Member</span>
            <span>Meals include Guest</span>
            <span>Guest</span>
            <span>Meal Cost</span>
            <span>Paid</span>
            <span>Need To Pay</span>
            <span>Advance</span>
            <span>Role</span>
          </div>

          <div className="divide-y divide-stone-200 bg-white">
            {summary.members.map((member) => (
              <div key={member.user.id} className="px-3 py-3">
                <div className="lg:hidden">
                  <div>
                    <p className="font-semibold text-ink-950">{member.user.name}</p>
                    <p className="text-sm text-stone-500">@{member.user.username}</p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-md bg-stone-50 px-3 py-2.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Total Meals Include Guest</p>
                      <p className="mt-1 text-lg font-bold text-ink-950">{member.taken_meals}</p>
                    </div>
                    <div className="rounded-md bg-stone-50 px-3 py-2.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Guest Meals</p>
                      <p className="mt-1 text-lg font-bold text-ink-950">{member.guest_meals}</p>
                    </div>
                    <div className="rounded-md bg-stone-50 px-3 py-2.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Meal Cost</p>
                      <p className="mt-1 text-lg font-bold text-ink-950">{formatCurrency(member.payable_amount)}</p>
                    </div>
                    <div className="rounded-md bg-stone-50 px-3 py-2.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Paid</p>
                      <p className="mt-1 text-lg font-bold text-ink-950">{formatCurrency(member.paid_amount)}</p>
                    </div>
                    <div className="rounded-md bg-stone-50 px-3 py-2.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Need To Pay</p>
                      <p className="mt-1 text-lg font-bold text-danger-500">{formatCurrency(member.due_amount)}</p>
                      {member.advance_used_amount > 0 ? (
                        <p className="mt-1 text-xs text-stone-500">Advance used {formatCurrency(member.advance_used_amount)}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3">
                    <div className="rounded-md bg-brand-50 px-3 py-2.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Advance</p>
                      <p className="mt-1 text-xl font-bold text-brand-700">{formatCurrency(member.advance_amount)}</p>
                      {member.carried_advance_amount > 0 ? (
                        <p className="mt-1 text-xs text-stone-500">Brought {formatCurrency(member.carried_advance_amount)}</p>
                      ) : null}
                    </div>
                    <div className="rounded-md bg-stone-50 px-3 py-2.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Role</p>
                      <p className="mt-1 font-semibold text-ink-950">{member.user.role_label}</p>
                    </div>
                  </div>
                </div>

                <div className="hidden gap-3 lg:grid lg:grid-cols-[1.35fr_repeat(7,0.85fr)] lg:items-center">
                  <div>
                    <p className="font-semibold text-ink-950">{member.user.name}</p>
                    <p className="text-sm text-stone-500">@{member.user.username}</p>
                  </div>
                  <p className="text-sm font-medium text-stone-700 lg:text-base">{member.taken_meals}</p>
                  <p className="text-sm font-medium text-stone-700 lg:text-base">{member.guest_meals}</p>
                  <p className="text-sm font-medium text-stone-700 lg:text-base">{formatCurrency(member.payable_amount)}</p>
                  <p className="text-sm font-medium text-stone-700 lg:text-base">{formatCurrency(member.paid_amount)}</p>
                  <div>
                    <p className="text-sm font-bold text-danger-500 lg:text-base">{formatCurrency(member.due_amount)}</p>
                    {member.advance_used_amount > 0 ? (
                      <p className="text-xs text-stone-500">Advance used {formatCurrency(member.advance_used_amount)}</p>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-700 lg:text-base">{formatCurrency(member.advance_amount)}</p>
                    {member.carried_advance_amount > 0 ? (
                      <p className="text-xs text-stone-500">Brought {formatCurrency(member.carried_advance_amount)}</p>
                    ) : null}
                  </div>
                  <p className="text-sm text-stone-600 lg:text-base">{member.user.role_label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Groceries This Month</h2>
          </div>
          <Badge variant="brand">{summary.groceries.length} items</Badge>
        </div>

        {summary.groceries.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {summary.groceries.map((item) => (
              <div key={item.id} className="rounded-md border border-stone-200 bg-stone-50 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink-950">{item.title}</p>
                    <p className="mt-1 text-sm text-stone-500">
                      {item.quantity} {item.unit ?? 'unit'}
                      {item.category ? ` | ${item.category}` : ''}
                    </p>
                    <p className="mt-1 text-sm text-stone-500">{formatDate(item.purchased_on)}</p>
                    <p className="mt-1 text-sm text-stone-500">
                      Added by {item.added_by?.name ?? 'Unknown'}
                    </p>
                    {item.notes ? <p className="mt-3 text-sm leading-6 text-stone-600">{item.notes}</p> : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="accent">{formatCurrency(item.price)}</Badge>
                    {item.member ? <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500">@{item.member.username}</p> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : <EmptyState icon={ShoppingBasket} title="No groceries added" />}
      </Card>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Payments This Month</h2>
          </div>
          <Badge variant="accent">{formatCurrency(summary.totals.total_paid)}</Badge>
        </div>

        {summary.payments.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {summary.payments.map((payment) => (
              <div key={payment.id} className="rounded-md border border-stone-200 bg-stone-50 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink-950">{payment.user?.name ?? 'Unknown member'}</p>
                    <p className="mt-1 text-sm text-stone-500">{formatDate(payment.paid_on)}</p>
                    <p className="mt-1 text-sm text-stone-500">
                      Recorded by {payment.recorded_by?.name ?? 'Unknown'}
                    </p>
                    {payment.notes ? <p className="mt-3 text-sm leading-6 text-stone-600">{payment.notes}</p> : null}
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <Badge variant="brand">{formatCurrency(payment.amount)}</Badge>
                    {canManagePayments ? (
                      <Button variant="ghost" onClick={() => openDeleteModal(payment)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : <EmptyState icon={BanknoteArrowDown} title="No payments recorded" />}
      </Card>

      <TypedDeleteModal
        error={error}
        isOpen={deleteTarget !== null}
        isSubmitting={isDeleting}
        submitLabel="Delete Payment"
        targetDescription={
          deleteTarget
            ? `${deleteTarget.user?.name ?? 'Unknown member'} | ${formatCurrency(deleteTarget.amount)} | ${formatDate(deleteTarget.paid_on)}`
            : ''
        }
        targetFieldLabel="Type the member handle shown for this payment"
        targetLabel={deleteTarget ? paymentDeleteTargetLabel(deleteTarget) : ''}
        title="Delete Payment"
        onClose={() => setDeleteTarget(null)}
        onConfirm={(payload) => handleDeletePayment(payload)}
      />
    </div>
  )
}
