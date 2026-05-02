import { cn } from '../../lib/cn'

const badgeVariants = {
  neutral: 'bg-stone-100 text-stone-700',
  brand: 'bg-brand-100 text-brand-700',
  accent: 'bg-accent-100 text-[#9a5d1d]',
  danger: 'bg-danger-100 text-danger-500',
}

export function Badge({
  children,
  variant = 'neutral',
}: {
  children: React.ReactNode
  variant?: keyof typeof badgeVariants
}) {
  return (
    <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]', badgeVariants[variant])}>
      {children}
    </span>
  )
}
