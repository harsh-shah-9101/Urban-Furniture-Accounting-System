import { StatusBadge } from '@/components/data-display/StatusBadge'
import { EmptyState } from '@/components/feedback/EmptyState'
import { formatDate } from '@/lib/formatters'
import { budgetCommittedTotal, type Budget } from '@/types/budgets'
import { computeBudgetAchievedTotal } from '../achieved'
import { BudgetPieMini } from './BudgetPieMini'
import type { AnalyticAccount } from '@/types/accounting'
import type { CustomerInvoice } from '@/types/sales'
import type { VendorBill } from '@/types/purchases'

function BudgetCard({
  budget,
  analyticAccounts,
  invoices,
  bills,
  onClick,
}: {
  budget: Budget
  analyticAccounts: AnalyticAccount[] | undefined
  invoices: CustomerInvoice[] | undefined
  bills: VendorBill[] | undefined
  onClick: () => void
}) {
  const committed = budget.status === 'draft' ? 0 : budgetCommittedTotal(budget)
  const achieved =
    budget.status === 'draft' ? 0 : computeBudgetAchievedTotal(budget, analyticAccounts, invoices, bills)

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-5 text-left transition-all duration-200 hover:border-primary/30 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:hover:shadow-primary/5"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="truncate text-sm font-medium leading-none text-foreground">{budget.name}</h3>
        <BudgetPieMini committed={committed} achieved={achieved} />
      </div>

      <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
        <div>Start Date {budget.startDate ? formatDate(budget.startDate) : '—'}</div>
        <div>End Date {budget.endDate ? formatDate(budget.endDate) : '—'}</div>
      </div>

      <StatusBadge status={budget.status} />
    </button>
  )
}

export function BudgetKanbanView({
  budgets,
  analyticAccounts,
  invoices,
  bills,
  onSelect,
}: {
  budgets: Budget[]
  analyticAccounts: AnalyticAccount[] | undefined
  invoices: CustomerInvoice[] | undefined
  bills: VendorBill[] | undefined
  onSelect: (budget: Budget) => void
}) {
  if (budgets.length === 0) {
    return <EmptyState title="No budgets found" description="Try a different search, or create your first budget." />
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {budgets.map((budget) => (
        <BudgetCard
          key={budget.id}
          budget={budget}
          analyticAccounts={analyticAccounts}
          invoices={invoices}
          bills={bills}
          onClick={() => onSelect(budget)}
        />
      ))}
    </div>
  )
}
