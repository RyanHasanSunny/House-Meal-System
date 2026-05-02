import type { LucideIcon } from 'lucide-react'
import { Card } from './Card'

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = 'brand',
}: {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: 'brand' | 'accent' | 'neutral'
}) {
  const accentMap = {
    brand: 'bg-brand-100 text-brand-700',
    accent: 'bg-accent-100 text-[#9a5d1d]',
    neutral: 'bg-stone-100 text-stone-700',
  }

  return (
    <Card className="relative overflow-hidden p-4 sm:p-5">
      <div className="absolute right-0 top-0 h-12 w-12 rounded-full bg-brand-50 blur-2xl" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</p>
          <p className="mt-2 text-xl font-bold text-ink-950 sm:text-2xl">{value}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${accentMap[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </Card>
  )
}
