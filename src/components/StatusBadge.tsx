interface StatusBadgeProps {
  confirmedCount: number
  totalCount: number
}

export function StatusBadge({ confirmedCount, totalCount }: StatusBadgeProps) {
  const isComplete = confirmedCount === totalCount
  const isPartial = confirmedCount > 0 && !isComplete

  const styles = isComplete
    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : isPartial
      ? 'bg-amber-100 text-amber-800 border-amber-300'
      : 'bg-slate-100 text-slate-600 border-slate-300'

  const label = isComplete
    ? 'Completado'
    : isPartial
      ? `Parcial (${confirmedCount}/${totalCount})`
      : 'Pendiente'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${styles}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isComplete ? 'bg-emerald-500' : isPartial ? 'bg-amber-500' : 'bg-slate-400'
        }`}
      />
      {label}
    </span>
  )
}
