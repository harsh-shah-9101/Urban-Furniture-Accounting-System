import { useMemo } from 'react'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ReportLayout } from '@/components/layout/ReportLayout'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/formatters'
import { useBudgets } from '@/features/budgets/budgets/hooks'
import { useAnalyticAccounts } from '@/features/budgets/analytic-accounts/hooks'
import { useCustomerInvoices } from '@/features/sales/hooks'
import { useVendorBills } from '@/features/purchases/hooks'
import { computeAchieved } from '@/features/budgets/budgets/achieved'

export function BudgetReportPage() {
  const { data: budgets, isLoading, isError } = useBudgets()
  const { data: analyticAccounts } = useAnalyticAccounts()
  const { data: invoices } = useCustomerInvoices()
  const { data: bills } = useVendorBills()

  const rows = useMemo(
    () =>
      (budgets ?? [])
        .filter((budget) => budget.status !== 'draft')
        .flatMap((budget) =>
          budget.lines.map((line) => {
            const accountType = analyticAccounts?.find((account) => account.id === line.analyticAccountId)?.type
            const { total: achievedAmount } = computeAchieved({
              analyticAccountId: line.analyticAccountId,
              accountType,
              startDate: budget.startDate,
              endDate: budget.endDate,
              invoices,
              bills,
            })
            return {
              budgetId: budget.id,
              budgetName: budget.name,
              startDate: budget.startDate,
              endDate: budget.endDate,
              status: budget.status,
              analyticAccountId: line.analyticAccountId,
              committedAmount: line.committedAmount,
              achievedAmount,
              remainingAmount: line.committedAmount - achievedAmount,
            }
          }),
        ),
    [budgets, analyticAccounts, invoices, bills],
  )

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          committedAmount: acc.committedAmount + row.committedAmount,
          achievedAmount: acc.achievedAmount + row.achievedAmount,
          remainingAmount: acc.remainingAmount + row.remainingAmount,
        }),
        { committedAmount: 0, achievedAmount: 0, remainingAmount: 0 },
      ),
    [rows],
  )

  const accountName = (id: number) => analyticAccounts?.find((a) => a.id === id)?.name ?? `Account ${id}`

  return (
    <ReportLayout title="Budget vs Actual" subtitle="Committed budgets against achieved amounts, by analytic account">
      {isLoading && <LoadingState rows={3} />}
      {isError && <ErrorState message="Failed to load budgets." />}

      {budgets && rows.length === 0 && (
        <div className="py-12">
          <EmptyState
            title="No confirmed budgets yet"
            description="Confirm a budget to see committed vs achieved amounts here."
          />
        </div>
      )}

      {budgets && rows.length > 0 && (
        <div className="mx-auto max-w-4xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Budget</TableHead>
                <TableHead>Analytic Account</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Committed</TableHead>
                <TableHead className="text-right">Achieved</TableHead>
                <TableHead className="text-right">Amount To Achieve</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => {
                const isOverBudget = row.remainingAmount < 0
                return (
                  <TableRow key={`${row.budgetId}-${index}`}>
                    <TableCell>{row.budgetName}</TableCell>
                    <TableCell>{accountName(row.analyticAccountId)}</TableCell>
                    <TableCell>
                      {row.startDate && row.endDate
                        ? `${formatDate(row.startDate)} – ${formatDate(row.endDate)}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyText amount={row.committedAmount} />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyText amount={row.achievedAmount} />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyText
                        amount={row.remainingAmount}
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
              <span>Total Committed</span>
              <CurrencyText amount={totals.committedAmount} />
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Total Achieved</span>
              <CurrencyText amount={totals.achievedAmount} />
            </div>
            <div className="flex items-center justify-between text-base font-bold">
              <span>Total Remaining To Achieve</span>
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
