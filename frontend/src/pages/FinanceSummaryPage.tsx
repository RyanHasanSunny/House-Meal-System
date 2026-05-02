import { BanknoteArrowDown, Calculator, ReceiptText, Trash2, Users2 } from 'lucide-react'
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
import { formatCurrency, formatDate, todayValue } from '../lib/format'
import type { MonthlyFinanceSummary } from '../types'

const initialPaymentForm = {
  user_id: 0,
  amount: 0,
  paid_on: todayValue(),
  notes: '',
}

export function FinanceSummaryPage() {
  const [selectedMonth, setSelectedMonth] = useState(todayValue().slice(0, 7))
  const [summary, setSummary] = useState<MonthlyFinanceSummary | null>(null)
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

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

  async function handleDeletePayment(paymentId: number) {
    setError('')
    setMessage('')

    try {
      await api.delete(`/member-payments/${paymentId}`)
      await loadSummary(selectedMonth)
      setMessage('Payment deleted successfully.')
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError))
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

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Monthly Financial Summary"
        copy="This summary combines all plans in the selected month and shows total gross, per head expense, meal rate, each member's payable amount, payments made, and remaining due."
      />

      <Card>
        <div className="grid gap-4 md:grid-cols-[240px_1fr] md:items-end">
          <div>
            <label className="field-label">Summary Month</label>
            <Input type="month" value={selectedMonth} onChange={(event) => void handleMonthChange(event.target.value)} />
          </div>
          <div className="rounded-[22px] border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-stone-700">
            {formatDate(summary.period.start_date)} to {formatDate(summary.period.end_date)}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={ReceiptText} label="Total Gross" value={formatCurrency(summary.totals.total_gross)} />
        <MetricCard icon={Users2} label="Per Head Expense" tone="neutral" value={formatCurrency(summary.totals.per_head_expense)} />
        <MetricCard icon={Calculator} label="Meal Rate" tone="accent" value={formatCurrency(summary.totals.meal_rate)} />
        <MetricCard icon={BanknoteArrowDown} label="Total Due" value={formatCurrency(summary.totals.total_due)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <Card>
          <div className="mb-5">
            <h2 className="text-2xl font-bold">Record Payment</h2>
            <p className="mt-2 text-sm text-stone-600">Log how much an individual member paid in this month.</p>
          </div>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handlePaymentSubmit}>
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
                {isSubmitting ? 'Saving...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold">Month Totals</h2>
          <p className="mt-2 text-sm text-stone-600">All plan data in the selected month rolls up into these numbers.</p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="panel-soft p-4">
              <p className="text-sm text-stone-500">Total Members</p>
              <p className="mt-2 text-2xl font-bold">{summary.totals.total_members}</p>
            </div>
            <div className="panel-soft p-4">
              <p className="text-sm text-stone-500">Total Meals</p>
              <p className="mt-2 text-2xl font-bold">{summary.totals.total_meals}</p>
            </div>
            <div className="panel-soft p-4">
              <p className="text-sm text-stone-500">Total Paid</p>
              <p className="mt-2 text-2xl font-bold">{formatCurrency(summary.totals.total_paid)}</p>
            </div>
            <div className="panel-soft p-4">
              <p className="text-sm text-stone-500">Total Due</p>
              <p className="mt-2 text-2xl font-bold">{formatCurrency(summary.totals.total_due)}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Member Summary</h2>
            <p className="mt-2 text-sm text-stone-600">Per person meal cost is calculated as meals taken multiplied by the monthly meal rate.</p>
          </div>
          <Badge variant="brand">{summary.members.length} tracked members</Badge>
        </div>

        <div className="mt-5 overflow-hidden rounded-[24px] border border-stone-200">
          <div className="hidden grid-cols-[1.4fr_repeat(6,0.9fr)] gap-2 bg-stone-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 lg:grid">
            <span>Member</span>
            <span>Meals</span>
            <span>Meal Cost</span>
            <span>Paid</span>
            <span>Need To Pay</span>
            <span>Advance</span>
            <span>Role</span>
          </div>

          <div className="divide-y divide-stone-200 bg-white">
            {summary.members.map((member) => (
              <div key={member.user.id} className="grid gap-3 px-4 py-4 lg:grid-cols-[1.4fr_repeat(6,0.9fr)] lg:items-center">
                <div>
                  <p className="font-semibold text-ink-950">{member.user.name}</p>
                  <p className="text-sm text-stone-500">@{member.user.username}</p>
                </div>
                <p className="text-sm font-medium text-stone-700 lg:text-base">{member.taken_meals}</p>
                <p className="text-sm font-medium text-stone-700 lg:text-base">{formatCurrency(member.payable_amount)}</p>
                <p className="text-sm font-medium text-stone-700 lg:text-base">{formatCurrency(member.paid_amount)}</p>
                <p className="text-sm font-bold text-danger-500 lg:text-base">{formatCurrency(member.due_amount)}</p>
                <p className="text-sm font-medium text-brand-700 lg:text-base">{formatCurrency(member.advance_amount)}</p>
                <p className="text-sm text-stone-600 lg:text-base">{member.user.role_label}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Payments This Month</h2>
            <p className="mt-2 text-sm text-stone-600">All recorded payments are included in the monthly summary above.</p>
          </div>
          <Badge variant="accent">{formatCurrency(summary.totals.total_paid)}</Badge>
        </div>

        {summary.payments.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {summary.payments.map((payment) => (
              <div key={payment.id} className="rounded-[22px] border border-stone-200 bg-stone-50 p-4">
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
                    <Button variant="ghost" onClick={() => void handleDeletePayment(payment.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={BanknoteArrowDown} title="No payments recorded" copy="Add member payments to compare paid amounts against meal-based payable totals." />
        )}
      </Card>
    </div>
  )
}
