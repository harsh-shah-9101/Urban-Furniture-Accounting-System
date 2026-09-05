import { useMemo, useState } from 'react'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { CurrencyInput } from '@/components/forms/CurrencyInput'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ReportLayout } from '@/components/layout/ReportLayout'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/formatters'
import { useBudgetReport } from '@/features/reports/hooks'
import { useBudgets } from '@/features/budgets/budgets/hooks'
import { useAnalyticAccounts } from '@/features/budgets/analytic-accounts/hooks'
import type { Budget } from '@/types/budgets'
import type { AnalyticAccount } from '@/types/accounting'

function BudgetBreakdownTable({
  title,
  budgets,
  analyticAccounts,
  planned,
  comparisonLabel,
  comparisonValue,
  overIsBad = false,
}: {
  title: string
  budgets: Budget[]
  analyticAccounts: AnalyticAccount[]
  planned: number
  comparisonLabel: string
  comparisonValue: number
  /** For expense-style comparisons, planned exceeding the comparison value is the unfavorable direction. */
  overIsBad?: boolean
}) {
  const variance = planned - comparisonValue
  const isUnfavorable = overIsBad ? variance > 0 : variance < 0

  return (
    <div className="flex-1 mb-8 last:mb-0">
      <h3 className="border-b-2 border-border pb-2 text-lg font-bold uppercase tracking-wide">{title}</h3>
      <div className="mt-2">
        {budgets.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground italic">No budgets in this category.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Budget</TableHead>
                <TableHead>Analytic Account</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Responsible</TableHead>
                <TableHead className="text-right">Planned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.map((budget) => {
                const accountName =
                  analyticAccounts.find((a) => a.id === budget.analyticAccountId)?.name ??
                  `Account ${budget.analyticAccountId}`
                return (
                  <TableRow key={budget.id}>
                    <TableCell>{budget.name}</TableCell>
                    <TableCell>{accountName}</TableCell>
                    <TableCell>
                      {formatDate(budget.periodStart)} – {formatDate(budget.periodEnd)}
                    </TableCell>
                    <TableCell>{budget.responsiblePerson}</TableCell>
                    <TableCell className="text-right">
                      <CurrencyText amount={budget.plannedAmount} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}

        <div className="mt-3 flex flex-col gap-1 border-t-2 border-border pt-3 text-sm">
          <div className="flex items-center justify-between font-semibold">
            <span>Total Planned</span>
            <CurrencyText amount={planned} />
          </div>
          <div className="flex items-center justify-between text-muted-foreground italic">
            <span>{comparisonLabel}</span>
            <CurrencyText amount={comparisonValue} />
          </div>
          <div className="flex items-center justify-between font-bold text-base mt-2">
            <span>Variance</span>
            <CurrencyText amount={variance} className={isUnfavorable ? 'text-red-600 dark:text-red-400 print:text-black' : 'print:text-black'} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function BudgetReportPage() {
  const [targetIncome, setTargetIncome] = useState(100000)
  const [budgetedExpense, setBudgetedExpense] = useState(60000)
  const { data, isLoading, isError } = useBudgetReport({ targetIncome, budgetedExpense })
  const { data: budgets, isLoading: isBudgetsLoading, isError: isBudgetsError } = useBudgets()
  const { data: analyticAccounts, isLoading: isAccountsLoading, isError: isAccountsError } = useAnalyticAccounts()

  const grouped = useMemo(() => {
    const incomeBudgets: Budget[] = []
    const expenseBudgets: Budget[] = []
    for (const budget of budgets ?? []) {
      const account = analyticAccounts?.find((a) => a.id === budget.analyticAccountId)
      if (account?.type === 'expense') expenseBudgets.push(budget)
      else incomeBudgets.push(budget)
    }
    return {
      incomeBudgets,
      expenseBudgets,
      plannedIncome: incomeBudgets.reduce((sum, b) => sum + b.plannedAmount, 0),
      plannedExpense: expenseBudgets.reduce((sum, b) => sum + b.plannedAmount, 0),
    }
  }, [budgets, analyticAccounts])

  const isBreakdownLoading = isBudgetsLoading || isAccountsLoading
  const isBreakdownError = isBudgetsError || isAccountsError

  return (
    <ReportLayout title="Budget vs Actual" subtitle="For the current accounting period">
      <div className="mb-8 flex flex-wrap items-end gap-4 rounded-lg bg-muted/20 p-4 border border-border/50 print:hidden">
        <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground w-full">Report Parameters</div>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Target Income
          <CurrencyInput value={targetIncome} onChange={setTargetIncome} className="w-40 bg-background" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Budgeted Expense
          <CurrencyInput value={budgetedExpense} onChange={setBudgetedExpense} className="w-40 bg-background" />
        </label>
      </div>

      {isBreakdownLoading && <LoadingState rows={3} />}
      {isBreakdownError && <ErrorState message="Failed to load budgets." />}

      {budgets && analyticAccounts && budgets.length === 0 && (
        <div className="py-12">
          <EmptyState title="No budgets yet" description="Create a budget to see it broken down here." />
        </div>
      )}

      {budgets && analyticAccounts && budgets.length > 0 && (
        <div className="mx-auto flex max-w-4xl flex-col gap-12 lg:flex-row mt-4">
          <BudgetBreakdownTable
            title="Income Budgets"
            budgets={grouped.incomeBudgets}
            analyticAccounts={analyticAccounts}
            planned={grouped.plannedIncome}
            comparisonLabel="Target Income"
            comparisonValue={targetIncome}
          />
          <BudgetBreakdownTable
            title="Expense Budgets"
            budgets={grouped.expenseBudgets}
            analyticAccounts={analyticAccounts}
            planned={grouped.plannedExpense}
            comparisonLabel="Budgeted Expense"
            comparisonValue={budgetedExpense}
            overIsBad
          />
        </div>
      )}
    </ReportLayout>
  )
}
