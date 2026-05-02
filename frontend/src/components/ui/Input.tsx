import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('text-input', props.className)} {...props} />
}
