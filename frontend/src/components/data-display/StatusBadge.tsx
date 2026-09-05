import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  posted: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  billed: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  invoiced: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  partially_paid: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  paid: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  cancelled: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  archived: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

const STATUS_LABELS: Record<string, string> = {
  partially_paid: 'Partially Paid',
}

function labelFor(status: string): string {
  return STATUS_LABELS[status] ?? status.charAt(0).toUpperCase() + status.slice(1)
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn('border-transparent', STATUS_STYLES[status])}>
      {labelFor(status)}
    </Badge>
  )
}
