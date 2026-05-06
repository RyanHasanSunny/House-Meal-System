import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-ink-950 text-white shadow-[0_14px_32px_-18px_rgba(21,21,22,0.55)] hover:bg-ink-800',
  secondary:
    'bg-brand-700 text-white shadow-[0_14px_28px_-18px_rgba(65,72,51,0.5)] hover:bg-brand-500',
  ghost:
    'border border-stone-200 bg-white text-ink-950 hover:border-brand-300 hover:bg-brand-50',
  danger:
    'bg-danger-500 text-white shadow-[0_14px_28px_-18px_rgba(200,88,67,0.5)] hover:bg-[#b84b38]',
}

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}
