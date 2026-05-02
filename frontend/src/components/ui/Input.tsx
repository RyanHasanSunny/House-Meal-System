import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, type, ...inputProps } = props
  const [showPassword, setShowPassword] = useState(false)

  if (type !== 'password') {
    return <input className={cn('text-input', className)} type={type} {...inputProps} />
  }

  return (
    <div className="relative">
      <input
        className={cn('text-input pr-12', className)}
        type={showPassword ? 'text' : 'password'}
        {...inputProps}
      />
      <button
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-3 flex items-center text-stone-400 transition hover:text-stone-700 focus:outline-none"
        onClick={() => setShowPassword((current) => !current)}
        type="button"
      >
        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  )
}
