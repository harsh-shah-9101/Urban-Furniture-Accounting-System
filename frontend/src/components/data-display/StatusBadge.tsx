import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-400',
  confirmed: 'bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300',
  posted: 'bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300',
  billed: 'bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300',
  invoiced: 'bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300',
  partially_paid: 'bg-amber-500/10 text-amber-800 ring-amber-500/20 dark:text-amber-400',
  paid: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400',
  overdue: 'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-400',
  cancelled: 'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-400',
  archived: 'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-400',
  revised: 'bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300',
}

const DOT_STYLES: Record<string, string> = {
  draft: 'bg-rose-600 dark:bg-rose-400',
  confirmed: 'bg-indigo-600 dark:bg-indigo-400',
  posted: 'bg-indigo-600 dark:bg-indigo-400',
  billed: 'bg-indigo-600 dark:bg-indigo-400',
  invoiced: 'bg-indigo-600 dark:bg-indigo-400',
  partially_paid: 'bg-amber-600 dark:bg-amber-400',
  paid: 'bg-emerald-600 dark:bg-emerald-400',
  overdue: 'bg-rose-600 dark:bg-rose-400',
  cancelled: 'bg-rose-600 dark:bg-rose-400',
  archived: 'bg-rose-600 dark:bg-rose-400',
  revised: 'bg-violet-600 dark:bg-violet-400',
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
