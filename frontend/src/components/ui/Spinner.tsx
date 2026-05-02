export function Spinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-700" />
      <p className="text-sm font-medium text-stone-600">{label}</p>
    </div>
  )
}
