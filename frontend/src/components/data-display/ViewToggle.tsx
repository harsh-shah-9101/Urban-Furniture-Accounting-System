import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DataViewMode = 'list' | 'kanban'

const OPTIONS: { value: DataViewMode; label: string; icon: typeof List }[] = [
  { value: 'list', label: 'List view', icon: List },
  { value: 'kanban', label: 'Kanban view', icon: LayoutGrid },
]

export function ViewToggle({
  value,
  onChange,
}: {
  value: DataViewMode
  onChange: (value: DataViewMode) => void
}) {
  return (
    <div className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5">
      {OPTIONS.map(({ value: option, label, icon: Icon }) => (
        <button
          key={option}
          type="button"
          aria-label={label}
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
            value === option
              ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  )
}
