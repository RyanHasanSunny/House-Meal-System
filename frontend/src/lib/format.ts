export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(value)
}

export function todayValue() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)

  return local.toISOString().slice(0, 10)
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('en-BD', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value))
}

export function isDateActive(startDate: string, endDate: string) {
  const today = new Date().toISOString().slice(0, 10)

  return startDate <= today && endDate >= today
}
