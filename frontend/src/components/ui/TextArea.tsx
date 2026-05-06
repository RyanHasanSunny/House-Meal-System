import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('text-input min-h-24 resize-y', props.className)} {...props} />
}
