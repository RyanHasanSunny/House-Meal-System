import type { LucideIcon } from 'lucide-react'
import { Card } from './Card'

export function EmptyState({
  icon: Icon,
  title,
  copy,
}: {
  icon: LucideIcon
  title: string
  copy?: string
}) {
  return (
    <Card className="border-dashed text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      {copy ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-600">{copy}</p> : null}
    </Card>
  )
}
