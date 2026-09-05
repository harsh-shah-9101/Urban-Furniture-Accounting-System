import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground ring-border',
  confirmed: 'bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300',
  posted: 'bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300',
  billed: 'bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300',
  invoiced: 'bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300',
  partially_paid: 'bg-amber-500/10 text-amber-800 ring-amber-500/20 dark:text-amber-400',
  paid: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400',
  overdue: 'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-400',
  cancelled: 'bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-400',
  archived: 'bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-400',
}

const DOT_STYLES: Record<string, string> = {
  draft: 'bg-muted-foreground',
  confirmed: 'bg-indigo-600 dark:bg-indigo-400',
  posted: 'bg-indigo-600 dark:bg-indigo-400',
  billed: 'bg-indigo-600 dark:bg-indigo-400',
  invoiced: 'bg-indigo-600 dark:bg-indigo-400',
  partially_paid: 'bg-amber-600 dark:bg-amber-400',
  paid: 'bg-emerald-600 dark:bg-emerald-400',
  overdue: 'bg-rose-600 dark:bg-rose-400',
  cancelled: 'bg-slate-500',
  archived: 'bg-slate-500',
}

const STATUS_LABELS: Record<string, string> = {
  partially_paid: 'Partially Paid',
}

function labelFor(status: string): string {
  return STATUS_LABELS[status] ?? status.charAt(0).toUpperCase() + status.slice(1)
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn('gap-1.5 border-transparent font-medium ring-1 ring-inset', STATUS_STYLES[status])}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', DOT_STYLES[status])} />
      {labelFor(status)}
    </Badge>
  )
}
