export function SectionHeading({
  title,
  copy,
  action,
}: {
  title: string
  copy?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="section-title">{title}</h1>
        {copy ? <p className="section-copy mt-2 max-w-2xl">{copy}</p> : null}
      </div>
      {action}
    </div>
  )
}
