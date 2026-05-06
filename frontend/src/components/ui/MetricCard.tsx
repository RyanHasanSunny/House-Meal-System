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
    <Card className="relative overflow-hidden p-3.5 sm:p-3.5">
      <div className="flex items-start justify-between gap-2.5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">{label}</p>
          <p className="mt-1.5 text-lg font-bold text-ink-950 sm:text-xl">{value}</p>
        </div>
        <div className={`rounded-md p-2 ${accentMap[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </Card>
  )
}
