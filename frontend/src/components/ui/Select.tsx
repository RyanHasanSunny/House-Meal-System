import type { SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('text-input', props.className)} {...props} />
}
