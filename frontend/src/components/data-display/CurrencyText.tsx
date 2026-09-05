import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'

export function CurrencyText({ amount, className }: { amount: number; className?: string }) {
  return <span className={cn('tabular-nums', className)}>{formatCurrency(amount)}</span>
}
