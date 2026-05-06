import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from './Button'
import { Input } from './Input'
import { cn } from '../../lib/cn'

export interface TypedDeletePayload {
  confirmation_text: string
}

export function TypedDeleteModal({
  isOpen,
  title,
  targetLabel,
  targetFieldLabel,
  targetDescription,
  submitLabel,
  submittingLabel,
  isSubmitting,
  error,
  onClose,
  onConfirm,
}: {
  isOpen: boolean
  title: string
  targetLabel: string
  targetFieldLabel: string
  targetDescription?: string
  submitLabel: string
  submittingLabel?: string
  isSubmitting?: boolean
  error?: string
  onClose: () => void
  onConfirm: (payload: TypedDeletePayload) => void | Promise<void>
}) {
  const [confirmationText, setConfirmationText] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setConfirmationText('')
    }
  }, [isOpen, targetLabel])

  const isValid = confirmationText.trim() === targetLabel

  async function handleConfirm() {
    if (!isValid || isSubmitting) {
      return
    }

    await onConfirm({
      confirmation_text: confirmationText.trim(),
    })
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/55 px-4 transition',
        isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <div className="w-full max-w-lg rounded-md bg-white p-3.5 shadow-[0_30px_80px_-30px_rgba(21,21,22,0.55)] sm:p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-danger-100 p-3 text-danger-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="mt-2 text-2xl font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                This action is permanent. Type the exact confirmation text shown below to continue.
              </p>
            </div>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-700">
            {targetDescription ?? targetLabel}
          </div>

          <div>
            <label className="field-label">{targetFieldLabel}</label>
            <Input value={confirmationText} onChange={(event) => setConfirmationText(event.target.value)} />
          </div>

          {error ? (
            <div className="rounded-md border border-danger-100 bg-danger-100/60 px-3 py-2.5 text-sm font-medium whitespace-pre-line text-danger-500">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={!isValid || isSubmitting} type="button" variant="danger" onClick={() => void handleConfirm()}>
              {isSubmitting ? submittingLabel ?? 'Deleting...' : submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
