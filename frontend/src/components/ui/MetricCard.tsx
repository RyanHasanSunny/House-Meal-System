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
    <Card className="relative overflow-hidden">
      <div className="absolute right-0 top-0 h-16 w-16 rounded-full bg-brand-50 blur-2xl" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</p>
          <p className="mt-3 text-3xl font-bold text-ink-950">{value}</p>
        </div>
        <div className={`rounded-2xl p-3 ${accentMap[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}
