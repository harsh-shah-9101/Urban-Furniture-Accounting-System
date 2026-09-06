import { cn } from '@/lib/utils'
import type { BudgetStatus } from '@/types/budgets'

const STEPS: { value: BudgetStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'confirmed', label: 'Confirm' },
  { value: 'revised', label: 'Revised' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function BudgetStatusStepper({ status }: { status: BudgetStatus }) {
  const activeIndex = STEPS.findIndex((step) => step.value === status)

  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-border">
      {STEPS.map((step, index) => (
        <div
          key={step.value}
          className={cn(
            'px-3 py-1.5 text-sm font-medium',
            index > 0 && 'border-l border-border',
            index === activeIndex
              ? 'bg-primary/10 text-primary'
              : 'bg-muted/40 text-muted-foreground',
          )}
        >
          {step.label}
        </div>
      ))}
    </div>
  )
}
