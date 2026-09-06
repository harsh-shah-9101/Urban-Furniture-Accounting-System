import { useMemo } from 'react'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ReportLayout } from '@/components/layout/ReportLayout'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/formatters'
import { useBudgets } from '@/features/budgets/budgets/hooks'
import { useAnalyticAccounts } from '@/features/budgets/analytic-accounts/hooks'

export function BudgetReportPage() {
  const { data: budgets, isLoading, isError } = useBudgets()
  const { data: analyticAccounts } = useAnalyticAccounts()

  const totals = useMemo(
    () =>
      (budgets ?? []).reduce(
        (acc, budget) => ({
          budgetAmount: acc.budgetAmount + budget.budgetAmount,
          spentAmount: acc.spentAmount + budget.spentAmount,
          remainingAmount: acc.remainingAmount + budget.remainingAmount,
        }),
        { budgetAmount: 0, spentAmount: 0, remainingAmount: 0 },
      ),
    [budgets],
  )

  const accountName = (id: number | null) =>
    analyticAccounts?.find((a) => a.id === id)?.name ?? (id !== null ? `Account ${id}` : '—')

  return (
    <ReportLayout title="Budget vs Actual" subtitle="Planned budgets against real spend, by analytic account">
      {isLoading && <LoadingState rows={3} />}
      {isError && <ErrorState message="Failed to load budgets." />}

      {budgets && budgets.length === 0 && (
        <div className="py-12">
          <EmptyState title="No budgets yet" description="Create a budget to see it broken down here." />
        </div>
      )}

      {budgets && budgets.length > 0 && (
        <div className="mx-auto max-w-4xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Budget</TableHead>
                <TableHead>Analytic Account</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.map((budget) => {
                const isOverBudget = budget.remainingAmount < 0
                return (
                  <TableRow key={budget.id}>
                    <TableCell>{budget.name}</TableCell>
                    <TableCell>{accountName(budget.analyticAccountId)}</TableCell>
                    <TableCell>
                      {budget.startDate && budget.endDate
                        ? `${formatDate(budget.startDate)} – ${formatDate(budget.endDate)}`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyText amount={budget.budgetAmount} />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyText amount={budget.spentAmount} />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyText
                        amount={budget.remainingAmount}
                        className={cn(isOverBudget && 'text-red-600 dark:text-red-400 print:text-black font-medium')}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <div className="mt-3 flex flex-col gap-1 border-t-2 border-border pt-3 text-sm">
            <div className="flex items-center justify-between font-semibold">
              <span>Total Budget</span>
              <CurrencyText amount={totals.budgetAmount} />
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Total Spent</span>
              <CurrencyText amount={totals.spentAmount} />
            </div>
            <div className="flex items-center justify-between text-base font-bold">
              <span>Total Remaining</span>
              <CurrencyText
                amount={totals.remainingAmount}
                className={cn(totals.remainingAmount < 0 && 'text-red-600 dark:text-red-400 print:text-black')}
              />
            </div>
          </div>
        </div>
      )}
    </ReportLayout>
  )
}
