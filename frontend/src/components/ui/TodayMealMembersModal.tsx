import { Soup, X } from 'lucide-react'
import { Button } from './Button'
import { cn } from '../../lib/cn'

type TodayMealMember = {
  id: number
  name: string
  username: string
  guest_meals: number
  total_meals: number
}

export function TodayMealMembersModal({
  isOpen,
  title,
  members,
  onClose,
}: {
  isOpen: boolean
  title: string
  members: TodayMealMember[]
  onClose: () => void
}) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-[70] flex items-end justify-center bg-ink-950/55 p-2 transition sm:items-center sm:p-4',
        isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
      onClick={onClose}
    >
      <div
        className="max-h-[calc(100dvh-1rem)] w-full max-w-xl overflow-y-auto rounded-md bg-white p-3 shadow-[0_30px_80px_-30px_rgba(21,21,22,0.55)] sm:max-h-[calc(100vh-2rem)] sm:p-3.5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="rounded-md bg-brand-100 p-2.5 text-brand-700">
                <Soup className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold text-ink-950 sm:text-2xl">{title}</h2>
                <p className="mt-1 text-sm text-stone-500">
                  {members.length} member{members.length === 1 ? '' : 's'} counted
                </p>
              </div>
            </div>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3 space-y-2.5">
          {members.length ? (
            members.map((member) => (
              <div key={member.id} className="rounded-md border border-stone-200 bg-stone-50/80 px-3 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-950">{member.name}</p>
                    <p className="text-sm text-stone-500">@{member.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-ink-950">
                      {member.total_meals} meal{member.total_meals === 1 ? '' : 's'}
                    </p>
                    {member.guest_meals > 0 ? (
                      <p className="text-xs text-stone-500">
                        +{member.guest_meals} guest meal{member.guest_meals === 1 ? '' : 's'}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-md border border-stone-200 bg-stone-50 px-3 py-3 text-sm text-stone-500">
              No members counted for this meal yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
